import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Sun, Moon } from 'lucide-react';
import { format } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTasks } from '@/hooks/useTasks';
import { useChildren } from '@/hooks/useChildren';
import { ChildAvatar } from '@/components/ui/ChildAvatar';
import { CoinBadge } from '@/components/ui/CoinBadge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface RoutineBlocksProps {
  selectedDate: Date;
  selectedChildId: string | null;
  className?: string;
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
  className,
}: RoutineBlocksProps) => {
  const { language, t } = useLanguage();
  const { templates } = useTasks();
  const { children } = useChildren();
  
  const [morningExpanded, setMorningExpanded] = useState(false);
  const [eveningExpanded, setEveningExpanded] = useState(false);

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

  const PREVIEW_COUNT = 3;

  const renderRoutineItem = (item: RoutineItem, compact = false) => (
    <div 
      key={item.id}
      className={cn(
        "flex items-center gap-2 p-2 rounded-lg bg-muted/50 border border-border",
        compact && "py-1.5"
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
    </div>
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
    
    const displayItems = expanded ? items : items.slice(0, PREVIEW_COUNT);
    const hasMore = items.length > PREVIEW_COUNT;
    
    return (
      <div className={cn(
        "flex-1 min-w-[280px] rounded-xl border-2 p-3",
        colorClass
      )}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {icon}
            <h3 className="font-bold text-sm">{title}</h3>
            <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
              {items.length}
            </span>
          </div>
          {hasMore && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="h-7 px-2 text-xs gap-1"
            >
              {expanded ? (
                <>
                  {language === 'ru' ? 'Скрыть' : 'Hide'}
                  <ChevronUp className="w-3 h-3" />
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
        
        <div className="space-y-1.5">
          {displayItems.map(item => renderRoutineItem(item, !expanded))}
        </div>
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
