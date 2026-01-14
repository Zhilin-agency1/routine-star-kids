import React, { useState, useMemo, useEffect } from 'react';
import { ChevronDown, ChevronUp, Sun, Moon } from 'lucide-react';
import { format } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTasks } from '@/hooks/useTasks';
import { useChildren } from '@/hooks/useChildren';
import { ChildAvatar } from '@/components/ui/ChildAvatar';
import { CoinBadge } from '@/components/ui/CoinBadge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ViewMode = 'day' | 'week' | 'month';

interface RoutineBlocksProps {
  selectedDate: Date;
  selectedChildId: string | null;
  viewMode?: ViewMode;
  className?: string;
  onEditRoutine?: (templateId: string) => void;
}

interface RoutineItem {
  id: string;
  icon: string;
  title: string;
  time: string;
  childId: string | null;
  childName?: string;
  childAvatar?: string;
  reward: number;
}

export const RoutineBlocks = ({
  selectedDate,
  selectedChildId,
  viewMode = 'day',
  className,
  onEditRoutine,
}: RoutineBlocksProps) => {
  const { language, t } = useLanguage();
  const { templates } = useTasks();
  const { children } = useChildren();
  
  // In day view: start expanded, in week/month: start collapsed
  const [morningExpanded, setMorningExpanded] = useState(viewMode === 'day');
  const [eveningExpanded, setEveningExpanded] = useState(viewMode === 'day');
  
  // Reset expansion state when viewMode changes
  useEffect(() => {
    if (viewMode === 'day') {
      setMorningExpanded(true);
      setEveningExpanded(true);
    } else {
      setMorningExpanded(false);
      setEveningExpanded(false);
    }
  }, [viewMode]);

  // Get routines for the selected date and child
  const routines = useMemo(() => {
    const dayOfWeek = selectedDate.getDay();
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    
    // Filter only routine tasks (not activities)
    const routineTemplates = templates.filter(t => 
      t.status === 'active' && 
      t.task_category === 'routine'
    );
    
    // Filter by child if selected
    const filteredTemplates = selectedChildId 
      ? routineTemplates.filter(t => t.child_id === selectedChildId || t.child_id === null)
      : routineTemplates;
    
    // Filter by date/day
    const activeRoutines = filteredTemplates.filter(template => {
      // Check date range
      const startDate = new Date(template.start_date);
      const endDate = template.end_date ? new Date(template.end_date) : null;
      
      if (selectedDate < startDate) return false;
      if (endDate && selectedDate > endDate) return false;
      
      // Check recurring days or one-time
      if (template.task_type === 'recurring') {
        return template.recurring_days?.includes(dayOfWeek) ?? false;
      } else {
        return template.one_time_date === dateStr;
      }
    });
    
    // Map to routine items with child info
    return activeRoutines.map(template => {
      const child = template.child_id ? children.find(c => c.id === template.child_id) : null;
      return {
        id: template.id,
        icon: template.icon || '✨',
        title: language === 'ru' ? template.title_ru : template.title_en,
        time: template.recurring_time || '09:00',
        childId: template.child_id,
        childName: child?.name,
        childAvatar: child?.avatar_url || undefined,
        reward: template.reward_amount,
      };
    });
  }, [templates, children, selectedDate, selectedChildId, language]);

  // Split into morning (before 12:00) and evening (12:00 and after)
  const morningRoutines = useMemo(() => 
    routines
      .filter(r => {
        const hour = parseInt(r.time.split(':')[0], 10);
        return hour < 12;
      })
      .sort((a, b) => a.time.localeCompare(b.time)),
    [routines]
  );

  const eveningRoutines = useMemo(() => 
    routines
      .filter(r => {
        const hour = parseInt(r.time.split(':')[0], 10);
        return hour >= 12;
      })
      .sort((a, b) => a.time.localeCompare(b.time)),
    [routines]
  );

  const PREVIEW_COUNT = viewMode === 'day' ? 10 : 3;
  const isCompactView = viewMode !== 'day';

  const renderRoutineItem = (item: RoutineItem, compact = false) => (
    <button 
      key={item.id}
      onClick={() => onEditRoutine?.(item.id)}
      className={cn(
        "w-full flex items-center gap-2 p-2 rounded-lg bg-muted/50 border border-border text-left transition-colors",
        compact && "py-1.5",
        onEditRoutine && "hover:bg-muted cursor-pointer"
      )}
    >
      <span className="text-lg shrink-0">{item.icon}</span>
      <div className="flex-1 min-w-0">
        <p className={cn(
          "font-medium break-words line-clamp-1 leading-snug",
          compact ? "text-xs" : "text-sm"
        )}>
          {item.title}
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-mono">{item.time.slice(0, 5)}</span>
          {!selectedChildId && item.childName && (
            <div className="flex items-center gap-1">
              <ChildAvatar avatar={item.childAvatar || '🦁'} size="xs" />
              <span className="truncate max-w-[60px]">{item.childName}</span>
            </div>
          )}
        </div>
      </div>
      <CoinBadge amount={item.reward} size="xs" />
    </button>
  );

  const renderBlock = (
    title: string,
    icon: React.ReactNode,
    items: RoutineItem[],
    expanded: boolean,
    setExpanded: (v: boolean) => void,
    colorClass: string
  ) => {
    if (items.length === 0) return null;
    
    // Day view: show all items, allow "show more" if many
    // Week/Month view: collapsed by default, expand to show all
    const isDayView = viewMode === 'day';
    const shouldShowItems = isDayView || expanded;
    const displayItems = shouldShowItems 
      ? (isDayView && !expanded ? items.slice(0, PREVIEW_COUNT) : items) 
      : [];
    const hasExpandToggle = isDayView 
      ? items.length > PREVIEW_COUNT 
      : items.length > 0;
    
    return (
      <div className={cn(
        "flex-1 min-w-[280px] rounded-xl border-2 p-3",
        colorClass
      )}>
        <div className={cn(
          "flex items-center justify-between",
          shouldShowItems && displayItems.length > 0 && "mb-2"
        )}>
          <div className="flex items-center gap-2">
            {icon}
            <h3 className="font-bold text-sm">{title}</h3>
            <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
              {items.length} {isCompactView && (language === 'ru' ? 'рутин' : 'routines')}
            </span>
          </div>
          {hasExpandToggle && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="h-7 px-2 text-xs gap-1"
            >
              {expanded ? (
                <>
                  {language === 'ru' ? 'Скрыть' : 'Collapse'}
                  <ChevronUp className="w-3 h-3" />
                </>
              ) : isCompactView ? (
                <>
                  {language === 'ru' ? 'Развернуть' : 'Expand'}
                  <ChevronDown className="w-3 h-3" />
                </>
              ) : (
                <>
                  +{items.length - PREVIEW_COUNT} {language === 'ru' ? 'ещё' : 'more'}
                  <ChevronDown className="w-3 h-3" />
                </>
              )}
            </Button>
          )}
        </div>
        
        {shouldShowItems && displayItems.length > 0 && (
          <div className="space-y-1.5">
            {displayItems.map(item => renderRoutineItem(item, isCompactView && !expanded))}
          </div>
        )}
      </div>
    );
  };

  // Don't render if no routines and child is selected
  if (routines.length === 0) {
    if (selectedChildId) {
      return null; // No message needed when filtering by child
    }
    return (
      <div className={cn("text-center py-4 text-sm text-muted-foreground", className)}>
        {language === 'ru' ? 'Нет рутин на этот день' : 'No routines for this day'}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col md:flex-row gap-3", className)}>
      {renderBlock(
        language === 'ru' ? 'Утренняя рутина' : 'Morning Routine',
        <Sun className="w-4 h-4 text-amber-500" />,
        morningRoutines,
        morningExpanded,
        setMorningExpanded,
        'border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800'
      )}
      
      {renderBlock(
        language === 'ru' ? 'Вечерняя рутина' : 'Evening Routine',
        <Moon className="w-4 h-4 text-indigo-500" />,
        eveningRoutines,
        eveningExpanded,
        setEveningExpanded,
        'border-indigo-200 bg-indigo-50/50 dark:bg-indigo-950/20 dark:border-indigo-800'
      )}
    </div>
  );
};
