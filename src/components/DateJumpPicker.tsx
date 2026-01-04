import { useState, useMemo } from 'react';
import { X, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, isSameDay, isSameMonth, getDay } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { getWeekDays } from '@/i18n/translations';

interface DateJumpPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

export const DateJumpPicker = ({
  open,
  onOpenChange,
  selectedDate,
  onSelectDate,
}: DateJumpPickerProps) => {
  const { language, t } = useLanguage();
  const locale = language === 'ru' ? ru : enUS;
  
  // Start with the month of the selected date
  const [baseMonth, setBaseMonth] = useState(() => startOfMonth(selectedDate));
  
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
                  const isSelected = isSameDay(day, selectedDate);
                  const isToday = isSameDay(day, new Date());
                  const dayOfWeek = (getDay(day) + 6) % 7; // Monday = 0
                  const isWeekend = dayOfWeek >= 5;
                  
                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => handleDateClick(day)}
                      className={cn(
                        "aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all min-h-[40px]",
                        "hover:bg-primary/20 active:scale-95",
                        isSelected && "bg-primary text-primary-foreground hover:bg-primary",
                        isToday && !isSelected && "border-2 border-primary text-primary",
                        isWeekend && !isSelected && !isToday && "text-muted-foreground",
                        !isSelected && !isToday && !isWeekend && "text-foreground"
                      )}
                    >
                      {format(day, 'd')}
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
