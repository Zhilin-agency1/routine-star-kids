import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Database } from '@/integrations/supabase/types';

type Family = Database['public']['Tables']['families']['Row'];
type FamilyInsert = Database['public']['Tables']['families']['Insert'];
type FamilyUpdate = Database['public']['Tables']['families']['Update'];

export const useFamily = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch current user's family
  const { data: family, isLoading, error, refetch } = useQuery({
    queryKey: ['family', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('families')
        .select('*')
        .eq('owner_user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Family | null;
    },
    enabled: !!user,
  });

  // Create family
  const createFamily = useMutation({
    mutationFn: async (familyData: Partial<FamilyInsert>) => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('families')
        .insert({
          owner_user_id: user.id,
          name: familyData.name || 'Моя семья',
          timezone: familyData.timezone || 'Europe/Moscow',
          default_language: familyData.default_language || 'ru',
          currency_name: familyData.currency_name || 'Coins',
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as Family;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family'] });
    },
  });

  // Update family
  const updateFamily = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<FamilyUpdate>) => {
      const { data, error } = await supabase
        .from('families')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Family;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family'] });
    },
  });

  return {
    family,
    isLoading,
    error,
    refetch,
    createFamily,
    updateFamily,
  };
};
