import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useFamily } from './useFamily';
import type { TaskWithTemplate } from './useTasks';

export const useAllTodayTasks = () => {
  const { family } = useFamily();

  const today = new Date();
  // Format date as YYYY-MM-DD in local timezone
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;

  const { data: instances = [], isLoading, refetch } = useQuery({
    queryKey: ['all_today_tasks', family?.id, today.toISOString().split('T')[0]],
    queryFn: async () => {
      if (!family) return [];

      const { data, error } = await supabase
        .from('task_instances')
        .select(`
          *,
          template:task_templates!inner(*)
        `)
        .eq('template.family_id', family.id)
        .gte('due_datetime', `${dateStr}T00:00:00`)
        .lte('due_datetime', `${dateStr}T23:59:59.999`)
        .order('due_datetime', { ascending: true });

      if (error) throw error;
      return data as unknown as TaskWithTemplate[];
    },
    enabled: !!family,
  });

  return {
    instances,
    isLoading,
    refetch,
  };
};
