import { useState, useMemo, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Filter, BookOpen, Sparkles, Pencil } from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, addDays, addWeeks, addMonths, isToday, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSchedule, type ActivitySchedule } from '@/hooks/useSchedule';
import { useChildren } from '@/hooks/useChildren';
import { useTasks } from '@/hooks/useTasks';
import { Button } from '@/components/ui/button';
import { ChildAvatar } from '@/components/ui/ChildAvatar';
import { cn } from '@/lib/utils';
import { EditActivityDialog } from '@/components/EditActivityDialog';
import { DateJumpPicker } from '@/components/DateJumpPicker';
import { getWeekDays } from '@/i18n/translations';
import { useIsCompact } from '@/hooks/use-breakpoints';

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
  originalActivity?: ActivitySchedule;
}

// Color palette for children - use different colors for each child
const CHILD_COLORS = [
  'bg-blue-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-orange-500',
  'bg-pink-500',
  'bg-teal-500',
  'bg-red-500',
  'bg-yellow-500',
];

const CHILD_COLORS_LIGHT = [
  'bg-blue-100 border-blue-400',
  'bg-green-100 border-green-400',
  'bg-purple-100 border-purple-400',
  'bg-orange-100 border-orange-400',
  'bg-pink-100 border-pink-400',
  'bg-teal-100 border-teal-400',
  'bg-red-100 border-red-400',
  'bg-yellow-100 border-yellow-400',
];

