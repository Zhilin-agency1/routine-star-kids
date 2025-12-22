import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TaskStep {
  id: string;
  template_id: string;
  title_ru: string;
  title_en: string;
  order_index: number;
  created_at: string;
}

export interface TaskStepCompletion {
  id: string;
  task_instance_id: string;
  step_id: string;
  completed_at: string;
}

export const useTaskSteps = (templateId?: string) => {
  const queryClient = useQueryClient();

  // Fetch steps for a template
  const { data: steps = [], isLoading: stepsLoading, refetch: refetchSteps } = useQuery({
    queryKey: ['task_steps', templateId],
    queryFn: async () => {
      if (!templateId) return [];
      
      const { data, error } = await supabase
        .from('task_steps')
        .select('*')
        .eq('template_id', templateId)
        .order('order_index', { ascending: true });
      
      if (error) throw error;
      return data as TaskStep[];
    },
    enabled: !!templateId,
  });

  // Create step
  const createStep = useMutation({
    mutationFn: async (stepData: Omit<TaskStep, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('task_steps')
        .insert(stepData)
        .select()
        .single();
      
      if (error) throw error;
      return data as TaskStep;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task_steps'] });
    },
  });

  // Create multiple steps at once
  const createSteps = useMutation({
    mutationFn: async (stepsData: Omit<TaskStep, 'id' | 'created_at'>[]) => {
      if (stepsData.length === 0) return [];
      
      const { data, error } = await supabase
        .from('task_steps')
        .insert(stepsData)
        .select();
      
      if (error) throw error;
      return data as TaskStep[];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task_steps'] });
    },
  });

  // Update step
  const updateStep = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<TaskStep>) => {
      const { data, error } = await supabase
        .from('task_steps')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as TaskStep;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task_steps'] });
    },
  });

  // Delete step
  const deleteStep = useMutation({
    mutationFn: async (stepId: string) => {
      const { error } = await supabase
        .from('task_steps')
        .delete()
        .eq('id', stepId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task_steps'] });
    },
  });

  // Delete all steps for a template
  const deleteAllSteps = useMutation({
    mutationFn: async (templateId: string) => {
      const { error } = await supabase
        .from('task_steps')
        .delete()
        .eq('template_id', templateId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task_steps'] });
    },
  });

  return {
    steps,
    isLoading: stepsLoading,
    refetchSteps,
    createStep,
    createSteps,
    updateStep,
    deleteStep,
    deleteAllSteps,
  };
};

export const useStepCompletions = (instanceId?: string) => {
  const queryClient = useQueryClient();

  // Fetch completions for an instance
  const { data: completions = [], isLoading, refetch } = useQuery({
    queryKey: ['task_step_completions', instanceId],
    queryFn: async () => {
      if (!instanceId) return [];
      
      const { data, error } = await supabase
        .from('task_step_completions')
        .select('*')
        .eq('task_instance_id', instanceId);
      
      if (error) throw error;
      return data as TaskStepCompletion[];
    },
    enabled: !!instanceId,
  });

  // Toggle step completion
  const toggleStepCompletion = useMutation({
    mutationFn: async ({ instanceId, stepId, isCompleted }: { 
      instanceId: string; 
      stepId: string; 
      isCompleted: boolean;
    }) => {
      if (isCompleted) {
        // Remove completion
        const { error } = await supabase
          .from('task_step_completions')
          .delete()
          .eq('task_instance_id', instanceId)
          .eq('step_id', stepId);
        
        if (error) throw error;
      } else {
        // Add completion
        const { error } = await supabase
          .from('task_step_completions')
          .insert({
            task_instance_id: instanceId,
            step_id: stepId,
          });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task_step_completions'] });
    },
  });

  return {
    completions,
    isLoading,
    refetch,
    toggleStepCompletion,
  };
};
