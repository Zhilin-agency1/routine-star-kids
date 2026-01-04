import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useFamily } from './useFamily';
import { toLocalDateString } from '@/lib/dateUtils';
import { toLocalDayBoundsISO, localDateKey } from '@/lib/datetime';
import type { TaskWithTemplate } from './useTasks';

export const useAllTodayTasks = () => {
  const { family } = useFamily();

  const today = new Date();
  const dateStr = toLocalDateString(today);
  const { startISO, endISO } = toLocalDayBoundsISO(today);

  const { data: instances = [], isLoading, refetch } = useQuery({
    queryKey: ['all_today_tasks', family?.id, dateStr],
    queryFn: async () => {
      if (!family) return [];

      const { data, error } = await supabase
        .from('task_instances')
        .select(`
          *,
          template:task_templates!inner(*)
        `)
        .eq('template.family_id', family.id)
        .gte('due_datetime', startISO)
        .lte('due_datetime', endISO)
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
