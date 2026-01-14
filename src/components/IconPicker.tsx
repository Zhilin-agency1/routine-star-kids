import { useState, useMemo, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIconLibrary, ICON_CATEGORIES } from '@/hooks/useIconLibrary';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface IconPickerProps {
  selectedIcon: string;
  onSelectIcon: (icon: string) => void;
  className?: string;
}

const ICONS_PER_PAGE = 50;

export const IconPicker = ({ selectedIcon, onSelectIcon, className }: IconPickerProps) => {
  const { language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [visibleCount, setVisibleCount] = useState(ICONS_PER_PAGE);

  const { icons, isLoading } = useIconLibrary(searchQuery, selectedCategory);

  // Visible icons (lazy load)
  const visibleIcons = useMemo(() => {
    return icons.slice(0, visibleCount);
  }, [icons, visibleCount]);

  const loadMore = useCallback(() => {
    setVisibleCount(prev => prev + ICONS_PER_PAGE);
  }, []);

  // Reset visible count when filters change
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setVisibleCount(ICONS_PER_PAGE);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setVisibleCount(ICONS_PER_PAGE);
  };

  const t = {
    searchPlaceholder: language === 'ru' ? 'Поиск иконки...' : 'Search icons...',
    noResults: language === 'ru' ? 'Иконки не найдены' : 'No icons found',
    loadMore: language === 'ru' ? 'Загрузить ещё' : 'Load more',
    showing: language === 'ru' ? 'Показано' : 'Showing',
    of: language === 'ru' ? 'из' : 'of',
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder={t.searchPlaceholder}
          className="pl-9 pr-9 rounded-xl"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => handleSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Category chips */}
      <ScrollArea className="w-full">
        <div className="flex gap-1.5 pb-2 min-w-max">
          {ICON_CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => handleCategoryChange(cat.key)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap",
                selectedCategory === cat.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80 text-muted-foreground"
              )}
            >
              {language === 'ru' ? cat.labelRu : cat.labelEn}
            </button>
          ))}
        </div>
      </ScrollArea>

      {/* Icons grid with limited height */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : visibleIcons.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          {t.noResults}
        </div>
      ) : (
        <div className="max-h-[240px] overflow-y-auto rounded-lg border border-border/50 p-2 bg-muted/20">
          <div className="grid grid-cols-8 gap-2">
            {visibleIcons.map((icon) => (
              <button
                key={icon.id}
                type="button"
                onClick={() => onSelectIcon(icon.emoji)}
                title={language === 'ru' ? icon.name_ru : icon.name_en}
                className={cn(
                  "w-10 h-10 rounded-xl text-2xl flex items-center justify-center transition-all hover:scale-110",
                  selectedIcon === icon.emoji
                    ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2"
                    : "bg-muted hover:bg-muted/80"
                )}
              >
                {icon.emoji}
              </button>
            ))}
          </div>

          {/* Load more button inside scrollable area */}
          {visibleCount < icons.length && (
            <div className="flex flex-col items-center gap-2 pt-3 mt-2 border-t border-border/50">
              <p className="text-xs text-muted-foreground">
                {t.showing} {visibleCount} {t.of} {icons.length}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={loadMore}
                className="rounded-xl"
              >
                {t.loadMore}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
