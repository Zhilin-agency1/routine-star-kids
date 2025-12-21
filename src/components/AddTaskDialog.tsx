import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Loader2, ClipboardList, Clock, Calendar, RotateCcw } from 'lucide-react';
import { useTasks } from '@/hooks/useTasks';
import { useChildren } from '@/hooks/useChildren';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const taskIcons = [
  '✨', '🛏️', '🪥', '🍳', '📚', '🧹', '🧸', '🎒',
  '🏃', '🎹', '🎨', '✏️', '🧘', '🚿', '👕', '🍽️',
];

const weekDays = [
  { value: 1, labelRu: 'Пн', labelEn: 'Mon' },
  { value: 2, labelRu: 'Вт', labelEn: 'Tue' },
  { value: 3, labelRu: 'Ср', labelEn: 'Wed' },
  { value: 4, labelRu: 'Чт', labelEn: 'Thu' },
  { value: 5, labelRu: 'Пт', labelEn: 'Fri' },
  { value: 6, labelRu: 'Сб', labelEn: 'Sat' },
  { value: 0, labelRu: 'Вс', labelEn: 'Sun' },
];

const taskSchema = z.object({
  titleRu: z.string()
    .trim()
    .min(1, { message: 'Название обязательно' })
    .max(100, { message: 'Название не должно превышать 100 символов' }),
  titleEn: z.string()
    .trim()
    .max(100, { message: 'Title should not exceed 100 characters' })
    .optional(),
  descriptionRu: z.string()
    .trim()
    .max(500, { message: 'Описание не должно превышать 500 символов' })
    .optional(),
  descriptionEn: z.string()
    .trim()
    .max(500, { message: 'Description should not exceed 500 characters' })
    .optional(),
  rewardAmount: z.number()
    .min(1, { message: 'Награда должна быть минимум 1' })
    .max(1000, { message: 'Награда не должна превышать 1000' }),
  recurringTime: z.string().optional(),
  childId: z.string().optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface AddTaskDialogProps {
  trigger?: React.ReactNode;
}

export const AddTaskDialog = ({ trigger }: AddTaskDialogProps) => {
  const { language } = useLanguage();
  const [open, setOpen] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState(taskIcons[0]);
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [taskType, setTaskType] = useState<'recurring' | 'one_time'>('recurring');
  const [taskCategory, setTaskCategory] = useState<'routine' | 'activity'>('routine');
  const [hasTime, setHasTime] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { createTemplate } = useTasks();
  const { children } = useChildren();

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      titleRu: '',
      titleEn: '',
      descriptionRu: '',
      descriptionEn: '',
      rewardAmount: 5,
      recurringTime: '',
      childId: '',
    },
  });

  const toggleDay = (day: number) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day].sort((a, b) => a - b)
    );
  };

  const handleSubmit = async (data: TaskFormData) => {
    if (taskType === 'recurring' && selectedDays.length === 0) {
      toast.error('Выберите хотя бы один день недели');
      return;
    }

    setIsSubmitting(true);
    try {
      await createTemplate.mutateAsync({
        title_ru: data.titleRu,
        title_en: data.titleEn || data.titleRu,
        description_ru: data.descriptionRu || null,
        description_en: data.descriptionEn || data.descriptionRu || null,
        icon: selectedIcon,
        reward_amount: data.rewardAmount,
        task_type: taskType,
        task_category: taskCategory,
        recurring_days: taskType === 'recurring' ? selectedDays : null,
        recurring_time: hasTime && data.recurringTime ? data.recurringTime : null,
        child_id: data.childId || null,
        start_date: new Date().toISOString().split('T')[0],
        one_time_date: taskType === 'one_time' ? new Date().toISOString().split('T')[0] : null,
      });
      
      toast.success('Задача создана!');
      setOpen(false);
      form.reset();
      setSelectedIcon(taskIcons[0]);
      setSelectedDays([1, 2, 3, 4, 5]);
      setTaskCategory('routine');
      setHasTime(true);
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при создании задачи');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" className="rounded-xl">
            <Plus className="w-4 h-4 mr-1" />
            Добавить задачу
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5" />
            Новая задача
          </DialogTitle>
          <DialogDescription>
            Создайте задание для ребёнка
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
          {/* Task Category */}
          <div className="space-y-2">
            <Label>Категория</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTaskCategory('routine')}
                className={cn(
                  "p-3 rounded-xl border-2 text-sm font-medium transition-all",
                  taskCategory === 'routine'
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/50"
                )}
              >
                <RotateCcw className="w-4 h-4 inline mr-1" />
                Рутина
              </button>
              <button
                type="button"
                onClick={() => setTaskCategory('activity')}
                className={cn(
                  "p-3 rounded-xl border-2 text-sm font-medium transition-all",
                  taskCategory === 'activity'
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/50"
                )}
              >
                <Calendar className="w-4 h-4 inline mr-1" />
                Занятие
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              {taskCategory === 'routine' 
                ? 'Рутины отображаются только в списке задач' 
                : 'Занятия отображаются в списке задач и в расписании'}
            </p>
          </div>

          {/* Task Type */}
          <div className="space-y-2">
            <Label>Повторение</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTaskType('recurring')}
                className={cn(
                  "p-3 rounded-xl border-2 text-sm font-medium transition-all",
                  taskType === 'recurring'
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/50"
                )}
              >
                🔄 Повторяющаяся
              </button>
              <button
                type="button"
                onClick={() => setTaskType('one_time')}
                className={cn(
                  "p-3 rounded-xl border-2 text-sm font-medium transition-all",
                  taskType === 'one_time'
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/50"
                )}
              >
                📌 Разовая
              </button>
            </div>
          </div>

          {/* Icon Selection */}
          <div className="space-y-2">
            <Label>Иконка</Label>
            <div className="grid grid-cols-8 gap-2">
              {taskIcons.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setSelectedIcon(icon)}
                  className={cn(
                    "w-10 h-10 rounded-xl text-2xl flex items-center justify-center transition-all",
                    selectedIcon === icon
                      ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 scale-110"
                      : "bg-muted hover:bg-muted/80"
                  )}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="task-title">Название задачи *</Label>
            <Input
              id="task-title"
              placeholder="Например: Заправить кровать"
              className="rounded-xl"
              {...form.register('titleRu')}
            />
            {form.formState.errors.titleRu && (
              <p className="text-sm text-destructive">{form.formState.errors.titleRu.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="task-description">Описание</Label>
            <Textarea
              id="task-description"
              placeholder="Подробности задания..."
              className="rounded-xl resize-none"
              rows={2}
              {...form.register('descriptionRu')}
            />
          </div>

          {/* Child Selection */}
          <div className="space-y-2">
            <Label>Для кого</Label>
            <Select
              value={form.watch('childId') || 'all'}
              onValueChange={(value) => form.setValue('childId', value === 'all' ? '' : value)}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Выберите ребёнка" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">👨‍👩‍👧 Для всех детей</SelectItem>
                {children.map((child) => (
                  <SelectItem key={child.id} value={child.id}>
                    {child.avatar_url || '🦁'} {child.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Time & Reward */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="task-time" className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Время
                </Label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Указать</span>
                  <Switch
                    checked={hasTime}
                    onCheckedChange={setHasTime}
                  />
                </div>
              </div>
              {hasTime ? (
                <Input
                  id="task-time"
                  type="time"
                  className="rounded-xl"
                  {...form.register('recurringTime')}
                />
              ) : (
                <p className="text-sm text-muted-foreground py-2">Без привязки ко времени</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-reward">Награда 🪙</Label>
              <Input
                id="task-reward"
                type="number"
                min={1}
                max={1000}
                className="rounded-xl"
                {...form.register('rewardAmount', { valueAsNumber: true })}
              />
              {form.formState.errors.rewardAmount && (
                <p className="text-sm text-destructive">{form.formState.errors.rewardAmount.message}</p>
              )}
            </div>
          </div>

          {/* Days of Week (for recurring) */}
          {taskType === 'recurring' && (
            <div className="space-y-2">
              <Label>Дни недели</Label>
              <div className="flex gap-2">
                {weekDays.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDay(day.value)}
                    className={cn(
                      "flex-1 py-2 rounded-xl text-sm font-medium transition-all",
                      selectedDays.includes(day.value)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    {language === 'ru' ? day.labelRu : day.labelEn}
                  </button>
                ))}
              </div>
              {selectedDays.length === 0 && (
                <p className="text-sm text-destructive">Выберите хотя бы один день</p>
              )}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={() => setOpen(false)}
            >
              Отмена
            </Button>
            <Button
              type="submit"
              className="flex-1 rounded-xl"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Создать
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
