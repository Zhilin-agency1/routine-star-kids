import { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  ChevronDown,
  MoreHorizontal,
  Pencil,
  Copy,
  Trash2
} from 'lucide-react';
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  addDays, 
  addWeeks, 
  addMonths, 
  subDays,
  subWeeks,
  subMonths,
  isToday,
  isSameDay,
  parseISO 
} from 'date-fns';
import { ru } from 'date-fns/locale';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSchedule, type ActivitySchedule } from '@/hooks/useSchedule';
import { useChildren } from '@/hooks/useChildren';
import { useTasks } from '@/hooks/useTasks';
import { Button } from '@/components/ui/button';
import { ChildAvatar } from '@/components/ui/ChildAvatar';
import { cn } from '@/lib/utils';
import { EditActivityDialog } from '@/components/EditActivityDialog';
import { EditTaskDialog } from '@/components/EditTaskDialog';
import { AddTaskDialog } from '@/components/AddTaskDialog';
import { getWeekDays } from '@/i18n/translations';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Database } from '@/integrations/supabase/types';

type TaskTemplate = Database['public']['Tables']['task_templates']['Row'];
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
  originalTemplate?: TaskTemplate;
  category?: string;
}

// Color palette for children
const CHILD_COLORS = [
  'bg-blue-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-orange-500',
  'bg-pink-500',
  'bg-teal-500',
];

const CHILD_COLORS_LIGHT = [
  'bg-blue-100 border-blue-400 text-blue-900',
  'bg-green-100 border-green-400 text-green-900',
  'bg-purple-100 border-purple-400 text-purple-900',
  'bg-orange-100 border-orange-400 text-orange-900',
  'bg-pink-100 border-pink-400 text-pink-900',
  'bg-teal-100 border-teal-400 text-teal-900',
];

interface JobberCalendarProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  selectedChildId: string | null;
  onChildChange: (childId: string | null) => void;
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
  isReadOnly?: boolean;
  className?: string;
}

