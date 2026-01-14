import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMemo } from 'react';

export interface IconItem {
  id: string;
  key: string;
  emoji: string;
  name_en: string;
  name_ru: string;
  tags_en: string[];
  tags_ru: string[];
  category: string;
}

export const ICON_CATEGORIES = [
  { key: 'all', labelEn: 'All', labelRu: 'Все' },
  { key: 'home', labelEn: 'Home', labelRu: 'Дом' },
  { key: 'hygiene', labelEn: 'Hygiene', labelRu: 'Гигиена' },
  { key: 'food', labelEn: 'Food', labelRu: 'Еда' },
  { key: 'school', labelEn: 'School', labelRu: 'Школа' },
  { key: 'sports', labelEn: 'Sports', labelRu: 'Спорт' },
  { key: 'chores', labelEn: 'Chores', labelRu: 'Обязанности' },
  { key: 'fun', labelEn: 'Fun', labelRu: 'Развлечения' },
  { key: 'pets', labelEn: 'Pets', labelRu: 'Питомцы' },
  { key: 'travel', labelEn: 'Travel', labelRu: 'Путешествия' },
  { key: 'health', labelEn: 'Health', labelRu: 'Здоровье' },
  { key: 'other', labelEn: 'Other', labelRu: 'Другое' },
];

export const useIconLibrary = (searchQuery: string = '', category: string = 'all') => {
  const { data: icons = [], isLoading, error } = useQuery({
    queryKey: ['icon_library'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('icon_library')
        .select('*')
        .order('category', { ascending: true })
        .order('name_en', { ascending: true });
      
      if (error) throw error;
      return data as IconItem[];
    },
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });

  // Filter icons based on search and category
  const filteredIcons = useMemo(() => {
    let result = icons;

    // Filter by category
    if (category && category !== 'all') {
      result = result.filter(icon => icon.category === category);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(icon => {
        const matchesName = 
          icon.name_en.toLowerCase().includes(query) ||
          icon.name_ru.toLowerCase().includes(query);
        const matchesTags = 
          icon.tags_en.some(tag => tag.toLowerCase().includes(query)) ||
          icon.tags_ru.some(tag => tag.toLowerCase().includes(query));
        return matchesName || matchesTags;
      });
    }

    return result;
  }, [icons, searchQuery, category]);

  return {
    icons: filteredIcons,
    allIcons: icons,
    isLoading,
    error,
    categories: ICON_CATEGORIES,
  };
};
