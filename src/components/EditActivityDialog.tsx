import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSchedule, type ActivitySchedule } from '@/hooks/useSchedule';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Trash2 } from 'lucide-react';

const weekDays = [
  { value: 1, labelRu: 'Пн', labelEn: 'Mon' },
  { value: 2, labelRu: 'Вт', labelEn: 'Tue' },
  { value: 3, labelRu: 'Ср', labelEn: 'Wed' },
  { value: 4, labelRu: 'Чт', labelEn: 'Thu' },
  { value: 5, labelRu: 'Пт', labelEn: 'Fri' },
  { value: 6, labelRu: 'Сб', labelEn: 'Sat' },
  { value: 0, labelRu: 'Вс', labelEn: 'Sun' },
];

interface EditActivityDialogProps {
  activity: ActivitySchedule | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditActivityDialog = ({ activity, open, onOpenChange }: EditActivityDialogProps) => {
  const { language } = useLanguage();
  const { updateActivity, deleteActivity } = useSchedule();
  const { toast } = useToast();
  
  const [titleRu, setTitleRu] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [time, setTime] = useState('09:00');
  const [duration, setDuration] = useState(60);
  const [location, setLocation] = useState('');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (activity) {
      setTitleRu(activity.title_ru);
      setTitleEn(activity.title_en);
      setTime(activity.time);
      setDuration(activity.duration);
      setLocation(activity.location || '');
      setSelectedDays(activity.recurring_days || []);
    }
  }, [activity]);

  const toggleDay = (day: number) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const handleSubmit = async () => {
    if (!activity || !titleRu.trim()) return;
    
    setIsSubmitting(true);
    try {
      await updateActivity.mutateAsync({
        id: activity.id,
        title_ru: titleRu.trim(),
        title_en: titleEn.trim() || titleRu.trim(),
        time,
        duration,
        location: location.trim() || null,
        recurring_days: selectedDays,
      });
      
      toast({
        title: language === 'ru' ? 'Занятие обновлено' : 'Activity updated',
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: language === 'ru' ? 'Ошибка' : 'Error',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!activity) return;
    
    setIsDeleting(true);
    try {
      await deleteActivity.mutateAsync(activity.id);
      
      toast({
        title: language === 'ru' ? 'Занятие удалено' : 'Activity deleted',
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: language === 'ru' ? 'Ошибка' : 'Error',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {language === 'ru' ? 'Редактировать занятие' : 'Edit Activity'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{language === 'ru' ? 'Название' : 'Title'}</Label>
            <Input
              value={titleRu}
              onChange={(e) => setTitleRu(e.target.value)}
              placeholder={language === 'ru' ? 'Название занятия' : 'Activity title'}
            />
          </div>

          <div className="space-y-2">
            <Label>{language === 'ru' ? 'Название (EN)' : 'Title (EN)'}</Label>
            <Input
              value={titleEn}
              onChange={(e) => setTitleEn(e.target.value)}
              placeholder="Activity title in English"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{language === 'ru' ? 'Время' : 'Time'}</Label>
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{language === 'ru' ? 'Длительность (мин)' : 'Duration (min)'}</Label>
              <Input
                type="number"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                min={5}
                max={480}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{language === 'ru' ? 'Место' : 'Location'}</Label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={language === 'ru' ? 'Где проходит занятие' : 'Where the activity takes place'}
            />
          </div>

          <div className="space-y-2">
            <Label>{language === 'ru' ? 'Дни недели' : 'Days of week'}</Label>
            <div className="flex flex-wrap gap-2">
              {weekDays.map(day => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleDay(day.value)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedDays.includes(day.value)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  {language === 'ru' ? day.labelRu : day.labelEn}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isSubmitting || isDeleting}
              className="flex-shrink-0"
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting || isDeleting}
              className="flex-1"
            >
              {language === 'ru' ? 'Отмена' : 'Cancel'}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || isDeleting || !titleRu.trim()}
              className="flex-1"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                language === 'ru' ? 'Сохранить' : 'Save'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
