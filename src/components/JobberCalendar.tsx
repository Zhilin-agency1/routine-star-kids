import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
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
import { useFamilyMembers, type EligibleAdult } from '@/hooks/useFamilyMembers';
import { Button } from '@/components/ui/button';
import { ChildAvatar } from '@/components/ui/ChildAvatar';
import { cn } from '@/lib/utils';
import { EditActivityDialog } from '@/components/EditActivityDialog';
import { EditTaskDialog } from '@/components/EditTaskDialog';
import { AddTaskDialog } from '@/components/AddTaskDialog';
import { ItemActionSheet, type ActionableItem } from '@/components/ItemActionSheet';
import { CopyActivityDialog } from '@/components/CopyActivityDialog';
import { CopyTaskDialog } from '@/components/CopyTaskDialog';
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
  endTime?: string | null;
  assigneeParentId?: string | null;
}

// Default color fallback
const DEFAULT_COLOR = '#3B82F6';

// Helper to convert hex to HSL and create a light solid background
const hexToLightSolid = (hex: string): string => {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Parse hex to RGB
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  
  // Convert to HSL
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  
  // Return a light solid color (high lightness, reduced saturation)
  return `hsl(${Math.round(h * 360)}, ${Math.round(s * 40)}%, 94%)`;
};

// Helper to get card styles - solid background, neutral border
const getCardStyles = (hexColor: string | null | undefined): { bg: string; indicatorColor: string } => {
  const color = hexColor || DEFAULT_COLOR;
  return {
    bg: hexToLightSolid(color),
    indicatorColor: color,
  };
};

