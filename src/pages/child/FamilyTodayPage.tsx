import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutTemplate, Play, List, Sun, Moon, CalendarDays } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useChildren } from '@/hooks/useChildren';
import { useAllTodayTasks } from '@/hooks/useAllTodayTasks';
import { useTasks } from '@/hooks/useTasks';
import { useSchedule } from '@/hooks/useSchedule';
import { useApp } from '@/contexts/AppContext';
import { ChildAvatar } from '@/components/ui/ChildAvatar';
import { SimpleTaskCard } from '@/components/SimpleTaskCard';
import { CoinBadge } from '@/components/ui/CoinBadge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';

type FilterType = 'all' | 'morning' | 'evening' | 'activities';

interface NormalizedTask {
  id: string;
  templateId: string;
  childId: string;
  title: { ru: string; en: string };
  description: { ru: string; en: string };
  rewardAmount: number;
  state: 'todo' | 'doing' | 'done' | 'skipped' | 'cancelled';
  icon: string;
  rewardGranted: boolean;
  endDate: string | null;
  taskCategory: 'routine' | 'activity';
  routineType: 'morning' | 'evening' | null;
  isActivity?: boolean; // from activity_schedules
  time?: string; // for activities
}

export const FamilyTodayPage = () => {
  const { language } = useLanguage();
  const { role } = useApp();
  const { children } = useChildren();
  const { instances } = useAllTodayTasks();
  const { completeTask } = useTasks();
  const { todayActivities } = useSchedule();
  const navigate = useNavigate();
  
  // Per-child filter state: { [childId]: FilterType }
  const [childFilters, setChildFilters] = useState<Record<string, FilterType>>({});
  
  // Only show templates/planning features for parents
  const canManageTemplates = role === 'parent';

  // Get current date formatted
  const currentDate = useMemo(() => {
    const now = new Date();
    const locale = language === 'ru' ? ru : enUS;
    return format(now, language === 'ru' ? "d MMMM yyyy, EEEE" : "MMMM d, yyyy, EEEE", { locale });
  }, [language]);

  // Normalize task instances to unified format
  const taskItems = useMemo((): NormalizedTask[] => {
    return instances.map(instance => ({
      id: instance.id,
      templateId: instance.template_id,
      childId: instance.child_id,
      title: {
        ru: instance.template?.title_ru || '',
        en: instance.template?.title_en || '',
      },
      description: {
        ru: instance.template?.description_ru || '',
        en: instance.template?.description_en || '',
      },
      rewardAmount: instance.template?.reward_amount || 0,
      state: instance.state as 'todo' | 'doing' | 'done' | 'skipped' | 'cancelled',
      icon: instance.template?.icon || '✨',
      rewardGranted: instance.reward_granted,
      endDate: instance.template?.end_date || null,
      taskCategory: (instance.template?.task_category as 'routine' | 'activity') || 'routine',
      routineType: (instance.template?.routine_type as 'morning' | 'evening' | null) || null,
      isActivity: false,
    }));
  }, [instances]);

  // Normalize activity schedules to unified format for filtering
  const activityItems = useMemo((): NormalizedTask[] => {
    return todayActivities.map(activity => ({
      id: activity.id,
      templateId: activity.id,
      childId: activity.child_id,
      title: {
        ru: activity.title_ru,
        en: activity.title_en,
      },
      description: { ru: '', en: '' },
      rewardAmount: 0,
      state: 'todo' as const,
      icon: '📅',
      rewardGranted: false,
      endDate: null,
      taskCategory: 'activity' as const,
      routineType: null,
      isActivity: true,
      time: activity.time,
    }));
  }, [todayActivities]);

  // Group tasks and activities by child, and apply filters
  const childColumns = useMemo(() => {
    // Helper to filter items based on filter type
    const filterItems = (items: NormalizedTask[], filter: FilterType): NormalizedTask[] => {
      switch (filter) {
        case 'morning':
          return items.filter(t => 
            t.taskCategory === 'routine' && t.routineType === 'morning' && !t.isActivity
          );
        case 'evening':
          return items.filter(t => 
            t.taskCategory === 'routine' && t.routineType === 'evening' && !t.isActivity
          );
        case 'activities':
          return items.filter(t => 
            t.taskCategory === 'activity' || t.isActivity
          );
        default:
          return items;
      }
    };

    return children.map(child => {
      // Get task instances for this child
      const childTasks = taskItems.filter(task => task.childId === child.id);
      const pending = childTasks.filter(t => t.state !== 'done');
      const done = childTasks.filter(t => t.state === 'done');
      const sortedTasks = [...pending, ...done];
      
      // Get activities for this child
      const childActivities = activityItems
        .filter(a => a.childId === child.id)
        .sort((a, b) => (a.time || '').localeCompare(b.time || ''));
      
      // Combine all items
      const allItems = [...sortedTasks, ...childActivities];
      
      // Apply filter for this child
      const currentFilter = childFilters[child.id] || 'all';
      const filteredItems = filterItems(allItems, currentFilter);
      
      const completedCount = done.length;
      const totalCount = childTasks.length;

      return {
        child,
        allItems,
        filteredItems,
        currentFilter,
        tasks: sortedTasks,
        activities: childActivities,
        completedCount,
        totalCount,
        progress: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
        hasTasks: totalCount > 0 || childActivities.length > 0,
      };
    });
  }, [children, taskItems, activityItems, childFilters]);

  const handleComplete = (taskId: string, childId: string) => {
    completeTask.mutate({ instanceId: taskId, childId });
  };

  // Navigate to schedule with child filter
  const handleOpenSchedule = (childId: string) => {
    navigate(`/schedule?childId=${childId}`);
  };

  // Set filter for a specific child
  const setChildFilter = (childId: string, filter: FilterType) => {
    setChildFilters(prev => ({ ...prev, [childId]: filter }));
  };


  // Check if any child has no tasks
  const hasChildWithNoTasks = childColumns.some(col => !col.hasTasks);

  // Filter button component
  const FilterButton = ({ 
    childId, 
    filterType, 
    icon: Icon, 
    tooltip 
  }: { 
    childId: string; 
    filterType: FilterType; 
    icon: React.ElementType; 
    tooltip: string;
  }) => {
    const currentFilter = childFilters[childId] || 'all';
    const isActive = currentFilter === filterType;
    
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => setChildFilter(childId, filterType)}
            className={cn(
              "p-1.5 rounded-md transition-all",
              isActive 
                ? "bg-primary text-primary-foreground shadow-sm" 
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
            aria-label={tooltip}
          >
            <Icon className="w-3.5 h-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          {tooltip}
        </TooltipContent>
      </Tooltip>
    );
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="space-y-4 animate-fade-in h-full flex flex-col">
        {/* Header with date */}
        <div className="flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-2xl font-bold">
              {language === 'ru' ? 'Сегодня' : 'Today'}
            </h1>
            <p className="text-sm text-muted-foreground capitalize">
              {currentDate}
            </p>
          </div>
          
          {/* Primary CTA: Apply Template (only for parents) */}
          {canManageTemplates && hasChildWithNoTasks && (
            <Button
              onClick={() => navigate('/parent/templates')}
              size="sm"
              className="min-h-[44px]"
            >
              <LayoutTemplate className="w-4 h-4 mr-2" />
              {language === 'ru' ? 'Шаблоны' : 'Templates'}
            </Button>
          )}
        </div>

        {/* Children columns - horizontal scroll container */}
        <div className="flex-1 overflow-hidden">
          <div className="overflow-x-auto h-full pb-4 -mx-4 px-4">
            <div className="flex gap-3 h-full" style={{ minWidth: 'max-content' }}>
              {childColumns.map(({ child, filteredItems, currentFilter, completedCount, totalCount, progress, hasTasks }) => {
                
                // Create subtle background tint from child color
                const bgStyle = child.color 
                  ? { backgroundColor: `${child.color}08` } // 8 = ~3% opacity in hex
                  : {};
                
                return (
                  <div 
                    key={child.id} 
                    className="w-[320px] flex-shrink-0 rounded-xl p-3 flex flex-col h-full"
                    style={bgStyle}
                  >
                    {/* Child Header with Balance */}
                    <div className="flex items-center gap-2 mb-2 flex-shrink-0">
                      <ChildAvatar avatar={child.avatar_url || '🦁'} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold truncate">{child.name}</p>
                          {/* Balance display */}
                          <CoinBadge amount={child.balance} size="xs" className="flex-shrink-0" />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {completedCount}/{totalCount} • {progress}%
                        </p>
                      </div>
                      {/* Quick action to open schedule for this child */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 flex-shrink-0"
                            onClick={() => handleOpenSchedule(child.id)}
                          >
                            <Play className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="text-xs">
                          {language === 'ru' ? 'Открыть расписание' : 'Open schedule'}
                        </TooltipContent>
                      </Tooltip>
                    </div>

                    {/* Per-child quick filters */}
                    <div className="flex items-center gap-1 mb-3 p-1 bg-muted/50 rounded-lg w-fit flex-shrink-0">
                      <FilterButton 
                        childId={child.id} 
                        filterType="all" 
                        icon={List} 
                        tooltip={language === 'ru' ? 'Все' : 'All'} 
                      />
                      <FilterButton 
                        childId={child.id} 
                        filterType="morning" 
                        icon={Sun} 
                        tooltip={language === 'ru' ? 'Утренние рутины' : 'Morning routines'} 
                      />
                      <FilterButton 
                        childId={child.id} 
                        filterType="evening" 
                        icon={Moon} 
                        tooltip={language === 'ru' ? 'Вечерние рутины' : 'Evening routines'} 
                      />
                      <FilterButton 
                        childId={child.id} 
                        filterType="activities" 
                        icon={CalendarDays} 
                        tooltip={language === 'ru' ? 'Занятия' : 'Activities'} 
                      />
                    </div>

                    {/* Tasks/Activities List */}
                    <ScrollArea className="flex-1 min-h-0">
                      <div className="space-y-2 pr-2">
                        {!hasTasks ? (
                          <div className="text-center py-6 bg-card/50 rounded-xl">
                            <span className="text-2xl block mb-2">📋</span>
                            <p className="text-sm text-muted-foreground mb-3">
                              {language === 'ru' 
                                ? (canManageTemplates ? 'Нет плана' : 'План ещё не готов') 
                                : (canManageTemplates ? 'No plan' : 'No plan yet')}
                            </p>
                            {canManageTemplates && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate('/parent/templates')}
                                className="min-h-[40px]"
                              >
                                <LayoutTemplate className="w-4 h-4 mr-2" />
                                {language === 'ru' ? 'Применить шаблон' : 'Apply template'}
                              </Button>
                            )}
                          </div>
                        ) : filteredItems.length === 0 ? (
                          <div className="text-center py-6 bg-card/50 rounded-xl">
                            <p className="text-sm text-muted-foreground">
                              {language === 'ru' ? 'Нет задач в этой категории' : 'No tasks in this category'}
                            </p>
                          </div>
                        ) : (
                          filteredItems.map(item => (
                            item.isActivity ? (
                              // Activity card (from activity_schedules)
                              <div 
                                key={item.id}
                                className="flex items-center gap-2 p-2 rounded-lg bg-secondary/10 text-sm"
                              >
                                <span className="font-mono text-xs font-semibold">
                                  {item.time?.slice(0, 5)}
                                </span>
                                <span className="truncate">
                                  {language === 'ru' ? item.title.ru : item.title.en}
                                </span>
                              </div>
                            ) : (
                              // Task card (from task_instances)
                              <SimpleTaskCard
                                key={item.id}
                                task={item}
                                onComplete={() => handleComplete(item.id, item.childId)}
                                canToggleSteps={item.state !== 'done' && item.state !== 'cancelled' && item.state !== 'skipped'}
                              />
                            )
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {children.length === 0 && (
          <div className="text-center py-8 bg-card rounded-2xl">
            <span className="text-4xl block mb-2">👨‍👩‍👧</span>
            <p className="text-muted-foreground">
              {language === 'ru' ? 'Пока нет детей в семье' : 'No children in family yet'}
            </p>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};
