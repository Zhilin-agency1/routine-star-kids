import { useState, useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Filter, BookOpen, Sparkles } from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, addDays, addWeeks, addMonths, isSameDay, isToday, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSchedule } from '@/hooks/useSchedule';
import { useChildren } from '@/hooks/useChildren';
import { useTasks } from '@/hooks/useTasks';
import { Button } from '@/components/ui/button';
import { ChildAvatar } from '@/components/ui/ChildAvatar';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

type ViewMode = 'day' | 'week' | 'month';

interface ScheduleItem {
  id: string;
  child_id: string;
  time: string;
  title_ru: string;
  title_en: string;
  location?: string | null;
  duration?: number;
  type: 'activity' | 'task';
  icon?: string | null;
}

export const FamilySchedulePage = () => {
  const { language } = useLanguage();
  const { children } = useChildren();
  const { activities } = useSchedule();
  const { templates } = useTasks();
  
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

  const locale = language === 'ru' ? ru : undefined;

  // Filter activity_schedules
  const filteredActivities = useMemo(() => {
    if (!selectedChildId) return activities;
    return activities.filter(a => a.child_id === selectedChildId);
  }, [activities, selectedChildId]);

  // Filter task templates with task_category='activity'
  const activityTasks = useMemo(() => {
    const tasks = templates.filter(t => t.task_category === 'activity' && t.status === 'active');
    if (!selectedChildId) return tasks;
    return tasks.filter(t => t.child_id === selectedChildId);
  }, [templates, selectedChildId]);

  const getItemsForDay = (date: Date): ScheduleItem[] => {
    const dayOfWeek = date.getDay();
    const dateStr = format(date, 'yyyy-MM-dd');
    const items: ScheduleItem[] = [];
    
    // Add activity_schedules
    filteredActivities.forEach(activity => {
      if (activity.recurring_days?.includes(dayOfWeek)) {
        items.push({
          id: activity.id,
          child_id: activity.child_id,
          time: activity.time,
          title_ru: activity.title_ru,
          title_en: activity.title_en,
          location: activity.location,
          duration: activity.duration,
          type: 'activity',
        });
      }
    });
    
    // Add task templates with task_category='activity'
    activityTasks.forEach(task => {
      // Check if task is active for this date
      const startDate = parseISO(task.start_date);
      const endDate = task.end_date ? parseISO(task.end_date) : null;
      
      if (date < startDate) return;
      if (endDate && date > endDate) return;
      
      // Check recurring days or one-time date
      const isRecurring = task.task_type === 'recurring' && task.recurring_days?.includes(dayOfWeek);
      const isOneTime = task.task_type === 'one_time' && task.one_time_date === dateStr;
      
      if (isRecurring || isOneTime) {
        items.push({
          id: task.id,
          child_id: task.child_id || '',
          time: task.recurring_time || '09:00',
          title_ru: task.title_ru,
          title_en: task.title_en,
          type: 'task',
          icon: task.icon,
        });
      }
    });
    
    return items;
  };

  const navigatePrev = () => {
    if (viewMode === 'day') setCurrentDate(addDays(currentDate, -1));
    else if (viewMode === 'week') setCurrentDate(addWeeks(currentDate, -1));
    else setCurrentDate(addMonths(currentDate, -1));
  };

  const navigateNext = () => {
    if (viewMode === 'day') setCurrentDate(addDays(currentDate, 1));
    else if (viewMode === 'week') setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addMonths(currentDate, 1));
  };

  const getDaysToShow = () => {
    if (viewMode === 'day') {
      return [currentDate];
    } else if (viewMode === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      const end = endOfWeek(currentDate, { weekStartsOn: 1 });
      return eachDayOfInterval({ start, end });
    } else {
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      return eachDayOfInterval({ start, end });
    }
  };

  const days = getDaysToShow();

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-secondary/20 flex items-center justify-center">
          <Calendar className="w-6 h-6 text-secondary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">
            {language === 'ru' ? 'Расписание' : 'Schedule'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {language === 'ru' ? 'Все занятия семьи' : 'All family activities'}
          </p>
        </div>
      </div>

      {/* View Mode Tabs */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg">
        {(['day', 'week', 'month'] as ViewMode[]).map(mode => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={cn(
              'flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all',
              viewMode === mode 
                ? 'bg-background shadow text-foreground' 
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {language === 'ru' 
              ? (mode === 'day' ? 'День' : mode === 'week' ? 'Неделя' : 'Месяц')
              : (mode === 'day' ? 'Day' : mode === 'week' ? 'Week' : 'Month')
            }
          </button>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={navigatePrev}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <span className="font-semibold">
          {viewMode === 'day' && format(currentDate, 'd MMMM', { locale })}
          {viewMode === 'week' && `${format(days[0], 'd MMM', { locale })} - ${format(days[days.length - 1], 'd MMM', { locale })}`}
          {viewMode === 'month' && format(currentDate, 'MMMM yyyy', { locale })}
        </span>
        <Button variant="ghost" size="icon" onClick={navigateNext}>
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Child Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4">
        <div className="flex items-center gap-1 mr-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
        </div>
        <button
          onClick={() => setSelectedChildId(null)}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap',
            selectedChildId === null 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-muted hover:bg-muted/80'
          )}
        >
          {language === 'ru' ? 'Все' : 'All'}
        </button>
        {children.map(child => (
          <button
            key={child.id}
            onClick={() => setSelectedChildId(child.id)}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap',
              selectedChildId === child.id 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted hover:bg-muted/80'
            )}
          >
            <ChildAvatar avatar={child.avatar_url || '🦁'} size="xs" />
            {child.name}
          </button>
        ))}
      </div>

      {/* Calendar Grid */}
      <ScrollArea className="h-[calc(100vh-400px)]">
        {viewMode === 'month' ? (
          <div className="grid grid-cols-7 gap-1">
            {/* Day headers */}
            {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day, i) => (
              <div key={i} className="text-center text-xs text-muted-foreground py-2">
                {language === 'ru' ? day : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}
              </div>
            ))}
            {/* Empty cells for alignment */}
            {Array.from({ length: (days[0].getDay() + 6) % 7 }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}
            {/* Day cells */}
            {days.map(day => {
              const dayItems = getItemsForDay(day);
              return (
                <div 
                  key={day.toISOString()} 
                  className={cn(
                    'aspect-square p-1 rounded-lg border border-transparent',
                    isToday(day) && 'bg-primary/10 border-primary/30'
                  )}
                >
                  <div className={cn(
                    'text-xs font-medium mb-0.5',
                    isToday(day) && 'text-primary'
                  )}>
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-0.5">
                    {dayItems.slice(0, 2).map(item => {
                      const child = children.find(c => c.id === item.child_id);
                      return (
                        <div 
                          key={item.id}
                          className={cn(
                            "text-[8px] px-1 py-0.5 rounded truncate",
                            item.type === 'task' ? 'bg-accent/30' : 'bg-secondary/30'
                          )}
                        >
                          {child?.name?.charAt(0)}: {item.time.slice(0, 5)}
                        </div>
                      );
                    })}
                    {dayItems.length > 2 && (
                      <div className="text-[8px] text-muted-foreground">
                        +{dayItems.length - 2}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2">
            {days.map(day => {
              const dayItems = getItemsForDay(day);
              return (
                <div 
                  key={day.toISOString()} 
                  className={cn(
                    'rounded-xl p-3',
                    isToday(day) ? 'bg-primary/10 border border-primary/30' : 'bg-card'
                  )}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className={cn(
                      'font-bold',
                      isToday(day) && 'text-primary'
                    )}>
                      {format(day, 'EEEE', { locale })}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {format(day, 'd MMMM', { locale })}
                    </span>
                  </div>
                  
                  {dayItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {language === 'ru' ? 'Нет занятий' : 'No activities'}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {dayItems
                        .sort((a, b) => a.time.localeCompare(b.time))
                        .map(item => {
                          const child = children.find(c => c.id === item.child_id);
                          return (
                            <div 
                              key={item.id}
                              className="flex items-center gap-3 p-2 rounded-lg bg-background/50"
                            >
                              <div className="text-sm font-mono font-semibold w-12">
                                {item.time.slice(0, 5)}
                              </div>
                              {child && (
                                <ChildAvatar avatar={child.avatar_url || '🦁'} size="xs" />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1">
                                  {item.type === 'task' ? (
                                    <Sparkles className="w-3 h-3 text-accent" />
                                  ) : (
                                    <BookOpen className="w-3 h-3 text-secondary" />
                                  )}
                                  <p className="font-medium text-sm truncate">
                                    {language === 'ru' ? item.title_ru : item.title_en}
                                  </p>
                                </div>
                                {item.location && (
                                  <p className="text-xs text-muted-foreground truncate">
                                    📍 {item.location}
                                  </p>
                                )}
                              </div>
                              {item.duration && (
                                <span className="text-xs text-muted-foreground">
                                  {item.duration}{language === 'ru' ? ' мин' : ' min'}
                                </span>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
