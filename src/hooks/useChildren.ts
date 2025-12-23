import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useFamily } from './useFamily';
import type { Database } from '@/integrations/supabase/types';

type Child = Database['public']['Tables']['children']['Row'];
type ChildInsert = Database['public']['Tables']['children']['Insert'];
type ChildUpdate = Database['public']['Tables']['children']['Update'];

export const useChildren = () => {
  const { family } = useFamily();
  const queryClient = useQueryClient();

  // Fetch all children in the family
  const { data: children = [], isLoading, error, refetch } = useQuery({
    queryKey: ['children', family?.id],
    queryFn: async () => {
      if (!family) return [];
      
      const { data, error } = await supabase
        .from('children')
        .select('*')
        .eq('family_id', family.id)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as Child[];
    },
    enabled: !!family,
  });

  // Create child
  const createChild = useMutation({
    mutationFn: async (childData: Omit<ChildInsert, 'family_id'>) => {
      if (!family) throw new Error('Family not found');
      
      const { data, error } = await supabase
        .from('children')
        .insert({
          ...childData,
          family_id: family.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as Child;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['children'] });
    },
  });

  // Update child
  const updateChild = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<ChildUpdate>) => {
      const { data, error } = await supabase
        .from('children')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Child;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['children'] });
    },
  });

  // Update child balance - uses atomic database function
  const updateBalance = useMutation({
    mutationFn: async ({ childId, amount, type, note }: { 
      childId: string; 
      amount: number; 
      type: 'earn' | 'spend' | 'adjust';
      note?: string;
    }) => {
      // Calculate the actual amount based on type
      const actualAmount = type === 'spend' ? -Math.abs(amount) : amount;
      
      // Use atomic database function to prevent race conditions
      const { data, error } = await supabase.rpc('adjust_child_balance', {
        p_child_id: childId,
        p_amount: actualAmount,
        p_note: note || null,
      });
      
      if (error) throw error;
      
      const result = data as { success: boolean; error?: string; new_balance?: number };
      if (!result.success) {
        throw new Error(result.error || 'Failed to update balance');
      }
      
      return result.new_balance || 0;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['children'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });

  // Delete child
  const deleteChild = useMutation({
    mutationFn: async (childId: string) => {
      const { error } = await supabase
        .from('children')
        .delete()
        .eq('id', childId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['children'] });
    },
  });

  return {
    children,
    isLoading,
    error,
    refetch,
    createChild,
    updateChild,
    updateBalance,
    deleteChild,
  };
};

export type { Child };
