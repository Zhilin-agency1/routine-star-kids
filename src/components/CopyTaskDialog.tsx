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
import { useTasks } from '@/hooks/useTasks';
import { ChildAvatar } from '@/components/ui/ChildAvatar';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type TaskTemplate = Database['public']['Tables']['task_templates']['Row'];

interface CopyTaskDialogProps {
  template: TaskTemplate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCopyComplete?: (newTemplate: TaskTemplate) => void;
}

export const CopyTaskDialog = ({
  template,
  open,
  onOpenChange,
  onCopyComplete,
}: CopyTaskDialogProps) => {
  const { language } = useLanguage();
  const { children } = useChildren();
  const { createTemplate, templates } = useTasks();
  const locale = language === 'ru' ? ru : undefined;

  const [targetDate, setTargetDate] = useState<Date>(new Date());
  const [targetTime, setTargetTime] = useState<string>('');
  const [targetChildId, setTargetChildId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  useEffect(() => {
    if (template && open) {
      setTargetDate(new Date());
      setTargetTime(template.recurring_time || '09:00');
      setTargetChildId(template.child_id || '');
    }
  }, [template, open]);

  const handleCopy = async () => {
    if (!template) return;

    setIsSubmitting(true);
    try {
      const copiedTitle_ru = `${template.title_ru} (${language === 'ru' ? 'Копия' : 'Copy'})`;
      const copiedTitle_en = `${template.title_en} (Copy)`;

      // Calculate recurring days based on target date for one-time tasks
      const targetDayOfWeek = targetDate.getDay();
      const dateStr = format(targetDate, 'yyyy-MM-dd');

      const result = await createTemplate.mutateAsync({
        title_ru: copiedTitle_ru,
        title_en: copiedTitle_en,
        description_ru: template.description_ru,
        description_en: template.description_en,
        icon: template.icon,
        reward_amount: template.reward_amount,
        task_type: template.task_type,
        task_category: template.task_category,
        recurring_days: template.task_type === 'recurring' ? [targetDayOfWeek] : template.recurring_days,
        recurring_time: targetTime || template.recurring_time,
        end_time: template.end_time,
        child_id: targetChildId || template.child_id,
        start_date: dateStr,
        end_date: template.end_date,
        one_time_date: template.task_type === 'one_time' ? dateStr : template.one_time_date,
      });

      toast.success(language === 'ru' ? 'Скопировано!' : 'Copied!');
      onOpenChange(false);

      // Find the newly created template and open edit dialog
      if (onCopyComplete && result) {
        // Small delay to allow state updates
        setTimeout(() => {
          const newTemplate = templates.find(t => 
            t.title_ru === copiedTitle_ru && 
            t.child_id === (targetChildId || template.child_id)
          ) || result as TaskTemplate;
          
          if (newTemplate) {
            onCopyComplete(newTemplate);
          }
        }, 100);
      }
    } catch (error) {
      toast.error(language === 'ru' ? 'Ошибка при копировании' : 'Failed to copy');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!template) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {language === 'ru' ? 'Копировать' : 'Copy'}
          </DialogTitle>
          <DialogDescription>
            {language === 'ru' 
              ? 'Выберите дату, время и ребенка для копии'
              : 'Choose date, time and child for the copy'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Original item preview */}
          <div className="p-3 bg-muted rounded-lg">
            <p className="font-medium text-sm truncate">
              {template.icon && <span className="mr-1">{template.icon}</span>}
              {language === 'ru' ? template.title_ru : template.title_en}
            </p>
            <p className="text-xs text-muted-foreground">
              {template.recurring_time?.slice(0, 5) || '09:00'}
              {template.reward_amount > 0 && ` • ${template.reward_amount} 🪙`}
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
