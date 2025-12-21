import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useFamily } from './useFamily';
import type { Database } from '@/integrations/supabase/types';

type Transaction = Database['public']['Tables']['transactions']['Row'];

export const useTransactions = (childId?: string, limit = 50) => {
  const { family } = useFamily();

  const { data: transactions = [], isLoading, refetch } = useQuery({
    queryKey: ['transactions', family?.id, childId, limit],
    queryFn: async () => {
      if (!family) return [];
      
      let query = supabase
        .from('transactions')
        .select('*')
        .eq('family_id', family.id)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (childId) {
        query = query.eq('child_id', childId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as Transaction[];
    },
    enabled: !!family,
  });

  // Calculate stats
  const stats = transactions.reduce(
    (acc, tx) => {
      if (tx.transaction_type === 'earn') {
        acc.totalEarned += tx.amount;
      } else if (tx.transaction_type === 'spend') {
        acc.totalSpent += Math.abs(tx.amount);
      }
      return acc;
    },
    { totalEarned: 0, totalSpent: 0 }
  );

  return {
    transactions,
    isLoading,
    refetch,
    totalEarned: stats.totalEarned,
    totalSpent: stats.totalSpent,
  };
};

export type { Transaction };
