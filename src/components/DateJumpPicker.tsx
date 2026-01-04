import { useState, useMemo, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, isSameDay, getDay, parseISO } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { getWeekDays } from '@/i18n/translations';
import { toLocalDateString } from '@/lib/dateUtils';
import { supabase } from '@/integrations/supabase/client';
import { useFamily } from '@/hooks/useFamily';

interface DateJumpPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  childId?: string; // Optional: filter by specific child
}

export const DateJumpPicker = ({
  open,
  onOpenChange,
  selectedDate,
  onSelectDate,
  childId,
}: DateJumpPickerProps) => {
  const { language, t } = useLanguage();
  const { family } = useFamily();
  const locale = language === 'ru' ? ru : enUS;
  
  // Start with the month of the selected date
  const [baseMonth, setBaseMonth] = useState(() => startOfMonth(selectedDate));
  const [hasItemsByDate, setHasItemsByDate] = useState<Record<string, boolean>>({});
  
  // Reset base month when dialog opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setBaseMonth(startOfMonth(selectedDate));
    }
    onOpenChange(newOpen);
  };
  
  const weekDays = getWeekDays(language);
  
  // Generate two months of data
  const months = useMemo(() => {
    const month1 = baseMonth;
    const month2 = addMonths(baseMonth, 1);
    
    return [month1, month2].map(monthStart => {
      const start = startOfMonth(monthStart);
      const end = endOfMonth(monthStart);
      const days = eachDayOfInterval({ start, end });
      
      // Calculate offset for first day (Monday = 0)
      const firstDayOffset = (getDay(start) + 6) % 7;
      
      return {
        monthStart,
        days,
        firstDayOffset,
      };
    });
  }, [baseMonth]);
  
  // Fetch task, activity, and template presence data for visible range
  useEffect(() => {
    if (!open || !family) return;

    const fetchPresenceData = async () => {
      const rangeStartDate = startOfMonth(baseMonth);
      const rangeEndDate = endOfMonth(addMonths(baseMonth, 1));
      const rangeStart = toLocalDateString(rangeStartDate);
      const rangeEnd = toLocalDateString(rangeEndDate);

      const presenceMap: Record<string, boolean> = {};
      const allDays = eachDayOfInterval({ start: rangeStartDate, end: rangeEndDate });

      // Query 1: Task instances in date range
      let taskQuery = supabase
        .from('task_instances')
        .select('due_datetime, child_id, template:task_templates!inner(family_id)')
        .eq('template.family_id', family.id)
        .gte('due_datetime', `${rangeStart}T00:00:00`)
        .lte('due_datetime', `${rangeEnd}T23:59:59.999`)
        .neq('state', 'cancelled');

      if (childId) {
        taskQuery = taskQuery.eq('child_id', childId);
      }

      // Query 2: Activity schedules that overlap the range
      let activityQuery = supabase
        .from('activity_schedules')
        .select('start_date, end_date, recurring_days, child_id')
        .eq('family_id', family.id)
        .lte('start_date', rangeEnd)
        .or(`end_date.is.null,end_date.gte.${rangeStart}`);

      if (childId) {
        activityQuery = activityQuery.eq('child_id', childId);
      }

      // Query 3: Task templates that overlap the range (covers future routines without instances)
      let templateQuery = supabase
        .from('task_templates')
        .select('task_type, one_time_date, start_date, end_date, recurring_days, recurring_rule, child_id')
        .eq('family_id', family.id)
        .eq('status', 'active');

      if (childId) {
        // Include child-specific + family-wide templates
        templateQuery = templateQuery.or(
          `and(or(child_id.is.null,child_id.eq.${childId}),or(and(task_type.eq.one_time,one_time_date.gte.${rangeStart},one_time_date.lte.${rangeEnd}),and(task_type.eq.recurring,start_date.lte.${rangeEnd},or(end_date.is.null,end_date.gte.${rangeStart}))))`
        );
      } else {
        templateQuery = templateQuery.or(
          `and(task_type.eq.one_time,one_time_date.gte.${rangeStart},one_time_date.lte.${rangeEnd}),and(task_type.eq.recurring,start_date.lte.${rangeEnd},or(end_date.is.null,end_date.gte.${rangeStart}))`
        );
      }

      // Execute all queries in parallel
      const [taskResult, activityResult, templateResult] = await Promise.all([
        taskQuery,
        activityQuery,
        templateQuery,
      ]);

      // Process task instances
      if (!taskResult.error && taskResult.data) {
        taskResult.data.forEach((instance) => {
          const dateStr = toLocalDateString(parseISO(instance.due_datetime));
          presenceMap[dateStr] = true;
        });
      }

      // Process activity schedules - expand recurring days
      if (!activityResult.error && activityResult.data) {
        activityResult.data.forEach((schedule) => {
          const scheduleStart = parseISO(schedule.start_date);
          const scheduleEnd = schedule.end_date ? parseISO(schedule.end_date) : null;
          const recurringDays = schedule.recurring_days || [];

          allDays.forEach((day) => {
            // Check if day is within schedule range
            if (day < scheduleStart) return;
            if (scheduleEnd && day > scheduleEnd) return;

            // Check if day matches recurring pattern (0=Mon, 6=Sun)
            const dayOfWeek = (getDay(day) + 6) % 7;
            if (recurringDays.includes(dayOfWeek)) {
              presenceMap[toLocalDateString(day)] = true;
            }
          });
        });
      }

      // Process task templates
      if (!templateResult.error && templateResult.data) {
        templateResult.data.forEach((template) => {
          // A) One-time templates
          if (template.task_type === 'one_time') {
            if (template.one_time_date) {
              presenceMap[template.one_time_date] = true;
            }
            return;
          }

          // B) Recurring templates (treat recurring_rule as weekly-on-recurring_days)
          const templateStart = parseISO(template.start_date);
          const templateEnd = template.end_date ? parseISO(template.end_date) : null;
          const recurringDays = template.recurring_days || [];

          allDays.forEach((day) => {
            if (day < templateStart) return;
            if (templateEnd && day > templateEnd) return;

            const dayOfWeek = (getDay(day) + 6) % 7;
            if (recurringDays.includes(dayOfWeek)) {
              presenceMap[toLocalDateString(day)] = true;
            }
          });
        });
      }

      setHasItemsByDate(presenceMap);
    };

    fetchPresenceData();
  }, [open, family, baseMonth, childId]);
  
  const handleDateClick = (date: Date) => {
    onSelectDate(date);
    onOpenChange(false);
  };
  
  const navigatePrev = () => {
    setBaseMonth(prev => addMonths(prev, -1));
  };
  
  const navigateNext = () => {
    setBaseMonth(prev => addMonths(prev, 1));
  };
  
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[360px] sm:max-w-[400px] p-0 gap-0 max-h-[90vh] overflow-hidden" hideCloseButton>
        <DialogHeader className="px-4 py-3 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              <DialogTitle className="text-base font-semibold">
                {t('jump_to_date')}
              </DialogTitle>
            </div>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <X className="h-4 w-4" />
                <span className="sr-only">{t('close')}</span>
              </Button>
            </DialogClose>
          </div>
        </DialogHeader>
        
        {/* Navigation */}
        <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/50">
          <Button variant="ghost" size="icon" onClick={navigatePrev} className="h-8 w-8">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="font-medium text-sm">
            {format(months[0].monthStart, 'LLLL yyyy', { locale })} — {format(months[1].monthStart, 'LLLL yyyy', { locale })}
          </span>
          <Button variant="ghost" size="icon" onClick={navigateNext} className="h-8 w-8">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Calendar Grid - Scrollable */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-4 space-y-6">
          {months.map(({ monthStart, days, firstDayOffset }) => (
            <div key={monthStart.toISOString()}>
              {/* Month header */}
              <h3 className="text-sm font-bold text-center mb-3 text-foreground">
                {format(monthStart, 'LLLL yyyy', { locale })}
              </h3>
              
              {/* Weekday headers */}
              <div className="grid grid-cols-7 mb-1">
                {weekDays.map((day, i) => (
                  <div 
                    key={i} 
                    className={cn(
                      "text-center text-xs font-medium py-1",
                      i >= 5 ? "text-muted-foreground" : "text-foreground"
                    )}
                  >
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Days grid */}
              <div className="grid grid-cols-7 gap-0.5">
                {/* Empty cells for offset */}
                {Array.from({ length: firstDayOffset }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square" />
                ))}
                
                {/* Day cells */}
                {days.map(day => {
                  const dateKey = toLocalDateString(day);
                  const isSelected = isSameDay(day, selectedDate);
                  const isToday = isSameDay(day, new Date());
                  const dayOfWeek = (getDay(day) + 6) % 7; // Monday = 0
                  const isWeekend = dayOfWeek >= 5;
                  const hasItems = hasItemsByDate[dateKey];
                  
                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => handleDateClick(day)}
                      className={cn(
                        "aspect-square flex flex-col items-center justify-center rounded-lg text-sm font-medium transition-all min-h-[40px] relative",
                        "hover:bg-primary/20 active:scale-95",
                        isSelected && "bg-primary text-primary-foreground hover:bg-primary",
                        isToday && !isSelected && "border-2 border-primary text-primary",
                        isWeekend && !isSelected && !isToday && "text-muted-foreground",
                        !isSelected && !isToday && !isWeekend && "text-foreground"
                      )}
                    >
                      <span>{format(day, 'd')}</span>
                      {hasItems && (
                        <span 
                          className={cn(
                            "absolute bottom-1 w-1 h-1 rounded-full",
                            isSelected ? "bg-primary-foreground" : "bg-primary"
                          )} 
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
