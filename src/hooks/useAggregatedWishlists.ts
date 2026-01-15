import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useFamily } from './useFamily';
import { useChildren } from './useChildren';
import { useStore } from './useStore';

export interface AggregatedWishlistItem {
  id: string;
  childId: string;
  childName: string;
  childAvatar?: string;
  childBalance: number;
  storeItemId: string;
  itemName: string;
  itemPrice: number;
  progress: number;
  remaining: number;
}

export const useAggregatedWishlists = (selectedChildId?: string | null) => {
  const { family } = useFamily();
  const { children } = useChildren();
  const { items: storeItems } = useStore();

  // Fetch all wishlists for the family's children
  const { data: allWishlists = [], isLoading } = useQuery({
    queryKey: ['wishlists_aggregated', family?.id, children.map(c => c.id).join(',')],
    queryFn: async () => {
      if (!family || children.length === 0) return [];
      
      const childIds = children.map(c => c.id);
      
      const { data, error } = await supabase
        .from('wishlists')
        .select('*')
        .in('child_id', childIds);
      
      if (error) throw error;
      return data;
    },
    enabled: !!family && children.length > 0,
  });

  // Aggregate wishlist items with store item details
  const aggregatedItems = useMemo(() => {
    const result: AggregatedWishlistItem[] = [];
    
    // Filter by selected child if provided
    const filteredWishlists = selectedChildId 
      ? allWishlists.filter(w => w.child_id === selectedChildId)
      : allWishlists;
    
    filteredWishlists.forEach(wishItem => {
      const child = children.find(c => c.id === wishItem.child_id);
      const storeItem = storeItems.find(s => s.id === wishItem.store_item_id);
      
      if (!child || !storeItem) return;
      
      const remaining = Math.max(0, storeItem.price - child.balance);
      const progress = Math.min(100, (child.balance / storeItem.price) * 100);
      
      result.push({
        id: wishItem.id,
        childId: child.id,
        childName: child.name,
        childAvatar: child.avatar_url || undefined,
        childBalance: child.balance,
        storeItemId: storeItem.id,
        itemName: storeItem.name_ru, // Will be localized in component
        itemPrice: storeItem.price,
        progress,
        remaining,
      });
    });
    
    // Sort by progress descending (closest to purchase first)
    return result.sort((a, b) => b.progress - a.progress);
  }, [allWishlists, children, storeItems, selectedChildId]);

  // Group by child for "All children" view
  const groupedByChild = useMemo(() => {
    const groups: Record<string, AggregatedWishlistItem[]> = {};
    
    aggregatedItems.forEach(item => {
      if (!groups[item.childId]) {
        groups[item.childId] = [];
      }
      groups[item.childId].push(item);
    });
    
    return groups;
  }, [aggregatedItems]);

  return {
    wishlistItems: aggregatedItems,
    groupedByChild,
    isLoading,
  };
};
