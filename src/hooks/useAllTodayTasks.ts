import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useFamily } from './useFamily';
import type { TaskWithTemplate } from './useTasks';

export const useAllTodayTasks = () => {
  const { family } = useFamily();

  const today = new Date();
  const todayStart = new Date(today);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);

  const { data: instances = [], isLoading, refetch } = useQuery({
    queryKey: ['all_today_tasks', family?.id, today.toISOString().split('T')[0]],
    queryFn: async () => {
      if (!family) return [];

      const { data, error } = await supabase
        .from('task_instances')
        .select(`
          *,
          template:task_templates(*)
        `)
        .gte('due_datetime', todayStart.toISOString())
        .lte('due_datetime', todayEnd.toISOString())
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
