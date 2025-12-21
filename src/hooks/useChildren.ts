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

  // Update child balance
  const updateBalance = useMutation({
    mutationFn: async ({ childId, amount, type, note }: { 
      childId: string; 
      amount: number; 
      type: 'earn' | 'spend' | 'adjust';
      note?: string;
    }) => {
      if (!family) throw new Error('Family not found');
      
      const child = children.find(c => c.id === childId);
      if (!child) throw new Error('Child not found');
      
      const newBalance = type === 'spend' 
        ? child.balance - Math.abs(amount)
        : child.balance + amount;
      
      // Update balance
      const { error: balanceError } = await supabase
        .from('children')
        .update({ balance: newBalance })
        .eq('id', childId);
      
      if (balanceError) throw balanceError;
      
      // Create transaction record
      const { error: txError } = await supabase
        .from('transactions')
        .insert({
          family_id: family.id,
          child_id: childId,
          transaction_type: type,
          amount: type === 'spend' ? -Math.abs(amount) : amount,
          source: 'manual',
          note,
        });
      
      if (txError) throw txError;
      
      return newBalance;
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
