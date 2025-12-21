import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useFamily } from './useFamily';

export interface Wishlist {
  id: string;
  child_id: string;
  store_item_id: string;
  created_at: string;
}

export const useWishlist = (childId?: string) => {
  const { family } = useFamily();
  const queryClient = useQueryClient();

  const { data: wishlistItems = [], isLoading, refetch } = useQuery({
    queryKey: ['wishlist', childId],
    queryFn: async () => {
      if (!childId) return [];
      
      const { data, error } = await supabase
        .from('wishlists')
        .select('*')
        .eq('child_id', childId);
      
      if (error) throw error;
      return data as Wishlist[];
    },
    enabled: !!childId,
  });

  const addToWishlist = useMutation({
    mutationFn: async ({ childId, storeItemId }: { childId: string; storeItemId: string }) => {
      const { data, error } = await supabase
        .from('wishlists')
        .insert({
          child_id: childId,
          store_item_id: storeItemId,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    },
  });

  const removeFromWishlist = useMutation({
    mutationFn: async ({ childId, storeItemId }: { childId: string; storeItemId: string }) => {
      const { error } = await supabase
        .from('wishlists')
        .delete()
        .eq('child_id', childId)
        .eq('store_item_id', storeItemId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    },
  });

  const isInWishlist = (storeItemId: string) => {
    return wishlistItems.some(item => item.store_item_id === storeItemId);
  };

  return {
    wishlistItems,
    isLoading,
    refetch,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
  };
};
