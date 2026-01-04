import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useFamily } from './useFamily';
import { toLocalDateString } from '@/lib/dateUtils';
import type { Database } from '@/integrations/supabase/types';

type JobBoardItem = Database['public']['Tables']['job_board_items']['Row'];
type JobBoardItemInsert = Database['public']['Tables']['job_board_items']['Insert'];
type JobBoardItemUpdate = Database['public']['Tables']['job_board_items']['Update'];
type JobClaim = Database['public']['Tables']['job_claims']['Row'];

export interface JobWithClaims extends JobBoardItem {
  claims?: JobClaim[];
}

export const useJobBoard = () => {
  const { family } = useFamily();
  const queryClient = useQueryClient();

  // Fetch job board items
  const { data: jobs = [], isLoading, refetch } = useQuery({
    queryKey: ['job_board_items', family?.id],
    queryFn: async () => {
      if (!family) return [];
      
      const { data, error } = await supabase
        .from('job_board_items')
        .select('*')
        .eq('family_id', family.id)
        .order('reward_amount', { ascending: false });
      
      if (error) throw error;
      return data as JobBoardItem[];
    },
    enabled: !!family,
  });

  // Create job
  const createJob = useMutation({
    mutationFn: async (jobData: Omit<JobBoardItemInsert, 'family_id'>) => {
      if (!family) throw new Error('Family not found');
      
      const { data, error } = await supabase
        .from('job_board_items')
        .insert({
          ...jobData,
          family_id: family.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as JobBoardItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job_board_items'] });
    },
  });

  // Update job
  const updateJob = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<JobBoardItemUpdate>) => {
      const { data, error } = await supabase
        .from('job_board_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as JobBoardItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job_board_items'] });
    },
  });

  // Delete job
  const deleteJob = useMutation({
    mutationFn: async (jobId: string) => {
      const { error } = await supabase
        .from('job_board_items')
        .delete()
        .eq('id', jobId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job_board_items'] });
    },
  });

  // Claim job (take job as child)
  const claimJob = useMutation({
    mutationFn: async ({ jobId, childId, addToRoutine = false }: { 
      jobId: string; 
      childId: string; 
      addToRoutine?: boolean;
    }) => {
      if (!family) throw new Error('Family not found');
      
      // Create claim
      const { data: claim, error: claimError } = await supabase
        .from('job_claims')
        .insert({
          job_board_item_id: jobId,
          child_id: childId,
          status: 'claimed',
        })
        .select()
        .single();
      
      if (claimError) throw claimError;
      
      // If adding to routine, create a task instance
      if (addToRoutine) {
        const { data: job, error: jobError } = await supabase
          .from('job_board_items')
          .select('*')
          .eq('id', jobId)
          .single();
        
        if (jobError) throw jobError;
        if (!job) throw new Error('Job not found');
        
        // Create a one-time task template
        const { data: template, error: templateError } = await supabase
          .from('task_templates')
          .insert({
            family_id: family.id,
            child_id: childId,
            title_ru: job.title_ru,
            title_en: job.title_en,
            description_ru: job.description_ru,
            description_en: job.description_en,
            icon: job.icon,
            reward_amount: job.reward_amount,
            task_type: 'one_time',
            one_time_date: toLocalDateString(new Date()),
          })
          .select()
          .single();
        
        if (templateError) throw templateError;
        
        // Create task instance
        const { data: instance, error: instanceError } = await supabase
          .from('task_instances')
          .insert({
            template_id: template.id,
            child_id: childId,
            due_datetime: new Date().toISOString(),
            state: 'todo',
          })
          .select()
          .single();
        
        if (instanceError) throw instanceError;
        
        // Link claim to task instance
        const { error: linkError } = await supabase
          .from('job_claims')
          .update({ linked_task_instance_id: instance.id })
          .eq('id', claim.id);
        
        if (linkError) throw linkError;
      }
      
      return claim as JobClaim;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job_claims'] });
      queryClient.invalidateQueries({ queryKey: ['task_instances'] });
      queryClient.invalidateQueries({ queryKey: ['task_templates'] });
    },
  });

  // Complete job claim - uses atomic database function
  const completeJobClaim = useMutation({
    mutationFn: async ({ claimId, childId }: { claimId: string; childId: string }) => {
      // Use atomic database function to prevent race conditions
      const { data, error } = await supabase.rpc('complete_job_claim_with_reward', {
        p_claim_id: claimId,
        p_child_id: childId,
      });
      
      if (error) throw error;
      
      const result = data as { success: boolean; error?: string; reward?: number };
      if (!result.success) {
        throw new Error(result.error || 'Failed to complete job claim');
      }
      
      return { rewardAmount: result.reward || 0 };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job_claims'] });
      queryClient.invalidateQueries({ queryKey: ['children'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });

  return {
    jobs,
    activeJobs: jobs.filter(j => j.active),
    isLoading,
    refetch,
    createJob,
    updateJob,
    deleteJob,
    claimJob,
    completeJobClaim,
  };
};

export type { JobBoardItem, JobClaim };
