import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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

const activitySchema = z.object({
  titleRu: z.string()
    .trim()
    .min(1, { message: 'Название обязательно' })
    .max(100, { message: 'Название не должно превышать 100 символов' }),
  titleEn: z.string()
    .trim()
    .max(100, { message: 'Title should not exceed 100 characters' })
    .optional(),
  time: z.string().min(1, { message: 'Время обязательно' }),
  duration: z.number()
    .min(5, { message: 'Минимум 5 минут' })
    .max(480, { message: 'Максимум 8 часов' }),
  location: z.string()
    .trim()
    .max(200, { message: 'Место не должно превышать 200 символов' })
    .optional(),
});

type ActivityFormData = z.infer<typeof activitySchema>;

interface EditActivityDialogProps {
  activity: ActivitySchedule | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditActivityDialog = ({ activity, open, onOpenChange }: EditActivityDialogProps) => {
  const { language } = useLanguage();
  const { updateActivity, deleteActivity } = useSchedule();
  const { toast } = useToast();
  
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const form = useForm<ActivityFormData>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      titleRu: '',
      titleEn: '',
      time: '09:00',
      duration: 60,
      location: '',
    },
  });

  useEffect(() => {
    if (activity && open) {
      form.reset({
        titleRu: activity.title_ru,
        titleEn: activity.title_en,
        time: activity.time,
        duration: activity.duration,
        location: activity.location || '',
      });
      setSelectedDays(activity.recurring_days || []);
    }
  }, [activity, open, form]);

  const toggleDay = (day: number) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const handleSubmit = async (data: ActivityFormData) => {
    if (!activity) return;
    
    setIsSubmitting(true);
    try {
      await updateActivity.mutateAsync({
        id: activity.id,
        title_ru: data.titleRu,
        title_en: data.titleEn?.trim() || data.titleRu,
        time: data.time,
        duration: data.duration,
        location: data.location?.trim() || null,
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

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>{language === 'ru' ? 'Название' : 'Title'}</Label>
            <Input
              {...form.register('titleRu')}
              placeholder={language === 'ru' ? 'Название занятия' : 'Activity title'}
              maxLength={100}
            />
            {form.formState.errors.titleRu && (
              <p className="text-sm text-destructive">{form.formState.errors.titleRu.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>{language === 'ru' ? 'Название (EN)' : 'Title (EN)'}</Label>
            <Input
              {...form.register('titleEn')}
              placeholder="Activity title in English"
              maxLength={100}
            />
            {form.formState.errors.titleEn && (
              <p className="text-sm text-destructive">{form.formState.errors.titleEn.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{language === 'ru' ? 'Время' : 'Time'}</Label>
              <Input
                type="time"
                {...form.register('time')}
              />
              {form.formState.errors.time && (
                <p className="text-sm text-destructive">{form.formState.errors.time.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>{language === 'ru' ? 'Длительность (мин)' : 'Duration (min)'}</Label>
              <Input
                type="number"
                min={5}
                max={480}
                {...form.register('duration', { valueAsNumber: true })}
              />
              {form.formState.errors.duration && (
                <p className="text-sm text-destructive">{form.formState.errors.duration.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>{language === 'ru' ? 'Место' : 'Location'}</Label>
            <Input
              {...form.register('location')}
              placeholder={language === 'ru' ? 'Где проходит занятие' : 'Where the activity takes place'}
              maxLength={200}
            />
            {form.formState.errors.location && (
              <p className="text-sm text-destructive">{form.formState.errors.location.message}</p>
            )}
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
              type="button"
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
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting || isDeleting}
              className="flex-1"
            >
              {language === 'ru' ? 'Отмена' : 'Cancel'}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || isDeleting}
              className="flex-1"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                language === 'ru' ? 'Сохранить' : 'Save'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
