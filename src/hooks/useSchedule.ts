import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useFamily } from './useFamily';
import type { Database } from '@/integrations/supabase/types';

type ActivitySchedule = Database['public']['Tables']['activity_schedules']['Row'];
type ActivityScheduleInsert = Database['public']['Tables']['activity_schedules']['Insert'];
type ActivityScheduleUpdate = Database['public']['Tables']['activity_schedules']['Update'];

export const useSchedule = (childId?: string) => {
  const { family } = useFamily();
  const queryClient = useQueryClient();

  // Fetch activity schedules
  const { data: activities = [], isLoading, refetch } = useQuery({
    queryKey: ['activity_schedules', family?.id, childId],
    queryFn: async () => {
      if (!family) return [];
      
      let query = supabase
        .from('activity_schedules')
        .select('*')
        .eq('family_id', family.id)
        .order('time', { ascending: true });
      
      if (childId) {
        query = query.eq('child_id', childId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as ActivitySchedule[];
    },
    enabled: !!family,
  });

  // Create activity
  const createActivity = useMutation({
    mutationFn: async (activityData: Omit<ActivityScheduleInsert, 'family_id'>) => {
      if (!family) throw new Error('Family not found');
      
      const { data, error } = await supabase
        .from('activity_schedules')
        .insert({
          ...activityData,
          family_id: family.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as ActivitySchedule;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity_schedules'] });
    },
  });

  // Update activity
  const updateActivity = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<ActivityScheduleUpdate>) => {
      const { data, error } = await supabase
        .from('activity_schedules')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as ActivitySchedule;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity_schedules'] });
    },
  });

  // Delete activity
  const deleteActivity = useMutation({
    mutationFn: async (activityId: string) => {
      const { error } = await supabase
        .from('activity_schedules')
        .delete()
        .eq('id', activityId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity_schedules'] });
    },
  });

  // Get activities for today
  const todayActivities = activities.filter(activity => {
    const today = new Date().getDay();
    return activity.recurring_days?.includes(today) ?? false;
  });

  return {
    activities,
    todayActivities,
    isLoading,
    refetch,
    createActivity,
    updateActivity,
    deleteActivity,
  };
};

export type { ActivitySchedule };
