import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useFamily } from './useFamily';
import type { Database } from '@/integrations/supabase/types';

type TaskTemplate = Database['public']['Tables']['task_templates']['Row'];
type TaskTemplateInsert = Database['public']['Tables']['task_templates']['Insert'];
type TaskTemplateUpdate = Database['public']['Tables']['task_templates']['Update'];
type TaskInstance = Database['public']['Tables']['task_instances']['Row'];
type TaskInstanceInsert = Database['public']['Tables']['task_instances']['Insert'];

export interface TaskWithTemplate extends TaskInstance {
  template: TaskTemplate;
}

export const useTasks = (childId?: string, date?: Date) => {
  const { family } = useFamily();
  const queryClient = useQueryClient();

  // Fetch task templates for the family
  const { 
    data: templates = [], 
    isLoading: templatesLoading,
    refetch: refetchTemplates 
  } = useQuery({
    queryKey: ['task_templates', family?.id],
    queryFn: async () => {
      if (!family) return [];
      
      const { data, error } = await supabase
        .from('task_templates')
        .select('*')
        .eq('family_id', family.id)
        .eq('status', 'active')
        .order('recurring_time', { ascending: true });
      
      if (error) throw error;
      return data as TaskTemplate[];
    },
    enabled: !!family,
  });

  // Fetch task instances for a specific child and date
  const { 
    data: instances = [], 
    isLoading: instancesLoading,
    refetch: refetchInstances 
  } = useQuery({
    queryKey: ['task_instances', childId, date?.toISOString().split('T')[0]],
    queryFn: async () => {
      if (!childId) return [];
      
      let query = supabase
        .from('task_instances')
        .select(`
          *,
          template:task_templates(*)
        `)
        .eq('child_id', childId);
      
      if (date) {
        // Format date as YYYY-MM-DD in local timezone
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        
        // Use date casting to compare only the date part
        query = query
          .gte('due_datetime', `${dateStr}T00:00:00`)
          .lte('due_datetime', `${dateStr}T23:59:59.999`);
      }
      
      const { data, error } = await query.order('due_datetime', { ascending: true });
      
      if (error) throw error;
      return data as unknown as TaskWithTemplate[];
    },
    enabled: !!childId,
  });

  // Create task template
  const createTemplate = useMutation({
    mutationFn: async (templateData: Omit<TaskTemplateInsert, 'family_id'>) => {
      if (!family) throw new Error('Family not found');
      
      const { data, error } = await supabase
        .from('task_templates')
        .insert({
          ...templateData,
          family_id: family.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as TaskTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task_templates'] });
    },
  });

  // Update task template
  const updateTemplate = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<TaskTemplateUpdate>) => {
      const { data, error } = await supabase
        .from('task_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as TaskTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task_templates'] });
    },
  });

  // Create task instance
  const createInstance = useMutation({
    mutationFn: async (instanceData: TaskInstanceInsert) => {
      const { data, error } = await supabase
        .from('task_instances')
        .insert(instanceData)
        .select()
        .single();
      
      if (error) throw error;
      return data as TaskInstance;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task_instances'] });
    },
  });

  // Update task instance state
  const updateInstanceState = useMutation({
    mutationFn: async ({ 
      instanceId, 
      state, 
      grantReward = false 
    }: { 
      instanceId: string; 
      state: string; 
      grantReward?: boolean;
    }) => {
      const updates: Partial<TaskInstance> = { state };
      
      if (state === 'done') {
        updates.completed_at = new Date().toISOString();
        if (grantReward) {
          updates.reward_granted = true;
        }
      }
      
      const { data, error } = await supabase
        .from('task_instances')
        .update(updates)
        .eq('id', instanceId)
        .select(`
          *,
          template:task_templates(*)
        `)
        .single();
      
      if (error) throw error;
      return data as unknown as TaskWithTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task_instances'] });
    },
  });

  // Complete task (update state + grant reward) - uses atomic database function
  const completeTask = useMutation({
    mutationFn: async ({ instanceId, childId }: { instanceId: string; childId: string }) => {
      // Use atomic database function to prevent race conditions
      const { data, error } = await supabase.rpc('complete_task_with_reward', {
        p_instance_id: instanceId,
        p_child_id: childId,
      });
      
      if (error) throw error;
      
      const result = data as { success: boolean; error?: string; reward?: number };
      if (!result.success) {
        throw new Error(result.error || 'Failed to complete task');
      }
      
      return { rewardAmount: result.reward || 0 };
    },
    onMutate: async ({ instanceId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['task_instances'] });
      await queryClient.cancelQueries({ queryKey: ['all_today_tasks'] });

      // Snapshot previous values
      const previousAllTodayTasks = queryClient.getQueryData(['all_today_tasks', family?.id, new Date().toISOString().split('T')[0]]);

      // Optimistically update all_today_tasks
      queryClient.setQueryData(
        ['all_today_tasks', family?.id, new Date().toISOString().split('T')[0]],
        (old: TaskWithTemplate[] | undefined) => {
          if (!old) return old;
          return old.map(task => 
            task.id === instanceId 
              ? { ...task, state: 'done', completed_at: new Date().toISOString(), reward_granted: true }
              : task
          );
        }
      );

      return { previousAllTodayTasks };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousAllTodayTasks) {
        queryClient.setQueryData(
          ['all_today_tasks', family?.id, new Date().toISOString().split('T')[0]],
          context.previousAllTodayTasks
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['task_instances'] });
      queryClient.invalidateQueries({ queryKey: ['all_today_tasks'] });
      queryClient.invalidateQueries({ queryKey: ['children'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });

  // Uncomplete task (revert from done to todo and remove reward) - uses atomic database function
  const uncompleteTask = useMutation({
    mutationFn: async ({ instanceId, childId }: { instanceId: string; childId: string }) => {
      // Use atomic database function to prevent race conditions
      const { data, error } = await supabase.rpc('uncomplete_task_with_refund', {
        p_instance_id: instanceId,
        p_child_id: childId,
      });
      
      if (error) throw error;
      
      const result = data as { success: boolean; error?: string; refunded?: boolean; amount?: number };
      if (!result.success) {
        throw new Error(result.error || 'Failed to uncomplete task');
      }
      
      return { rewardAmount: result.amount || 0 };
    },
    onMutate: async ({ instanceId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['task_instances'] });
      await queryClient.cancelQueries({ queryKey: ['all_today_tasks'] });

      // Snapshot previous values
      const previousAllTodayTasks = queryClient.getQueryData(['all_today_tasks', family?.id, new Date().toISOString().split('T')[0]]);

      // Optimistically update all_today_tasks
      queryClient.setQueryData(
        ['all_today_tasks', family?.id, new Date().toISOString().split('T')[0]],
        (old: TaskWithTemplate[] | undefined) => {
          if (!old) return old;
          return old.map(task => 
            task.id === instanceId 
              ? { ...task, state: 'todo', completed_at: null, reward_granted: false }
              : task
          );
        }
      );

      return { previousAllTodayTasks };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousAllTodayTasks) {
        queryClient.setQueryData(
          ['all_today_tasks', family?.id, new Date().toISOString().split('T')[0]],
          context.previousAllTodayTasks
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['task_instances'] });
      queryClient.invalidateQueries({ queryKey: ['all_today_tasks'] });
      queryClient.invalidateQueries({ queryKey: ['children'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
  const cancelInstance = useMutation({
    mutationFn: async ({ 
      instanceId, 
      scope 
    }: { 
      instanceId: string; 
      scope: 'this_only' | 'this_and_future';
    }) => {
      if (scope === 'this_only') {
        const { error } = await supabase
          .from('task_instances')
          .update({
            state: 'cancelled',
            cancellation_scope: 'this_only',
          })
          .eq('id', instanceId);
        
        if (error) throw error;
      } else {
        // Get the instance to find template
        const { data: instance, error: fetchError } = await supabase
          .from('task_instances')
          .select('template_id, due_datetime')
          .eq('id', instanceId)
          .single();
        
        if (fetchError) throw fetchError;
        if (!instance) throw new Error('Instance not found');
        
        // Cancel this instance
        const { error: cancelError } = await supabase
          .from('task_instances')
          .update({
            state: 'cancelled',
            cancellation_scope: 'this_and_future',
          })
          .eq('id', instanceId);
        
        if (cancelError) throw cancelError;
        
        // Update template end_date to stop future instances
        const { error: templateError } = await supabase
          .from('task_templates')
          .update({
            end_date: new Date().toISOString().split('T')[0],
          })
          .eq('id', instance.template_id);
        
        if (templateError) throw templateError;
        
        // Cancel all future instances
        const { error: futureError } = await supabase
          .from('task_instances')
          .update({
            state: 'cancelled',
            cancellation_scope: 'this_and_future',
          })
          .eq('template_id', instance.template_id)
          .gte('due_datetime', instance.due_datetime)
          .neq('state', 'done');
        
        if (futureError) throw futureError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task_instances'] });
      queryClient.invalidateQueries({ queryKey: ['task_templates'] });
    },
  });

  // Delete template
  const deleteTemplate = useMutation({
    mutationFn: async (templateId: string) => {
      const { error } = await supabase
        .from('task_templates')
        .delete()
        .eq('id', templateId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task_templates'] });
      queryClient.invalidateQueries({ queryKey: ['task_instances'] });
    },
  });

  return {
    templates,
    instances,
    isLoading: templatesLoading || instancesLoading,
    refetchTemplates,
    refetchInstances,
    createTemplate,
    updateTemplate,
    createInstance,
    updateInstanceState,
    completeTask,
    uncompleteTask,
    cancelInstance,
    deleteTemplate,
  };
};

export type { TaskTemplate, TaskInstance };