export const FamilySchedulePage = () => {
  const { language, t } = useLanguage();
  const { children } = useChildren();
  const { activities } = useSchedule();
  const { templates } = useTasks();
  
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [editingActivity, setEditingActivity] = useState<ActivitySchedule | null>(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  
  const weekDays = getWeekDays(language);
  
  // Mobile detection using md breakpoint (768px)
  const [isMobile, setIsMobile] = useState<boolean>(false);
  // Compact mode for tablet/small laptop (< 1024px)
  const isCompact = useIsCompact();
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const locale = language === 'ru' ? ru : undefined;

  // Helper function to open day view
  const openDay = (date: Date) => {
    setCurrentDate(date);
    setViewMode('day');
  };

  // Create a map of child_id to color index
  const childColorMap = useMemo(() => {
    const map = new Map<string, number>();
    children.forEach((child, index) => {
      map.set(child.id, index % CHILD_COLORS.length);
    });
    return map;
  }, [children]);

  // Filter activity_schedules
  const filteredActivities = useMemo(() => {
    if (!selectedChildId) return activities;
    return activities.filter(a => a.child_id === selectedChildId);
  }, [activities, selectedChildId]);

  // Filter all task templates (activities AND routines)
  const allTasks = useMemo(() => {
    const tasks = templates.filter(t => t.status === 'active');
    if (!selectedChildId) return tasks;
    return tasks.filter(t => t.child_id === selectedChildId || t.child_id === null);
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
          originalActivity: activity,
        });
      }
    });
    
    // Add task templates
    allTasks.forEach(task => {
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
    
    return items.sort((a, b) => a.time.localeCompare(b.time));
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

  // Get hours range for week view (7am to 21pm)
  const hours = Array.from({ length: 15 }, (_, i) => i + 7);

  // Get items for a specific hour on a specific day
  const getItemsForHour = (date: Date, hour: number): ScheduleItem[] => {
    const dayItems = getItemsForDay(date);
    return dayItems.filter(item => {
      const itemHour = parseInt(item.time.split(':')[0], 10);
      return itemHour === hour;
    });
  };

  // Calculate month grid info
  const getMonthGridInfo = () => {
    const firstDayOffset = (days[0].getDay() + 6) % 7;
    const totalCells = firstDayOffset + days.length;
    const totalRows = Math.ceil(totalCells / 7);
    return { firstDayOffset, totalRows };
  };

  // Mobile Month List View Component
  const MobileMonthListView = () => (
    <div className="space-y-1">
      {days.map(day => {
        const dayItems = getItemsForDay(day);
        const hasItems = dayItems.length > 0;
        
        return (
          <button
            key={day.toISOString()}
            onClick={() => openDay(day)}
            className={cn(
              'w-full text-left rounded-xl transition-colors active:bg-muted/50',
              hasItems ? 'p-4 border-2' : 'py-2 px-4 border',
              isToday(day) 
                ? 'bg-primary/10 border-primary/40' 
                : hasItems 
                  ? 'bg-card border-border' 
                  : 'bg-muted/30 border-border/50'
            )}
          >
            <div className={cn(
              'flex items-center',
              hasItems ? 'justify-between mb-2' : 'justify-between'
            )}>
              <span className={cn(
                'font-bold break-words',
                hasItems ? 'text-base' : 'text-sm',
                isToday(day) && 'text-primary'
              )}>
                {format(day, 'd MMMM', { locale })}
              </span>
              <div className="flex items-center gap-2">
                <span className={cn(
                  'text-muted-foreground',
                  hasItems ? 'text-sm' : 'text-xs'
                )}>
                  {format(day, 'EEEE', { locale })}
                </span>
                {!hasItems && (
                  <span className="text-xs text-muted-foreground/60 font-mono">0</span>
                )}
              </div>
            </div>
            
            {hasItems && (
              <div className="space-y-1">
                {dayItems.slice(0, 3).map(item => {
                  const child = children.find(c => c.id === item.child_id);
                  return (
                    <div 
                      key={item.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <span className="text-xs">{child?.avatar_url || '👤'}</span>
                      <span className="font-mono text-muted-foreground w-12 shrink-0">
                        {item.time.slice(0, 5)}
                      </span>
                      <span className="font-medium break-words line-clamp-2 leading-snug">
                        {language === 'ru' ? item.title_ru : item.title_en}
                      </span>
                    </div>
                  );
                })}
                {dayItems.length > 3 && (
                  <span className="inline-block text-sm text-primary font-medium underline underline-offset-2">
                    +{dayItems.length - 3} {t('more_items')}
                  </span>
                )}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );

  // Mobile Week List View Component
  const MobileWeekListView = () => (
    <div className="space-y-2">
      {days.map(day => {
        const dayItems = getItemsForDay(day);
        
        return (
          <button
            key={day.toISOString()}
            onClick={() => openDay(day)}
            className={cn(
              'w-full text-left rounded-xl p-4 border-2 transition-colors active:bg-muted/50 min-h-[44px]',
              isToday(day) ? 'bg-primary/10 border-primary/40' : 'bg-card border-border'
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shrink-0',
                  isToday(day) ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
                )}>
                  {format(day, 'd')}
                </div>
                <div>
                  <p className={cn(
                    'font-bold text-base break-words leading-snug',
                    isToday(day) && 'text-primary'
                  )}>
                    {format(day, 'EEEE', { locale })}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {format(day, 'd MMMM', { locale })}
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-lg">
                  {dayItems.length}
                </p>
                <p className="text-xs text-muted-foreground">
                  {dayItems.length === 1 ? t('activities_count_one') : t('activities_count_other')}
                </p>
              </div>
            </div>
            
            {dayItems.length > 0 && (
              <div className="mt-3 space-y-1">
                {dayItems.slice(0, 2).map(item => {
                  const child = children.find(c => c.id === item.child_id);
                  const colorIndex = childColorMap.get(item.child_id) ?? 0;
                  return (
                    <div 
                      key={item.id}
                      className={cn(
                        "text-sm px-2 py-1.5 rounded-lg border font-medium flex items-center gap-2",
                        CHILD_COLORS_LIGHT[colorIndex]
                      )}
                    >
                      <span className="shrink-0">{child?.avatar_url || '👤'}</span>
                      <span className="break-words line-clamp-2 leading-snug">
                        {language === 'ru' ? item.title_ru : item.title_en}
                      </span>
                    </div>
                  );
                })}
                {dayItems.length > 2 && (
                  <span className="inline-block text-sm text-primary font-medium underline underline-offset-2">
                    +{dayItems.length - 2} {t('more_items')}
                  </span>
                )}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-4 animate-fade-in px-4 md:px-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-secondary/20 flex items-center justify-center shrink-0">
          <Calendar className="w-6 h-6 text-secondary" />
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold break-words">
            {t('family_schedule')}
          </h1>
          <p className="text-sm text-muted-foreground break-words">
            {t('family_schedule_desc')}
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
              'flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all min-h-[44px]',
              viewMode === mode 
                ? 'bg-background shadow text-foreground' 
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {mode === 'day' ? t('view_day') : mode === 'week' ? t('view_week') : t('view_month')}
          </button>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={navigatePrev} className="min-h-[44px] min-w-[44px]">
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <button
          onClick={() => viewMode !== 'day' && setDatePickerOpen(true)}
          className={cn(
            "flex items-center gap-2 font-semibold text-center break-words px-3 py-2 rounded-lg transition-colors",
            viewMode !== 'day' && "hover:bg-muted/80 active:bg-muted cursor-pointer"
          )}
        >
          <span>
            {viewMode === 'day' && format(currentDate, 'd MMMM', { locale })}
            {viewMode === 'week' && `${format(days[0], 'd MMM', { locale })} – ${format(days[days.length - 1], 'd MMM', { locale })}`}
            {viewMode === 'month' && format(currentDate, 'LLLL yyyy', { locale })}
          </span>
          {viewMode !== 'day' && (
            <Calendar className="w-4 h-4 text-primary" />
          )}
        </button>
        <Button variant="ghost" size="icon" onClick={navigateNext} className="min-h-[44px] min-w-[44px]">
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Child Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4">
        <div className="flex items-center gap-1 mr-2 shrink-0">
          <Filter className="w-4 h-4 text-muted-foreground" />
        </div>
        <button
          onClick={() => setSelectedChildId(null)}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap min-h-[36px]',
            selectedChildId === null 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-muted hover:bg-muted/80'
          )}
        >
          {t('filter_all')}
        </button>
        {children.map((child, index) => (
          <button
            key={child.id}
            onClick={() => setSelectedChildId(child.id)}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap min-h-[36px]',
              selectedChildId === child.id 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted hover:bg-muted/80'
            )}
          >
            <div className={cn(
              'w-3 h-3 rounded-full shrink-0',
              CHILD_COLORS[index % CHILD_COLORS.length]
            )} />
            <ChildAvatar avatar={child.avatar_url || '🦁'} size="xs" />
            {child.name}
          </button>
        ))}
      </div>

      {/* Date Jump Picker */}
      <DateJumpPicker
        open={datePickerOpen}
        onOpenChange={setDatePickerOpen}
        selectedDate={currentDate}
        onSelectDate={setCurrentDate}
        childId={selectedChildId || undefined}
      />

      {/* Calendar Views - Native overflow for Android compatibility */}
      <div 
        className="flex-1 overflow-auto overscroll-contain pb-4"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {viewMode === 'month' ? (
          <>

            {/* MOBILE: Month List View (shows ALL days) */}
            {isMobile && <MobileMonthListView />}

            {/* DESKTOP/TABLET: Month Grid View */}
            {!isMobile && (
              <div className="border-2 border-border rounded-xl overflow-hidden bg-card shadow-sm">
                {/* Day headers */}
                <div className="grid grid-cols-7 border-b-2 border-border bg-muted">
                  {weekDays.map((day, i) => (
                    <div 
                      key={i} 
                      className={cn(
                        "text-center font-bold py-2 uppercase tracking-wide",
                        isCompact ? "text-xs" : "text-sm py-3",
                        i < 6 && "border-r-2 border-border",
                        i >= 5 ? "text-muted-foreground bg-muted/80" : "text-foreground"
                      )}
                    >
                      {day}
                    </div>
                  ))}
                </div>
                {/* Calendar grid */}
                <div className="grid grid-cols-7">
                  {/* Empty cells for alignment */}
                  {Array.from({ length: getMonthGridInfo().firstDayOffset }).map((_, i) => (
                    <div 
                      key={`empty-${i}`} 
                      className={cn(
                        "bg-muted/30 border-b-2 border-border",
                        isCompact ? "h-[72px]" : "h-[84px] sm:h-[96px]",
                        i < 6 && "border-r-2 border-border"
                      )} 
                    />
                  ))}
                  {/* Day cells */}
                  {days.map((day, index) => {
                    const dayItems = getItemsForDay(day);
                    const { firstDayOffset, totalRows } = getMonthGridInfo();
                    const cellIndex = firstDayOffset + index;
                    const dayOfWeek = cellIndex % 7;
                    const isLastColumn = dayOfWeek === 6;
                    const rowNumber = Math.floor(cellIndex / 7);
                    const isLastRow = rowNumber === totalRows - 1;
                    
                    return (
                      <button 
                        key={day.toISOString()}
                        onClick={() => openDay(day)}
                        className={cn(
                          'p-1 transition-colors text-left hover:bg-muted/50',
                          isCompact ? "h-[72px]" : "h-[84px] sm:h-[96px]",
                          !isLastColumn && "border-r-2 border-border",
                          !isLastRow && "border-b-2 border-border",
                          isToday(day) && 'bg-primary/15',
                          dayOfWeek >= 5 && !isToday(day) && 'bg-muted/20'
                        )}
                      >
                        <div className={cn(
                          'font-bold mb-0.5 flex items-center justify-center rounded-full',
                          isCompact ? "text-xs w-5 h-5" : "text-sm w-6 h-6",
                          isToday(day) ? 'text-primary-foreground bg-primary' : 'text-foreground'
                        )}>
                          {format(day, 'd')}
                        </div>
                        <div className="space-y-0.5 overflow-hidden">
                          {dayItems.slice(0, isCompact ? 2 : 3).map(item => {
                            const child = children.find(c => c.id === item.child_id);
                            const colorIndex = childColorMap.get(item.child_id) ?? 0;
                            return (
                              <div 
                                key={item.id}
                                className={cn(
                                  "px-0.5 py-0.5 rounded truncate flex items-center gap-0.5 border font-medium",
                                  isCompact ? "text-[8px]" : "text-[9px] border-2",
                                  CHILD_COLORS_LIGHT[colorIndex]
                                )}
                              >
                                <span className={isCompact ? "text-[8px]" : "text-[10px]"}>{child?.avatar_url || '👤'}</span>
                                <span className="truncate">{item.time.slice(0, 5)}</span>
                              </div>
                            );
                          })}
                          {dayItems.length > (isCompact ? 2 : 3) && (
                            <div className={cn(
                              "text-muted-foreground text-center font-semibold",
                              isCompact ? "text-[8px]" : "text-[9px]"
                            )}>
                              +{dayItems.length - (isCompact ? 2 : 3)}
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        ) : viewMode === 'week' ? (
          <>
            {/* MOBILE: Week List View */}
            {isMobile && <MobileWeekListView />}

            {/* DESKTOP/TABLET: Week Grid View */}
            {!isMobile && (
              <div className="w-full border-2 border-border rounded-xl overflow-hidden bg-card shadow-sm">
                {/* Header row with days */}
                <div className="grid grid-cols-8 border-b-2 border-border sticky top-0 bg-muted z-10">
                  <div className={cn(
                    "text-center text-muted-foreground font-semibold border-r-2 border-border",
                    isCompact ? "p-1.5 text-xs w-10" : "p-2 text-sm w-14"
                  )}>
                    {/* Empty corner cell */}
                  </div>
                  {days.map((day, index) => (
                    <div 
                      key={day.toISOString()} 
                      className={cn(
                        "text-center flex-1 min-w-0",
                        isCompact ? "p-1.5" : "p-2",
                        index < days.length - 1 && "border-r-2 border-border",
                        isToday(day) ? "bg-primary/20" : index >= 5 ? "bg-muted/80" : ""
                      )}
                    >
                      <div className={cn(
                        "font-bold uppercase tracking-wide",
                        isCompact ? "text-xs" : "text-sm",
                        isToday(day) ? "text-primary" : "text-foreground"
                      )}>
                        {format(day, 'EEE', { locale })}
                      </div>
                      <div className={cn(
                        "font-bold mx-auto flex items-center justify-center rounded-full",
                        isCompact ? "text-sm w-6 h-6" : "text-lg w-8 h-8",
                        isToday(day) && "text-primary-foreground bg-primary"
                      )}>
                        {format(day, 'd')}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Time grid */}
                <div className="relative">
                  {hours.map((hour, hourIndex) => {
                    const hourHeight = isCompact ? 42 : 52;
                    return (
                      <div key={hour} className={cn(
                        "grid grid-cols-8",
                        hourIndex < hours.length - 1 && "border-b border-border/50"
                      )} style={{ minHeight: `${hourHeight}px` }}>
                        {/* Hour label */}
                        <div className={cn(
                          "text-muted-foreground font-mono font-bold text-right border-r-2 border-border bg-muted/50 flex items-start justify-end",
                          isCompact ? "text-xs p-1 pr-1.5 pt-0.5 w-10" : "text-sm p-1.5 pr-2 pt-1 w-14"
                        )}>
                          {hour.toString().padStart(2, '0')}:00
                        </div>
                        {/* Day columns */}
                        {days.map((day, dayIndex) => {
                          const hourItems = getItemsForHour(day, hour);
                          return (
                            <div 
                              key={day.toISOString()} 
                              className={cn(
                                "p-0.5 flex-1 min-w-0",
                                dayIndex < days.length - 1 && "border-r border-border/30",
                                isToday(day) && "bg-primary/5",
                                dayIndex >= 5 && !isToday(day) && "bg-muted/10"
                              )}
                              style={{ minHeight: `${hourHeight}px` }}
                            >
                              {hourItems.map(item => {
                                const child = children.find(c => c.id === item.child_id);
                                const colorIndex = childColorMap.get(item.child_id) ?? 0;
                                return (
                                  <div 
                                    key={item.id}
                                    onClick={() => item.type === 'activity' && item.originalActivity && setEditingActivity(item.originalActivity)}
                                    className={cn(
                                      "p-0.5 rounded mb-0.5 border cursor-pointer hover:opacity-80 transition-opacity font-medium",
                                      isCompact ? "text-[8px]" : "text-[9px]",
                                      CHILD_COLORS_LIGHT[colorIndex]
                                    )}
                                  >
                                    <div className="flex items-center gap-0.5">
                                      <span className={isCompact ? "text-[8px]" : "text-[9px]"}>{child?.avatar_url || '👤'}</span>
                                      <span className="font-semibold truncate">
                                        {language === 'ru' ? item.title_ru : item.title_en}
                                      </span>
                                    </div>
                                    <div className="text-muted-foreground font-mono">
                                      {item.time.slice(0, 5)}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        ) : (
          /* Day View - Vertical list */
          <div className="space-y-2">
            {days.map(day => {
              const dayItems = getItemsForDay(day);
              return (
                <div 
                  key={day.toISOString()} 
                  className={cn(
                    'rounded-xl p-3 border-2',
                    isToday(day) ? 'bg-primary/10 border-primary/40' : 'bg-card border-border'
                  )}
                >
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={cn(
                      'font-bold break-words',
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
                      {t('no_activities_day')}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {dayItems.map(item => {
                        const child = children.find(c => c.id === item.child_id);
                        const colorIndex = childColorMap.get(item.child_id) ?? 0;
                        return (
                          <div 
                            key={item.id}
                            className={cn(
                              "flex items-center gap-3 p-2 rounded-lg group border-2",
                              CHILD_COLORS_LIGHT[colorIndex]
                            )}
                          >
                            <div className="text-sm font-mono font-bold w-14 shrink-0">
                              {item.time.slice(0, 5)}
                            </div>
                            {child && (
                              <ChildAvatar avatar={child.avatar_url || '🦁'} size="xs" />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1">
                                {item.type === 'task' ? (
                                  <Sparkles className="w-3 h-3 text-accent shrink-0" />
                                ) : (
                                  <BookOpen className="w-3 h-3 text-secondary shrink-0" />
                                )}
                                <p className="font-semibold text-sm break-words line-clamp-2 leading-snug">
                                  {language === 'ru' ? item.title_ru : item.title_en}
                                </p>
                              </div>
                              {item.location && (
                                <p className="text-xs text-muted-foreground break-words">
                                  📍 {item.location}
                                </p>
                              )}
                            </div>
                            {item.duration && (
                              <span className="text-xs text-muted-foreground font-medium shrink-0">
                                {item.duration} {t('minutes_short')}
                              </span>
                            )}
                            {item.type === 'activity' && item.originalActivity && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 shrink-0"
                                onClick={() => setEditingActivity(item.originalActivity!)}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
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
      </div>

      <EditActivityDialog
        activity={editingActivity}
        open={!!editingActivity}
        onOpenChange={(open) => !open && setEditingActivity(null)}
      />
    </div>
  );
};