interface JobberCalendarProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  selectedChildId: string | null;
  onChildChange: (childId: string | null) => void;
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
  isReadOnly?: boolean;
  hideAdults?: boolean;
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
  hideAdults = false,
  className,
}: JobberCalendarProps) => {
  const { language, t } = useLanguage();
  const { children } = useChildren();
  const { activities, createActivity, deleteActivity } = useSchedule();
  const { templates, createTemplate, deleteTemplate } = useTasks();
  const { getEligibleAdultsForCalendar, allowParentActivities } = useFamilyMembers();
  
  // Get eligible adults for calendar filter
  const eligibleAdults = getEligibleAdultsForCalendar();
  
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
  
  // Action sheet and copy dialog states - unified for both activities and tasks
  const [actionSheetItem, setActionSheetItem] = useState<ActionableItem | null>(null);
  const [actionSheetOpen, setActionSheetOpen] = useState(false);
  const [copyDialogActivity, setCopyDialogActivity] = useState<ActivitySchedule | null>(null);
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [copyDialogTemplate, setCopyDialogTemplate] = useState<TaskTemplate | null>(null);
  const [copyTaskDialogOpen, setCopyTaskDialogOpen] = useState(false);
  
  const weekDays = getWeekDays(language);
  
  // Mobile detection
  const [isMobile, setIsMobile] = useState<boolean>(false);
  
  // Ref for week grid scroll container
  const weekGridRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const locale = language === 'ru' ? ru : undefined;

  // Build color map for children and adults
  const getItemColor = useCallback((childId: string | null | undefined, parentId: string | null | undefined): string => {
    // If parent activity, find the adult's color
    if (parentId) {
      const adult = eligibleAdults.find(a => a.userId === parentId);
      return adult?.activityColor || DEFAULT_COLOR;
    }
    // For child, find their color
    if (childId) {
      const child = children.find(c => c.id === childId);
      return child?.color || DEFAULT_COLOR;
    }
    return DEFAULT_COLOR;
  }, [children, eligibleAdults]);

  // Check if an adult is selected (format: parent:userId)
  const isAdultSelected = selectedChildId?.startsWith('parent:') ?? false;
  const selectedAdultUserId = isAdultSelected ? selectedChildId?.replace('parent:', '') : null;

  // Filter activities by child (activity_schedules - these are child-only)
  const filteredActivities = useMemo(() => {
    // If adult is selected, show no activity_schedules (they're child-only)
    if (isAdultSelected) return [];
    if (!selectedChildId) return activities;
    return activities.filter(a => a.child_id === selectedChildId);
  }, [activities, selectedChildId, isAdultSelected]);

  // Filter task templates (ONLY activities, not routines)
  // Parent activities (assignee_parent_id != null) should only appear when:
  // - "All" view is selected
  // - That specific adult is selected
  const activityTasks = useMemo(() => {
    const tasks = templates.filter(t => 
      t.status === 'active' && 
      t.task_category === 'activity' // Only show activities in calendar
    );
    
    if (!selectedChildId) {
      // "All" view - show all child activities AND parent activities
      return tasks;
    }
    
    // Adult selected - show only that adult's activities
    if (isAdultSelected && selectedAdultUserId) {
      return tasks.filter(t => 
        (t as any).assignee_parent_id === selectedAdultUserId
      );
    }
    
    // Specific child selected - show that child's tasks and "all children" tasks
    // Exclude parent activities (those with assignee_parent_id set)
    return tasks.filter(t => {
      // Exclude parent activities
      if ((t as any).assignee_parent_id) return false;
      // Include tasks for this child or for all children
      return t.child_id === selectedChildId || t.child_id === null;
    });
  }, [templates, selectedChildId, isAdultSelected, selectedAdultUserId]);

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
          endTime: task.end_time,
          assigneeParentId: (task as any).assignee_parent_id || null,
        });
      }
    });
    
    return items.sort((a, b) => a.time.localeCompare(b.time));
  }, [filteredActivities, activityTasks]);

  // Get items that start at a specific hour
  const getItemsStartingAtHour = (date: Date, hour: number): ScheduleItem[] => {
    const dayItems = getItemsForDay(date);
    return dayItems.filter(item => {
      const itemHour = parseInt(item.time.split(':')[0], 10);
      return itemHour === hour;
    });
  };

  // Calculate the duration in hours for an item
  const getItemDurationHours = (item: ScheduleItem): number => {
    // If duration is provided (in minutes), use it
    if (item.duration) {
      return Math.max(1, Math.ceil(item.duration / 60));
    }
    
    // If end_time is provided, calculate duration
    if (item.endTime) {
      const startHour = parseInt(item.time.split(':')[0], 10);
      const startMin = parseInt(item.time.split(':')[1], 10);
      const endHour = parseInt(item.endTime.split(':')[0], 10);
      const endMin = parseInt(item.endTime.split(':')[1], 10);
      
      const startTotalMins = startHour * 60 + startMin;
      const endTotalMins = endHour * 60 + endMin;
      const durationMins = endTotalMins - startTotalMins;
      
      if (durationMins > 0) {
        return Math.max(1, Math.ceil(durationMins / 60));
      }
    }
    
    // Default to 1 hour
    return 1;
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
  // Full day hours: 00:00 to 23:00
  const hours = Array.from({ length: 24 }, (_, i) => i);

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
    setAddActivityTime(hour !== undefined ? `${hour.toString().padStart(2, '0')}:00` : null);
    setAddActivityOpen(true);
  };

  // Handle item click - open action sheet for all items
  const handleItemClick = (item: ScheduleItem, e?: React.MouseEvent) => {
    if (isReadOnly) return;
    if (e) e.stopPropagation();
    
    // Create ActionableItem for the action sheet
    const actionItem: ActionableItem = {
      id: item.id,
      title_ru: item.title_ru,
      title_en: item.title_en,
      type: item.type,
      originalActivity: item.originalActivity,
      originalTemplate: item.originalTemplate,
    };
    
    setActionSheetItem(actionItem);
    setActionSheetOpen(true);
  };

  // Handle edit from action sheet
  const handleEditItem = () => {
    if (!actionSheetItem) return;
    
    if (actionSheetItem.type === 'activity' && actionSheetItem.originalActivity) {
      setEditingActivity(actionSheetItem.originalActivity);
    } else if (actionSheetItem.type === 'task' && actionSheetItem.originalTemplate) {
      setEditingTemplate(actionSheetItem.originalTemplate);
    }
  };

  // Handle copy from action sheet
  const handleCopyItem = () => {
    if (!actionSheetItem) return;
    
    if (actionSheetItem.type === 'activity' && actionSheetItem.originalActivity) {
      setCopyDialogActivity(actionSheetItem.originalActivity);
      setCopyDialogOpen(true);
    } else if (actionSheetItem.type === 'task' && actionSheetItem.originalTemplate) {
      setCopyDialogTemplate(actionSheetItem.originalTemplate);
      setCopyTaskDialogOpen(true);
    }
  };

  // Handle delete from action sheet
  const handleDeleteItem = () => {
    if (!actionSheetItem) return;
    setItemToDelete({ id: actionSheetItem.id, type: actionSheetItem.type });
    setDeleteDialogOpen(true);
  };

  // Handle activity copy complete - open edit dialog for new activity
  const handleActivityCopyComplete = (newActivity: ActivitySchedule) => {
    // Small delay to allow the copy dialog to close first
    setTimeout(() => {
      setEditingActivity(newActivity);
    }, 100);
  };

  // Handle task copy complete - open edit dialog for new template
  const handleTaskCopyComplete = (newTemplate: TaskTemplate) => {
    // Small delay to allow the copy dialog to close first
    setTimeout(() => {
      setEditingTemplate(newTemplate);
    }, 100);
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

  // Render week view item with proper duration height
  const renderWeekItem = (item: ScheduleItem, dayIndex: number, hour: number) => {
    const child = children.find(c => c.id === item.child_id);
    const itemColor = getItemColor(item.child_id, item.assigneeParentId);
    const cardStyles = getCardStyles(itemColor);
    const durationHours = getItemDurationHours(item);
    const heightPx = durationHours * 50 - 2; // 50px per hour minus gap
    
    return (
      <div 
        key={item.id}
        onClick={(e) => handleItemClick(item, e)}
        style={{ 
          height: `${heightPx}px`, 
          minHeight: '48px',
          backgroundColor: cardStyles.bg,
        }}
        className="text-[10px] p-1.5 rounded border border-border cursor-pointer hover:shadow-md transition-shadow font-medium overflow-hidden absolute left-0.5 right-0.5 z-10 flex"
      >
        {/* Left color indicator */}
        <div 
          className="w-[3px] shrink-0 rounded-full mr-1.5"
          style={{ backgroundColor: cardStyles.indicatorColor }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="shrink-0">{item.icon || child?.avatar_url || '📅'}</span>
            <span className="font-semibold truncate text-foreground">
              {language === 'ru' ? item.title_ru : item.title_en}
            </span>
          </div>
          {durationHours > 1 && (
            <div className="text-[9px] text-muted-foreground mt-0.5">
              {item.time.slice(0, 5)} - {item.endTime?.slice(0, 5) || `${(parseInt(item.time.split(':')[0]) + durationHours).toString().padStart(2, '0')}:${item.time.split(':')[1]}`}
            </div>
          )}
          {item.location && durationHours > 1 && (
            <div className="text-[9px] text-muted-foreground truncate">📍 {item.location}</div>
          )}
        </div>
      </div>
    );
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

          {/* Child/Adult Selector */}
          <Select 
            value={selectedChildId || 'all'} 
            onValueChange={(v) => onChildChange(v === 'all' ? null : v)}
          >
            <SelectTrigger className="w-[140px] h-8 text-sm">
              <SelectValue placeholder={t('filter_all')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('filter_all')}</SelectItem>
              
              {/* Children section */}
              {children.length > 0 && (
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                  {language === 'ru' ? 'Дети' : 'Children'}
                </div>
              )}
              {children.map(child => (
                <SelectItem key={child.id} value={child.id}>
                  <div className="flex items-center gap-2">
                    <ChildAvatar avatar={child.avatar_url || '🦁'} size="xs" />
                    <span>{child.name}</span>
                  </div>
                </SelectItem>
              ))}
              
              {/* Adults section - only eligible adults with parent_activities_enabled */}
              {/* Hide adults if hideAdults prop is true */}
              {!hideAdults && allowParentActivities && eligibleAdults.length > 0 && (
                <>
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-1 pt-2">
                    {language === 'ru' ? 'Взрослые' : 'Adults'}
                  </div>
                  {eligibleAdults.map(adult => (
                    <SelectItem key={adult.id} value={adult.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px]"
                          style={{ backgroundColor: adult.activityColor }}
                        >
                          👤
                        </div>
                        <span>
                          {adult.name}
                          {adult.isSelf && ` (${language === 'ru' ? 'Вы' : 'You'})`}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-auto mt-3" style={{ WebkitOverflowScrolling: 'touch' }}>
        {viewMode === 'month' ? (
          <div className="border border-border rounded-xl overflow-hidden bg-background shadow-sm">
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-border bg-muted/30">
              {weekDays.map((day, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "text-center text-xs font-semibold py-2 uppercase tracking-wide",
                    i < 6 && "border-r border-border/50",
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
                    "min-h-[80px] md:min-h-[100px] bg-muted/10 border-b border-border/50",
                    i < 6 && "border-r border-border/50"
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
                      'min-h-[80px] md:min-h-[100px] p-1.5 transition-colors text-left hover:bg-muted/30 relative group bg-background',
                      !isLastColumn && "border-r border-border/50",
                      !isLastRow && "border-b border-border/50",
                      isToday(day) && 'bg-primary/5',
                      dayOfWeek >= 5 && !isToday(day) && 'bg-muted/5'
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
                        const itemColor = getItemColor(item.child_id, item.assigneeParentId);
                        const cardStyles = getCardStyles(itemColor);
                        return (
                          <div 
                            key={item.id}
                            onClick={(e) => handleItemClick(item, e)}
                            style={{ backgroundColor: cardStyles.bg }}
                            className="text-[10px] px-1 py-0.5 rounded truncate flex items-center gap-1 border border-border font-medium cursor-pointer hover:shadow-sm transition-shadow"
                          >
                            {/* Left color indicator */}
                            <div 
                              className="w-[2px] h-3 shrink-0 rounded-full"
                              style={{ backgroundColor: cardStyles.indicatorColor }}
                            />
                            <span className="shrink-0">{item.icon || child?.avatar_url || '📅'}</span>
                            <span className="truncate font-semibold text-foreground">
                              {language === 'ru' ? item.title_ru : item.title_en}
                            </span>
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
          <div 
            ref={weekGridRef}
            className="min-w-[700px] border border-border rounded-xl overflow-hidden bg-background shadow-sm"
          >
            {/* Header row with days */}
            <div className="grid grid-cols-8 border-b border-border sticky top-0 bg-muted/30 z-10">
              <div className="p-2 text-center text-xs text-muted-foreground font-semibold border-r border-border/50" />
              {days.map((day, index) => (
                <div 
                  key={day.toISOString()} 
                  className={cn(
                    "p-2 text-center bg-background",
                    index < days.length - 1 && "border-r border-border/50",
                    isToday(day) ? "bg-primary/5" : index >= 5 ? "bg-muted/5" : ""
                  )}
                >
                  <div className={cn(
                    "text-xs font-semibold uppercase tracking-wide",
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
                  hourIndex < hours.length - 1 && "border-b border-border/30"
                )}>
                  {/* Hour label */}
                  <div className="p-1 text-xs text-muted-foreground font-mono font-medium text-right pr-2 border-r border-border/50 bg-muted/10 flex items-start justify-end">
                    {hour.toString().padStart(2, '0')}:00
                  </div>
                  {/* Day columns */}
                  {days.map((day, dayIndex) => {
                    const hourItems = getItemsStartingAtHour(day, hour);
                    return (
                      <button 
                        key={day.toISOString()} 
                        onClick={() => handleCellClick(day, hour)}
                        disabled={isReadOnly}
                        className={cn(
                          "p-0.5 min-h-[50px] relative group hover:bg-muted/20 transition-colors",
                          dayIndex < days.length - 1 && "border-r border-border/30",
                          isToday(day) && "bg-primary/[0.02]",
                          dayIndex >= 5 && !isToday(day) && "bg-muted/[0.02]"
                        )}
                      >
                        {hourItems.map(item => renderWeekItem(item, dayIndex, hour))}
                        {/* Add indicator */}
                        {!isReadOnly && hourItems.length === 0 && (
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Plus className="w-4 h-4 text-muted-foreground/30" />
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
                    'rounded-xl p-4 border',
                    isToday(day) ? 'bg-primary/5 border-primary/20' : 'bg-background border-border'
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
                        const itemColor = getItemColor(item.child_id, item.assigneeParentId);
                        const cardStyles = getCardStyles(itemColor);
                        return (
                          <div 
                            key={item.id}
                            style={{ backgroundColor: cardStyles.bg }}
                            className="flex items-center gap-3 p-3 rounded-lg border border-border group hover:shadow-sm transition-shadow"
                          >
                            {/* Left color indicator */}
                            <div 
                              className="w-[3px] h-full self-stretch shrink-0 rounded-full"
                              style={{ backgroundColor: cardStyles.indicatorColor }}
                            />
                            <div className="text-sm font-mono font-bold w-14 shrink-0 text-foreground">
                              {item.time.slice(0, 5)}
                            </div>
                            {child && (
                              <ChildAvatar avatar={child.avatar_url || '🦁'} size="sm" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm break-words line-clamp-2 leading-snug text-foreground">
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
                                  <DropdownMenuItem onClick={() => {
                                    if (item.type === 'activity' && item.originalActivity) {
                                      setCopyDialogActivity(item.originalActivity);
                                      setCopyDialogOpen(true);
                                    } else if (item.type === 'task' && item.originalTemplate) {
                                      setCopyDialogTemplate(item.originalTemplate);
                                      setCopyTaskDialogOpen(true);
                                    }
                                  }}>
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

      {/* Unified Action Sheet for all items */}
      <ItemActionSheet
        item={actionSheetItem}
        open={actionSheetOpen}
        onOpenChange={setActionSheetOpen}
        onEdit={handleEditItem}
        onCopy={handleCopyItem}
        onDelete={handleDeleteItem}
      />

      {/* Copy Activity Dialog */}
      <CopyActivityDialog
        activity={copyDialogActivity}
        open={copyDialogOpen}
        onOpenChange={setCopyDialogOpen}
        onCopyComplete={handleActivityCopyComplete}
      />

      {/* Copy Task Dialog */}
      <CopyTaskDialog
        template={copyDialogTemplate}
        open={copyTaskDialogOpen}
        onOpenChange={setCopyTaskDialogOpen}
        onCopyComplete={handleTaskCopyComplete}
      />

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
