import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useFamily } from './useFamily';
import type { Database } from '@/integrations/supabase/types';

type StoreItem = Database['public']['Tables']['store_items']['Row'];
type StoreItemInsert = Database['public']['Tables']['store_items']['Insert'];
type StoreItemUpdate = Database['public']['Tables']['store_items']['Update'];
type Purchase = Database['public']['Tables']['purchases']['Row'];

export const useStore = () => {
  const { family } = useFamily();
  const queryClient = useQueryClient();

  // Fetch store items
  const { data: items = [], isLoading, refetch } = useQuery({
    queryKey: ['store_items', family?.id],
    queryFn: async () => {
      if (!family) return [];
      
      const { data, error } = await supabase
        .from('store_items')
        .select('*')
        .eq('family_id', family.id)
        .order('price', { ascending: true });
      
      if (error) throw error;
      return data as StoreItem[];
    },
    enabled: !!family,
  });

  // Create store item
  const createItem = useMutation({
    mutationFn: async (itemData: Omit<StoreItemInsert, 'family_id'>) => {
      if (!family) throw new Error('Family not found');
      
      const { data, error } = await supabase
        .from('store_items')
        .insert({
          ...itemData,
          family_id: family.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as StoreItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store_items'] });
    },
  });

  // Update store item
  const updateItem = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<StoreItemUpdate>) => {
      const { data, error } = await supabase
        .from('store_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as StoreItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store_items'] });
    },
  });

  // Delete store item
  const deleteItem = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('store_items')
        .delete()
        .eq('id', itemId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store_items'] });
    },
  });

  // Purchase item
  const purchaseItem = useMutation({
    mutationFn: async ({ itemId, childId }: { itemId: string; childId: string }) => {
      if (!family) throw new Error('Family not found');
      
      // Get item and child
      const { data: item, error: itemError } = await supabase
        .from('store_items')
        .select('*')
        .eq('id', itemId)
        .single();
      
      if (itemError) throw itemError;
      if (!item) throw new Error('Item not found');
      
      const { data: child, error: childError } = await supabase
        .from('children')
        .select('balance')
        .eq('id', childId)
        .single();
      
      if (childError) throw childError;
      if (!child) throw new Error('Child not found');
      
      if (child.balance < item.price) {
        throw new Error('Insufficient balance');
      }
      
      // Create purchase
      const { data: purchase, error: purchaseError } = await supabase
        .from('purchases')
        .insert({
          family_id: family.id,
          child_id: childId,
          store_item_id: itemId,
          price_at_purchase: item.price,
          status: 'requested',
        })
        .select()
        .single();
      
      if (purchaseError) throw purchaseError;
      
      // Update child balance
      const { error: balanceError } = await supabase
        .from('children')
        .update({ balance: child.balance - item.price })
        .eq('id', childId);
      
      if (balanceError) throw balanceError;
      
      // Create transaction
      const { error: txError } = await supabase
        .from('transactions')
        .insert({
          family_id: family.id,
          child_id: childId,
          transaction_type: 'spend',
          amount: -item.price,
          source: 'store_purchase',
          source_id: purchase.id,
        });
      
      if (txError) throw txError;
      
      return purchase as Purchase;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['children'] });
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });

  return {
    items,
    activeItems: items.filter(i => i.active),
    isLoading,
    refetch,
    createItem,
    updateItem,
    deleteItem,
    purchaseItem,
  };
};

export type { StoreItem, Purchase };
