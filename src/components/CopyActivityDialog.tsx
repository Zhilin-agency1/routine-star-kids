import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { useChildren } from '@/hooks/useChildren';
import { useSchedule, type ActivitySchedule } from '@/hooks/useSchedule';
import { ChildAvatar } from '@/components/ui/ChildAvatar';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface CopyActivityDialogProps {
  activity: ActivitySchedule | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCopyComplete?: (newActivity: ActivitySchedule) => void;
}

export const CopyActivityDialog = ({
  activity,
  open,
  onOpenChange,
  onCopyComplete,
}: CopyActivityDialogProps) => {
  const { language } = useLanguage();
  const { children } = useChildren();
  const { createActivity, activities } = useSchedule();
  const locale = language === 'ru' ? ru : undefined;

  const [targetDate, setTargetDate] = useState<Date>(new Date());
  const [targetTime, setTargetTime] = useState<string>('');
  const [targetChildId, setTargetChildId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  useEffect(() => {
    if (activity && open) {
      setTargetDate(new Date());
      setTargetTime(activity.time);
      setTargetChildId(activity.child_id);
    }
  }, [activity, open]);

  const handleCopy = async () => {
    if (!activity) return;

    setIsSubmitting(true);
    try {
      const copiedTitle_ru = `${activity.title_ru} (${language === 'ru' ? 'Копия' : 'Copy'})`;
      const copiedTitle_en = `${activity.title_en} (Copy)`;

      // Calculate recurring days based on target date
      const targetDayOfWeek = targetDate.getDay();

      const result = await createActivity.mutateAsync({
        title_ru: copiedTitle_ru,
        title_en: copiedTitle_en,
        child_id: targetChildId,
        time: targetTime || activity.time,
        duration: activity.duration,
        location: activity.location,
        recurring_days: [targetDayOfWeek],
        start_date: format(targetDate, 'yyyy-MM-dd'),
        end_date: activity.end_date,
      });

      toast.success(language === 'ru' ? 'Занятие скопировано!' : 'Activity copied!');
      onOpenChange(false);

      // Find the newly created activity and open edit dialog
      if (onCopyComplete && result) {
        // The result should contain the new activity
        const newActivity = activities.find(a => 
          a.title_ru === copiedTitle_ru && 
          a.child_id === targetChildId
        ) || result as ActivitySchedule;
        
        if (newActivity) {
          onCopyComplete(newActivity);
        }
      }
    } catch (error) {
      toast.error(language === 'ru' ? 'Ошибка при копировании' : 'Failed to copy');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!activity) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {language === 'ru' ? 'Копировать занятие' : 'Copy Activity'}
          </DialogTitle>
          <DialogDescription>
            {language === 'ru' 
              ? 'Выберите дату, время и ребенка для копии'
              : 'Choose date, time and child for the copy'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Original activity preview */}
          <div className="p-3 bg-muted rounded-lg">
            <p className="font-medium text-sm truncate">
              {language === 'ru' ? activity.title_ru : activity.title_en}
            </p>
            <p className="text-xs text-muted-foreground">
              {activity.time.slice(0, 5)} • {activity.duration} {language === 'ru' ? 'мин' : 'min'}
            </p>
          </div>

          {/* Target Date */}
          <div className="space-y-2">
            <Label>{language === 'ru' ? 'Дата' : 'Date'}</Label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !targetDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {targetDate ? format(targetDate, 'PPP', { locale }) : (
                    language === 'ru' ? 'Выберите дату' : 'Pick a date'
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={targetDate}
                  onSelect={(date) => {
                    if (date) {
                      setTargetDate(date);
                      setCalendarOpen(false);
                    }
                  }}
                  locale={locale}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Target Time */}
          <div className="space-y-2">
            <Label>{language === 'ru' ? 'Время' : 'Time'}</Label>
            <Input
              type="time"
              value={targetTime}
              onChange={(e) => setTargetTime(e.target.value)}
            />
          </div>

          {/* Target Child */}
          <div className="space-y-2">
            <Label>{language === 'ru' ? 'Ребенок' : 'Child'}</Label>
            <Select value={targetChildId} onValueChange={setTargetChildId}>
              <SelectTrigger>
                <SelectValue placeholder={language === 'ru' ? 'Выберите ребенка' : 'Select child'} />
              </SelectTrigger>
              <SelectContent>
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

        <div className="flex gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="flex-1"
          >
            {language === 'ru' ? 'Отмена' : 'Cancel'}
          </Button>
          <Button
            onClick={handleCopy}
            disabled={isSubmitting || !targetChildId}
            className="flex-1"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              language === 'ru' ? 'Копировать' : 'Copy'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
