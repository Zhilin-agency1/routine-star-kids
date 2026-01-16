import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, ClipboardList, Heart, Briefcase, Users } from 'lucide-react';
import { format } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTasks } from '@/hooks/useTasks';
import { useChildren } from '@/hooks/useChildren';
import { useStore } from '@/hooks/useStore';
import { useJobBoard } from '@/hooks/useJobBoard';
import { useAggregatedWishlists, type AggregatedWishlistItem } from '@/hooks/useAggregatedWishlists';
import { ChildAvatar } from '@/components/ui/ChildAvatar';
import { CoinBadge } from '@/components/ui/CoinBadge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface ChildScheduleHeaderProps {
  selectedDate: Date;
  selectedChildId: string | null;
  onChildChange: (childId: string | null) => void;
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
  routineType?: 'morning' | 'evening' | null;
}

interface JobDisplayItem {
  id: string;
  title: string;
  icon: string | null;
  reward: number;
  childId: string | null;
  childName?: string;
  childAvatar?: string;
}

export const ChildScheduleHeader = ({
  selectedDate,
  selectedChildId,
  onChildChange,
  className,
}: ChildScheduleHeaderProps) => {
  const { language } = useLanguage();
  const { templates } = useTasks();
  const { children } = useChildren();
  const { items: storeItems } = useStore();
  const { jobs } = useJobBoard();
  const { wishlistItems } = useAggregatedWishlists(selectedChildId);
  
  // Single shared expansion state for all blocks
  const [panelsExpanded, setPanelsExpanded] = useState(false);
  const togglePanels = () => setPanelsExpanded(!panelsExpanded);

  // Get routines for the selected date
  const routines = useMemo(() => {
    const dayOfWeek = selectedDate.getDay();
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    
    // Filter only routine tasks (not activities, not parent activities)
    const routineTemplates = templates.filter(t => 
      t.status === 'active' && 
      t.task_category === 'routine' &&
      !(t as any).assignee_parent_id
    );
    
    // Filter by child if selected
    const filteredTemplates = selectedChildId 
      ? routineTemplates.filter(t => t.child_id === selectedChildId || t.child_id === null)
      : routineTemplates;
    
    // Filter by date/day
    const activeRoutines = filteredTemplates.filter(template => {
      const startDate = new Date(template.start_date);
      const endDate = template.end_date ? new Date(template.end_date) : null;
      
      if (selectedDate < startDate) return false;
      if (endDate && selectedDate > endDate) return false;
      
      if (template.task_type === 'recurring') {
        return template.recurring_days?.includes(dayOfWeek) ?? false;
      } else {
        return template.one_time_date === dateStr;
      }
    });
    
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
        routineType: (template as any).routine_type as 'morning' | 'evening' | null,
      };
    }).sort((a, b) => a.time.localeCompare(b.time));
  }, [templates, children, selectedDate, selectedChildId, language]);

  // Get jobs available for the selected child
  const availableJobs = useMemo(() => {
    const activeJobs = jobs.filter(job => job.active);
    
    if (!selectedChildId) {
      // All children - show all jobs with child labels
      return activeJobs.map(job => {
        const child = (job as any).child_id ? children.find(c => c.id === (job as any).child_id) : null;
        return {
          id: job.id,
          title: language === 'ru' ? job.title_ru : job.title_en,
          icon: job.icon,
          reward: job.reward_amount,
          childId: (job as any).child_id,
          childName: child?.name || (language === 'ru' ? 'Все дети' : 'All children'),
          childAvatar: child?.avatar_url || undefined,
        };
      });
    }
    
    // Filter jobs for specific child (assigned to them or to all children)
    const filteredJobs = activeJobs.filter(job => 
      (job as any).child_id === selectedChildId || (job as any).child_id === null
    );
    
    return filteredJobs.map(job => {
      const child = (job as any).child_id ? children.find(c => c.id === (job as any).child_id) : null;
      return {
        id: job.id,
        title: language === 'ru' ? job.title_ru : job.title_en,
        icon: job.icon,
        reward: job.reward_amount,
        childId: (job as any).child_id,
        childName: child?.name,
        childAvatar: child?.avatar_url || undefined,
      };
    });
  }, [jobs, selectedChildId, children, language]);

  const renderRoutineItem = (item: RoutineItem) => (
    <div 
      key={item.id}
      className="w-full flex items-center gap-2 p-2 rounded-lg bg-muted/50 border border-border"
    >
      <span className="text-lg shrink-0">{item.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm break-words line-clamp-1 leading-snug">
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
          {item.routineType && (
            <span className={cn(
              "px-1.5 py-0.5 rounded text-[10px] font-medium",
              item.routineType === 'morning' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'
            )}>
              {item.routineType === 'morning' 
                ? (language === 'ru' ? 'Утро' : 'AM') 
                : (language === 'ru' ? 'Вечер' : 'PM')}
            </span>
          )}
        </div>
      </div>
      <CoinBadge amount={item.reward} size="xs" />
    </div>
  );

  const renderWishlistItem = (item: AggregatedWishlistItem) => {
    // Get localized item name from store items
    const storeItem = storeItems.find(s => s.id === item.storeItemId);
    const itemName = storeItem 
      ? (language === 'ru' ? storeItem.name_ru : storeItem.name_en)
      : item.itemName;
    
    return (
      <div 
        key={item.id}
        className="w-full flex items-center gap-2 p-2 rounded-lg bg-muted/50 border border-border"
      >
        <span className="text-lg shrink-0">🎁</span>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm break-words line-clamp-1 leading-snug">
            {itemName}
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {!selectedChildId && (
              <div className="flex items-center gap-1">
                <ChildAvatar avatar={item.childAvatar || '🦁'} size="xs" />
                <span className="truncate max-w-[50px]">{item.childName}</span>
              </div>
            )}
            <div className="flex-1 flex items-center gap-1">
              <Progress value={item.progress} className="h-1.5 flex-1 max-w-[60px]" />
              <span className="text-[10px]">{Math.round(item.progress)}%</span>
            </div>
          </div>
        </div>
        <div className="text-right shrink-0">
          <CoinBadge amount={item.itemPrice} size="xs" />
          {item.remaining > 0 && (
            <div className="text-[10px] text-muted-foreground">
              -{item.remaining}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderJobItem = (item: JobDisplayItem) => (
    <div 
      key={item.id}
      className="w-full flex items-center gap-2 p-2 rounded-lg bg-muted/50 border border-border"
    >
      <span className="text-lg shrink-0">{item.icon || '💼'}</span>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm break-words line-clamp-1 leading-snug">
          {item.title}
        </p>
        {!selectedChildId && item.childName && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            {item.childId ? (
              <>
                <ChildAvatar avatar={item.childAvatar || '🦁'} size="xs" />
                <span className="truncate max-w-[60px]">{item.childName}</span>
              </>
            ) : (
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {item.childName}
              </span>
            )}
          </div>
        )}
      </div>
      <CoinBadge amount={item.reward} size="xs" />
    </div>
  );

  const renderBlock = (
    title: string,
    icon: React.ReactNode,
    count: number,
    expanded: boolean,
    onToggle: () => void,
    accentClass: string,
    children: React.ReactNode
  ) => (
    <div className={cn(
      "flex-1 min-w-[200px] rounded-xl border-2 p-3 bg-background",
      accentClass
    )}>
      <div className={cn(
        "flex items-center justify-between",
        expanded && count > 0 && "mb-2"
      )}>
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="font-bold text-sm">{title}</h3>
          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
            {count}
          </span>
        </div>
        {count > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="h-7 px-2 text-xs gap-1"
          >
            {expanded ? (
              <>
                {language === 'ru' ? 'Скрыть' : 'Collapse'}
                <ChevronUp className="w-3 h-3" />
              </>
            ) : (
              <>
                {language === 'ru' ? 'Развернуть' : 'Expand'}
                <ChevronDown className="w-3 h-3" />
              </>
            )}
          </Button>
        )}
      </div>
      
      {expanded && count > 0 && (
        <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
          {children}
        </div>
      )}
    </div>
  );

  return (
    <div className={className}>

      {/* Three expandable blocks */}
      <div className="flex flex-col md:flex-row gap-3">
        {/* Routine Block */}
        {renderBlock(
          language === 'ru' ? 'Рутина' : 'Routine',
          <ClipboardList className="w-5 h-5 text-emerald-500" />,
          routines.length,
          panelsExpanded,
          togglePanels,
          'border-emerald-300 bg-emerald-50/30',
          routines.map(item => renderRoutineItem(item))
        )}

        {/* Wishlist Block */}
        {renderBlock(
          language === 'ru' ? 'Желания' : 'Wishlist',
          <Heart className="w-5 h-5 text-rose-500" />,
          wishlistItems.length,
          panelsExpanded,
          togglePanels,
          'border-rose-300 bg-rose-50/30',
          wishlistItems.length > 0 
            ? wishlistItems.map(item => renderWishlistItem(item))
            : <div className="text-xs text-muted-foreground text-center py-2">
                {language === 'ru' ? 'Нет желаний' : 'No wishlist items'}
              </div>
        )}

        {/* Jobs Block */}
        {renderBlock(
          language === 'ru' ? 'Работы' : 'Jobs',
          <Briefcase className="w-5 h-5 text-blue-500" />,
          availableJobs.length,
          panelsExpanded,
          togglePanels,
          'border-blue-300 bg-blue-50/30',
          availableJobs.map(item => renderJobItem(item))
        )}
      </div>
    </div>
  );
};
