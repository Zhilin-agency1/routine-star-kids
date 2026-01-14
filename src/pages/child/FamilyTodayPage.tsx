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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';

type FilterType = 'all' | 'morning' | 'evening' | 'activities';

// Helper to generate a light background from child color
const getChildBgTint = (color: string | null | undefined): string => {
  if (!color) return 'bg-card/50';
  // Return a very subtle tint using the color
  return '';
};

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

  // Normalize instances to task format with category and routineType
  const tasks = useMemo(() => {
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
      // Add category and routine type for filtering
      taskCategory: (instance.template as any)?.task_category || 'routine',
      routineType: (instance.template as any)?.routine_type as 'morning' | 'evening' | null,
    }));
  }, [instances]);

  // Group tasks and activities by child
  const childColumns = useMemo(() => {
    return children.map(child => {
      const childTasks = tasks.filter(task => task.childId === child.id);
      const pending = childTasks.filter(t => t.state !== 'done');
      const done = childTasks.filter(t => t.state === 'done');
      const sortedTasks = [...pending, ...done];
      
      const childActivities = todayActivities
        .filter(a => a.child_id === child.id)
        .sort((a, b) => a.time.localeCompare(b.time));
      
      const completedCount = done.length;
      const totalCount = childTasks.length;

      return {
        child,
        tasks: sortedTasks,
        activities: childActivities,
        completedCount,
        totalCount,
        progress: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
        hasTasks: totalCount > 0 || childActivities.length > 0,
      };
    });
  }, [children, tasks, todayActivities]);

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

  // Get filtered tasks for a child
  const getFilteredTasks = (childId: string, allTasks: typeof tasks) => {
    const filter = childFilters[childId] || 'all';
    
    switch (filter) {
      case 'morning':
        return allTasks.filter(t => t.taskCategory === 'routine' && t.routineType === 'morning');
      case 'evening':
        return allTasks.filter(t => t.taskCategory === 'routine' && t.routineType === 'evening');
      case 'activities':
        return allTasks.filter(t => t.taskCategory === 'activity');
      default:
        return allTasks;
    }
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
      <div className="space-y-4 animate-fade-in">
        {/* Header with date */}
        <div className="flex items-center justify-between">
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

        {/* Children columns */}
        <div className="overflow-x-auto -mx-4 px-4 pb-2">
          <div className="flex gap-3" style={{ minWidth: 'max-content' }}>
            {childColumns.map(({ child, tasks: childTasks, activities, completedCount, totalCount, progress, hasTasks }) => {
              const filteredTasks = getFilteredTasks(child.id, childTasks);
              const currentFilter = childFilters[child.id] || 'all';
              
              // Create subtle background tint from child color
              const bgStyle = child.color 
                ? { backgroundColor: `${child.color}08` } // 8 = ~3% opacity in hex
                : {};
              
              return (
                <div 
                  key={child.id} 
                  className="w-[320px] flex-shrink-0 rounded-xl p-3"
                  style={bgStyle}
                >
                  {/* Child Header */}
                  <div className="flex items-center gap-2 mb-2">
                    <ChildAvatar avatar={child.avatar_url || '🦁'} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold truncate">{child.name}</p>
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
                          className="h-8 w-8"
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
                  <div className="flex items-center gap-1 mb-3 p-1 bg-muted/50 rounded-lg w-fit">
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

                  {/* Activities for today (only show when filter is 'all' or 'activities') */}
                  {(currentFilter === 'all' || currentFilter === 'activities') && activities.length > 0 && (
                    <div className="mb-3 space-y-1">
                      {activities.map(activity => (
                        <div 
                          key={activity.id}
                          className="flex items-center gap-2 p-2 rounded-lg bg-secondary/10 text-sm"
                        >
                          <span className="font-mono text-xs font-semibold">
                            {activity.time.slice(0, 5)}
                          </span>
                          <span className="truncate">
                            {language === 'ru' ? activity.title_ru : activity.title_en}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Tasks List */}
                  <ScrollArea className="h-[calc(100vh-380px)]">
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
                      ) : filteredTasks.length === 0 ? (
                        <div className="text-center py-6 bg-card/50 rounded-xl">
                          <p className="text-sm text-muted-foreground">
                            {language === 'ru' ? 'Нет задач в этой категории' : 'No tasks in this category'}
                          </p>
                        </div>
                      ) : (
                        filteredTasks.map(task => (
                          <SimpleTaskCard
                            key={task.id}
                            task={task}
                            onComplete={() => handleComplete(task.id, task.childId)}
                          />
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </div>
              );
            })}
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
