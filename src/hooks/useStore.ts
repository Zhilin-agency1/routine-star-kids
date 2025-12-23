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

  // Purchase item - uses atomic database function
  const purchaseItem = useMutation({
    mutationFn: async ({ itemId, childId }: { itemId: string; childId: string }) => {
      // Use atomic database function to prevent race conditions
      const { data, error } = await supabase.rpc('purchase_store_item', {
        p_item_id: itemId,
        p_child_id: childId,
      });
      
      if (error) throw error;
      
      const result = data as { success: boolean; error?: string; purchase_id?: string; price?: number; balance?: number };
      if (!result.success) {
        if (result.error === 'Insufficient balance') {
          throw new Error('Insufficient balance');
        }
        throw new Error(result.error || 'Failed to purchase item');
      }
      
      return { id: result.purchase_id, price: result.price } as { id: string; price: number };
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