export const JobberCalendar = ({
  selectedDate,
  onDateChange,
  selectedChildId,
  onChildChange,
  viewMode: externalViewMode,
  onViewModeChange,
  isReadOnly = false,
  className,
}: JobberCalendarProps) => {
  const { language, t } = useLanguage();
  const { children } = useChildren();
  const { activities, createActivity, deleteActivity } = useSchedule();
  const { templates, createTemplate, deleteTemplate } = useTasks();
  
  const [internalViewMode, setInternalViewMode] = useState<ViewMode>('week');
  const viewMode = externalViewMode ?? internalViewMode;
  const setViewMode = (mode: ViewMode) => {
    if (onViewModeChange) {
      onViewModeChange(mode);
    } else {
      setInternalViewMode(mode);
    }
  };
  
  const [editingActivity, setEditingActivity] = useState<ActivitySchedule | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<TaskTemplate | null>(null);
  const [addActivityOpen, setAddActivityOpen] = useState(false);
  const [addActivityDate, setAddActivityDate] = useState<Date | null>(null);
  const [addActivityTime, setAddActivityTime] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; type: 'activity' | 'task' } | null>(null);
  
  const weekDays = getWeekDays(language);
  
  // Mobile detection
  const [isMobile, setIsMobile] = useState<boolean>(false);
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const locale = language === 'ru' ? ru : undefined;

  // Child color map
  const childColorMap = useMemo(() => {
    const map = new Map<string, number>();
    children.forEach((child, index) => {
      map.set(child.id, index % CHILD_COLORS.length);
    });
    return map;
  }, [children]);

  // Filter activities by child
  const filteredActivities = useMemo(() => {
    if (!selectedChildId) return activities;
    return activities.filter(a => a.child_id === selectedChildId);
  }, [activities, selectedChildId]);

  // Filter task templates (ONLY activities, not routines)
  const activityTasks = useMemo(() => {
    const tasks = templates.filter(t => 
      t.status === 'active' && 
      t.task_category === 'activity' // Only show activities in calendar
    );
    if (!selectedChildId) return tasks;
    return tasks.filter(t => t.child_id === selectedChildId || t.child_id === null);
  }, [templates, selectedChildId]);

  const getItemsForDay = useCallback((date: Date): ScheduleItem[] => {
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
    
    // Add task templates (activities only, not routines)
    activityTasks.forEach(task => {
      const startDate = parseISO(task.start_date);
      const endDate = task.end_date ? parseISO(task.end_date) : null;
      
      if (date < startDate) return;
      if (endDate && date > endDate) return;
      
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
          category: task.task_category,
          originalTemplate: task,
        });
      }
    });
    
    return items.sort((a, b) => a.time.localeCompare(b.time));
  }, [filteredActivities, activityTasks]);

  const getItemsForHour = (date: Date, hour: number): ScheduleItem[] => {
    const dayItems = getItemsForDay(date);
    return dayItems.filter(item => {
      const itemHour = parseInt(item.time.split(':')[0], 10);
      return itemHour === hour;
    });
  };

  // Navigation
  const navigatePrev = () => {
    if (viewMode === 'day') onDateChange(subDays(selectedDate, 1));
    else if (viewMode === 'week') onDateChange(subWeeks(selectedDate, 1));
    else onDateChange(subMonths(selectedDate, 1));
  };

  const navigateNext = () => {
    if (viewMode === 'day') onDateChange(addDays(selectedDate, 1));
    else if (viewMode === 'week') onDateChange(addWeeks(selectedDate, 1));
    else onDateChange(addMonths(selectedDate, 1));
  };

  const goToToday = () => onDateChange(new Date());

  const getDaysToShow = () => {
    if (viewMode === 'day') {
      return [selectedDate];
    } else if (viewMode === 'week') {
      const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
      const end = endOfWeek(selectedDate, { weekStartsOn: 1 });
      return eachDayOfInterval({ start, end });
    } else {
      const start = startOfMonth(selectedDate);
      const end = endOfMonth(selectedDate);
      return eachDayOfInterval({ start, end });
    }
  };

  const days = getDaysToShow();
  const hours = Array.from({ length: 15 }, (_, i) => i + 7); // 7am to 9pm

  // Month grid info
  const getMonthGridInfo = () => {
    const firstDayOffset = (days[0].getDay() + 6) % 7;
    const totalCells = firstDayOffset + days.length;
    const totalRows = Math.ceil(totalCells / 7);
    return { firstDayOffset, totalRows };
  };

  // Handle cell click to add activity
  const handleCellClick = (date: Date, hour?: number) => {
    if (isReadOnly) return;
    setAddActivityDate(date);
    setAddActivityTime(hour ? `${hour.toString().padStart(2, '0')}:00` : null);
    setAddActivityOpen(true);
  };

  // Handle item click - open edit dialog
  const handleItemClick = (item: ScheduleItem) => {
    if (isReadOnly) return;
    if (item.type === 'activity' && item.originalActivity) {
      setEditingActivity(item.originalActivity);
    } else if (item.type === 'task' && item.originalTemplate) {
      setEditingTemplate(item.originalTemplate);
    }
  };

  // Handle copy item
  const handleCopyItem = async (item: ScheduleItem) => {
    if (item.type === 'task' && item.originalTemplate) {
      const template = item.originalTemplate;
      try {
        const copiedTitle_ru = `${template.title_ru} (${language === 'ru' ? 'Копия' : 'Copy'})`;
        const copiedTitle_en = `${template.title_en} (Copy)`;
        
        const newTemplate = await createTemplate.mutateAsync({
          title_ru: copiedTitle_ru,
          title_en: copiedTitle_en,
          description_ru: template.description_ru,
          description_en: template.description_en,
          icon: template.icon,
          reward_amount: template.reward_amount,
          task_type: template.task_type,
          task_category: template.task_category,
          recurring_days: template.recurring_days,
          recurring_time: template.recurring_time,
          end_time: template.end_time,
          child_id: template.child_id,
          start_date: template.start_date,
          end_date: template.end_date,
          one_time_date: template.one_time_date,
        });
        
        toast.success(language === 'ru' ? 'Занятие скопировано!' : 'Activity copied!');
        
        // Open the copied item in edit mode
        const copiedTemplate = templates.find(t => t.id === newTemplate.id);
        if (copiedTemplate) {
          setEditingTemplate(copiedTemplate);
        }
      } catch (error) {
        toast.error(language === 'ru' ? 'Ошибка при копировании' : 'Failed to copy');
      }
    } else if (item.type === 'activity' && item.originalActivity) {
      const activity = item.originalActivity;
      try {
        const copiedTitle_ru = `${activity.title_ru} (${language === 'ru' ? 'Копия' : 'Copy'})`;
        const copiedTitle_en = `${activity.title_en} (Copy)`;
        
        await createActivity.mutateAsync({
          title_ru: copiedTitle_ru,
          title_en: copiedTitle_en,
          child_id: activity.child_id,
          time: activity.time,
          duration: activity.duration,
          location: activity.location,
          recurring_days: activity.recurring_days,
          start_date: activity.start_date,
          end_date: activity.end_date,
        });
        
        toast.success(language === 'ru' ? 'Занятие скопировано!' : 'Activity copied!');
      } catch (error) {
        toast.error(language === 'ru' ? 'Ошибка при копировании' : 'Failed to copy');
      }
    }
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    
    try {
      if (itemToDelete.type === 'task') {
        await deleteTemplate.mutateAsync(itemToDelete.id);
      } else {
        await deleteActivity.mutateAsync(itemToDelete.id);
      }
      toast.success(language === 'ru' ? 'Удалено!' : 'Deleted!');
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    } catch (error) {
      toast.error(language === 'ru' ? 'Ошибка при удалении' : 'Failed to delete');
    }
  };

  // Generate month options for quick jump
  const getMonthOptions = () => {
    const months = [];
    const currentYear = selectedDate.getFullYear();
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentYear, i, 1);
      months.push({
        value: i.toString(),
        label: format(date, 'LLLL', { locale }),
      });
    }
    return months;
  };

  const handleMonthChange = (monthIndex: string) => {
    const newDate = new Date(selectedDate.getFullYear(), parseInt(monthIndex), selectedDate.getDate());
    onDateChange(newDate);
  };

  const renderDateLabel = () => {
    if (viewMode === 'day') return format(selectedDate, 'd MMMM yyyy', { locale });
    if (viewMode === 'week') {
      return `${format(days[0], 'd MMM', { locale })} – ${format(days[days.length - 1], 'd MMM', { locale })}`;
    }
    return format(selectedDate, 'LLLL yyyy', { locale });
  };

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Calendar Controls Header */}
      <div className="sticky top-0 z-20 bg-background border-b border-border pb-3 space-y-3">
        {/* Top row: Today + Navigation + View/Child filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Today button */}
          <Button
            variant="outline"
            size="sm"
            onClick={goToToday}
            className="rounded-xl shrink-0"
          >
            {language === 'ru' ? 'Сегодня' : 'Today'}
          </Button>

          {/* Navigation */}
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={navigatePrev} className="h-8 w-8">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            {/* Month quick jump */}
            {viewMode === 'month' ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="font-semibold gap-1 px-2">
                    {renderDateLabel()}
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="max-h-64 overflow-y-auto">
                  {getMonthOptions().map(month => (
                    <DropdownMenuItem 
                      key={month.value} 
                      onClick={() => handleMonthChange(month.value)}
                      className={cn(
                        "capitalize cursor-pointer",
                        parseInt(month.value) === selectedDate.getMonth() && "bg-primary/10 font-bold"
                      )}
                    >
                      {month.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <span className="font-semibold text-sm min-w-[140px] text-center">
                {renderDateLabel()}
              </span>
            )}
            
            <Button variant="ghost" size="icon" onClick={navigateNext} className="h-8 w-8">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex-1" />

          {/* View Mode Selector */}
          <Select value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
            <SelectTrigger className="w-[100px] h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">{t('view_day')}</SelectItem>
              <SelectItem value="week">{t('view_week')}</SelectItem>
              <SelectItem value="month">{t('view_month')}</SelectItem>
            </SelectContent>
          </Select>

          {/* Child Selector */}
          <Select 
            value={selectedChildId || 'all'} 
            onValueChange={(v) => onChildChange(v === 'all' ? null : v)}
          >
            <SelectTrigger className="w-[130px] h-8 text-sm">
              <SelectValue placeholder={t('filter_all')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('filter_all')}</SelectItem>
              {children.map(child => (
                <SelectItem key={child.id} value={child.id}>
                  <div className="flex items-center gap-2">
                    <ChildAvatar avatar={child.avatar_url || '🦁'} size="xs" />
                    <span>{child.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-auto mt-3" style={{ WebkitOverflowScrolling: 'touch' }}>
        {viewMode === 'month' ? (
          <div className="border-2 border-border rounded-xl overflow-hidden bg-card shadow-sm">
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b-2 border-border bg-muted">
              {weekDays.map((day, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "text-center text-xs font-bold py-2 uppercase tracking-wide",
                    i < 6 && "border-r border-border",
                    i >= 5 ? "text-muted-foreground" : "text-foreground"
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
                    "min-h-[80px] md:min-h-[100px] bg-muted/30 border-b border-border",
                    i < 6 && "border-r border-border"
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
                    onClick={() => !isReadOnly && handleCellClick(day)}
                    className={cn(
                      'min-h-[80px] md:min-h-[100px] p-1.5 transition-colors text-left hover:bg-muted/50 relative group',
                      !isLastColumn && "border-r border-border",
                      !isLastRow && "border-b border-border",
                      isToday(day) && 'bg-primary/10',
                      dayOfWeek >= 5 && !isToday(day) && 'bg-muted/20'
                    )}
                  >
                    <div className={cn(
                      'text-sm font-bold mb-1 w-6 h-6 flex items-center justify-center rounded-full',
                      isToday(day) ? 'text-primary-foreground bg-primary' : 'text-foreground'
                    )}>
                      {format(day, 'd')}
                    </div>
                    <div className="space-y-0.5">
                      {dayItems.slice(0, isMobile ? 2 : 3).map(item => {
                        const child = children.find(c => c.id === item.child_id);
                        const colorIndex = childColorMap.get(item.child_id) ?? 0;
                        return (
                          <div 
                            key={item.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleItemClick(item);
                            }}
                            className={cn(
                              "text-[10px] px-1 py-0.5 rounded truncate flex items-center gap-0.5 border font-medium cursor-pointer hover:opacity-80",
                              CHILD_COLORS_LIGHT[colorIndex]
                            )}
                          >
                            <span className="shrink-0">{item.icon || child?.avatar_url || '📅'}</span>
                            <span className="truncate">{item.time.slice(0, 5)}</span>
                          </div>
                        );
                      })}
                      {dayItems.length > (isMobile ? 2 : 3) && (
                        <div className="text-[10px] text-muted-foreground text-center font-semibold">
                          +{dayItems.length - (isMobile ? 2 : 3)}
                        </div>
                      )}
                    </div>
                    {/* Add button on hover */}
                    {!isReadOnly && (
                      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Plus className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ) : viewMode === 'week' ? (
          <div className="min-w-[700px] border-2 border-border rounded-xl overflow-hidden bg-card shadow-sm">
            {/* Header row with days */}
            <div className="grid grid-cols-8 border-b-2 border-border sticky top-0 bg-muted z-10">
              <div className="p-2 text-center text-xs text-muted-foreground font-semibold border-r border-border" />
              {days.map((day, index) => (
                <div 
                  key={day.toISOString()} 
                  className={cn(
                    "p-2 text-center",
                    index < days.length - 1 && "border-r border-border",
                    isToday(day) ? "bg-primary/20" : index >= 5 ? "bg-muted/80" : ""
                  )}
                >
                  <div className={cn(
                    "text-xs font-bold uppercase tracking-wide",
                    isToday(day) ? "text-primary" : "text-foreground"
                  )}>
                    {format(day, 'EEE', { locale })}
                  </div>
                  <div className={cn(
                    "text-lg font-bold w-8 h-8 mx-auto flex items-center justify-center rounded-full",
                    isToday(day) && "text-primary-foreground bg-primary"
                  )}>
                    {format(day, 'd')}
                  </div>
                </div>
              ))}
            </div>

            {/* Time grid */}
            <div className="relative">
              {hours.map((hour, hourIndex) => (
                <div key={hour} className={cn(
                  "grid grid-cols-8 min-h-[50px]",
                  hourIndex < hours.length - 1 && "border-b border-border/70"
                )}>
                  {/* Hour label */}
                  <div className="p-1 text-xs text-muted-foreground font-mono font-bold text-right pr-2 border-r border-border bg-muted/50 flex items-start justify-end">
                    {hour.toString().padStart(2, '0')}:00
                  </div>
                  {/* Day columns */}
                  {days.map((day, dayIndex) => {
                    const hourItems = getItemsForHour(day, hour);
                    return (
                      <button 
                        key={day.toISOString()} 
                        onClick={() => handleCellClick(day, hour)}
                        disabled={isReadOnly}
                        className={cn(
                          "p-0.5 min-h-[50px] relative group hover:bg-muted/30 transition-colors",
                          dayIndex < days.length - 1 && "border-r border-border/50",
                          isToday(day) && "bg-primary/5",
                          dayIndex >= 5 && !isToday(day) && "bg-muted/10"
                        )}
                      >
                        {hourItems.map(item => {
                          const child = children.find(c => c.id === item.child_id);
                          const colorIndex = childColorMap.get(item.child_id) ?? 0;
                          return (
                            <div 
                              key={item.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleItemClick(item);
                              }}
                              className={cn(
                                "text-[10px] p-1 rounded mb-0.5 border cursor-pointer hover:opacity-80 transition-opacity font-medium",
                                CHILD_COLORS_LIGHT[colorIndex]
                              )}
                            >
                              <div className="flex items-center gap-1">
                                <span className="shrink-0">{item.icon || child?.avatar_url || '📅'}</span>
                                <span className="font-semibold truncate">
                                  {language === 'ru' ? item.title_ru : item.title_en}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                        {/* Add indicator */}
                        {!isReadOnly && hourItems.length === 0 && (
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Plus className="w-4 h-4 text-muted-foreground/50" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Day View */
          <div className="space-y-2">
            {days.map(day => {
              const dayItems = getItemsForDay(day);
              return (
                <div 
                  key={day.toISOString()} 
                  className={cn(
                    'rounded-xl p-4 border-2',
                    isToday(day) ? 'bg-primary/10 border-primary/40' : 'bg-card border-border'
                  )}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'font-bold text-lg',
                        isToday(day) && 'text-primary'
                      )}>
                        {format(day, 'EEEE', { locale })}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {format(day, 'd MMMM', { locale })}
                      </span>
                    </div>
                    {!isReadOnly && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleCellClick(day)}
                        className="gap-1"
                      >
                        <Plus className="w-4 h-4" />
                        {language === 'ru' ? 'Добавить' : 'Add'}
                      </Button>
                    )}
                  </div>
                  
                  {dayItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
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
                              "flex items-center gap-3 p-3 rounded-lg border-2 group",
                              CHILD_COLORS_LIGHT[colorIndex]
                            )}
                          >
                            <div className="text-sm font-mono font-bold w-14 shrink-0">
                              {item.time.slice(0, 5)}
                            </div>
                            {child && (
                              <ChildAvatar avatar={child.avatar_url || '🦁'} size="sm" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm break-words line-clamp-2 leading-snug">
                                {item.icon && <span className="mr-1">{item.icon}</span>}
                                {language === 'ru' ? item.title_ru : item.title_en}
                              </p>
                              {item.location && (
                                <p className="text-xs text-muted-foreground">
                                  📍 {item.location}
                                </p>
                              )}
                            </div>
                            {item.duration && (
                              <span className="text-xs text-muted-foreground font-medium shrink-0">
                                {item.duration} {t('minutes_short')}
                              </span>
                            )}
                            
                            {/* Actions dropdown */}
                            {!isReadOnly && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleItemClick(item)}>
                                    <Pencil className="w-4 h-4 mr-2" />
                                    {language === 'ru' ? 'Редактировать' : 'Edit'}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleCopyItem(item)}>
                                    <Copy className="w-4 h-4 mr-2" />
                                    {language === 'ru' ? 'Копировать' : 'Copy'}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => {
                                      setItemToDelete({ id: item.id, type: item.type });
                                      setDeleteDialogOpen(true);
                                    }}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    {language === 'ru' ? 'Удалить' : 'Delete'}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
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

      {/* Edit Activity Dialog */}
      <EditActivityDialog
        activity={editingActivity}
        open={!!editingActivity}
        onOpenChange={(open) => !open && setEditingActivity(null)}
      />

      {/* Edit Task Template Dialog */}
      {editingTemplate && (
        <EditTaskDialog
          template={editingTemplate}
          open={!!editingTemplate}
          onOpenChange={(open) => !open && setEditingTemplate(null)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === 'ru' ? 'Удалить?' : 'Delete?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'ru' 
                ? 'Это действие нельзя отменить.'
                : 'This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {language === 'ru' ? 'Отмена' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {language === 'ru' ? 'Удалить' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Activity Dialog */}
      {!isReadOnly && (
        <AddTaskDialog
          open={addActivityOpen}
          onOpenChange={setAddActivityOpen}
          initialCategory="activity"
        />
      )}
    </div>
  );
};
