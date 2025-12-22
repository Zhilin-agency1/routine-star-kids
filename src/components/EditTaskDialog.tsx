import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Loader2, ClipboardList, Clock, Calendar, RotateCcw, CalendarIcon, Edit, Plus, X, ListChecks, Gift, EyeOff, Eye } from 'lucide-react';
import { SortableStepList, type SortableStep } from './SortableStepList';
import { useTasks } from '@/hooks/useTasks';
import { useChildren } from '@/hooks/useChildren';
import { useTaskSteps } from '@/hooks/useTaskSteps';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Database } from '@/integrations/supabase/types';

type TaskTemplate = Database['public']['Tables']['task_templates']['Row'];

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
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  childId: z.string().optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface EditTaskDialogProps {
  template: TaskTemplate;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
}

export const EditTaskDialog = ({ template, trigger, open: controlledOpen, onOpenChange, onSuccess }: EditTaskDialogProps) => {
  const { language } = useLanguage();
  const [internalOpen, setInternalOpen] = useState(false);
  
  // Support both controlled and uncontrolled mode
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = (value: boolean) => {
    if (isControlled) {
      onOpenChange?.(value);
    } else {
      setInternalOpen(value);
    }
  };
  const [selectedIcon, setSelectedIcon] = useState(template.icon || taskIcons[0]);
  const [selectedDays, setSelectedDays] = useState<number[]>(template.recurring_days || [1, 2, 3, 4, 5]);
  const [taskType, setTaskType] = useState<'recurring' | 'one_time'>(template.task_type as 'recurring' | 'one_time');
  const [taskCategory, setTaskCategory] = useState<'routine' | 'activity'>(template.task_category as 'routine' | 'activity');
  const [hasTime, setHasTime] = useState(!!template.recurring_time);
  const [hasEndTime, setHasEndTime] = useState(!!template.end_time);
  const [startDate, setStartDate] = useState<Date>(template.start_date ? new Date(template.start_date) : new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(template.end_date ? new Date(template.end_date) : undefined);
  const [oneTimeDate, setOneTimeDate] = useState<Date>(template.one_time_date ? new Date(template.one_time_date) : new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Steps state
  const [localSteps, setLocalSteps] = useState<Array<{ 
    id?: string; 
    title_ru: string; 
    title_en: string;
    due_date?: string | null;
    bonus_amount: number;
    bonus_hidden: boolean;
  }>>([]);
  const [newStepTitle, setNewStepTitle] = useState('');
  const [newStepDueDate, setNewStepDueDate] = useState<Date | undefined>(undefined);
  const [newStepBonus, setNewStepBonus] = useState(0);
  const [newStepBonusHidden, setNewStepBonusHidden] = useState(false);
  const [stepsInitialized, setStepsInitialized] = useState(false);
  
  const { updateTemplate } = useTasks();
  const { children } = useChildren();
  const { steps: existingSteps, isLoading: stepsLoading, createSteps, deleteAllSteps } = useTaskSteps(template.id);

  const locale = language === 'ru' ? ru : undefined;

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      titleRu: template.title_ru,
      titleEn: template.title_en || '',
      descriptionRu: template.description_ru || '',
      descriptionEn: template.description_en || '',
      rewardAmount: template.reward_amount,
      startTime: template.recurring_time?.slice(0, 5) || '',
      endTime: template.end_time?.slice(0, 5) || '',
      childId: template.child_id || '',
    },
  });

  // Reset form when template changes
  useEffect(() => {
    form.reset({
      titleRu: template.title_ru,
      titleEn: template.title_en || '',
      descriptionRu: template.description_ru || '',
      descriptionEn: template.description_en || '',
      rewardAmount: template.reward_amount,
      startTime: template.recurring_time?.slice(0, 5) || '',
      endTime: template.end_time?.slice(0, 5) || '',
      childId: template.child_id || '',
    });
    setSelectedIcon(template.icon || taskIcons[0]);
    setSelectedDays(template.recurring_days || [1, 2, 3, 4, 5]);
    setTaskType(template.task_type as 'recurring' | 'one_time');
    setTaskCategory(template.task_category as 'routine' | 'activity');
    setHasTime(!!template.recurring_time);
    setHasEndTime(!!template.end_time);
    setStartDate(template.start_date ? new Date(template.start_date) : new Date());
    setEndDate(template.end_date ? new Date(template.end_date) : undefined);
    setOneTimeDate(template.one_time_date ? new Date(template.one_time_date) : new Date());
    setStepsInitialized(false);
  }, [template, form]);

  // Load existing steps when dialog opens
  useEffect(() => {
    if (open && !stepsLoading && !stepsInitialized && existingSteps) {
      setLocalSteps(existingSteps.map(s => ({
        id: s.id,
        title_ru: s.title_ru,
        title_en: s.title_en,
        due_date: s.due_date,
        bonus_amount: s.bonus_amount,
        bonus_hidden: s.bonus_hidden,
      })));
      setStepsInitialized(true);
    }
  }, [open, stepsLoading, stepsInitialized, existingSteps]);

  const addStep = () => {
    if (newStepTitle.trim()) {
      setLocalSteps([...localSteps, { 
        title_ru: newStepTitle.trim(), 
        title_en: newStepTitle.trim(),
        due_date: newStepDueDate ? format(newStepDueDate, 'yyyy-MM-dd') : null,
        bonus_amount: newStepBonus,
        bonus_hidden: newStepBonusHidden,
      }]);
      setNewStepTitle('');
      setNewStepDueDate(undefined);
      setNewStepBonus(0);
      setNewStepBonusHidden(false);
    }
  };

  const removeStep = (index: number) => {
    setLocalSteps(localSteps.filter((_, i) => i !== index));
  };

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

    if (hasTime && hasEndTime && data.startTime && data.endTime) {
      if (data.endTime <= data.startTime) {
        toast.error(language === 'ru' ? 'Время окончания должно быть после времени начала' : 'End time must be after start time');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await updateTemplate.mutateAsync({
        id: template.id,
        title_ru: data.titleRu,
        title_en: data.titleEn || data.titleRu,
        description_ru: data.descriptionRu || null,
        description_en: data.descriptionEn || data.descriptionRu || null,
        icon: selectedIcon,
        reward_amount: data.rewardAmount,
        task_type: taskType,
        task_category: taskCategory,
        recurring_days: taskType === 'recurring' ? selectedDays : null,
        recurring_time: hasTime && data.startTime ? data.startTime : null,
        end_time: hasTime && hasEndTime && data.endTime ? data.endTime : null,
        child_id: data.childId || null,
        start_date: format(startDate, 'yyyy-MM-dd'),
        end_date: endDate ? format(endDate, 'yyyy-MM-dd') : null,
        one_time_date: taskType === 'one_time' ? format(oneTimeDate, 'yyyy-MM-dd') : null,
      });

      // Update steps: delete all and recreate
      await deleteAllSteps.mutateAsync(template.id);
      if (localSteps.length > 0) {
        await createSteps.mutateAsync(
          localSteps.map((s, index) => ({
            template_id: template.id,
            title_ru: s.title_ru,
            title_en: s.title_en,
            order_index: index,
            due_date: s.due_date || null,
            bonus_amount: s.bonus_amount,
            bonus_hidden: s.bonus_hidden,
          }))
        );
      }
      
      toast.success(language === 'ru' ? 'Задача обновлена!' : 'Task updated!');
      setOpen(false);
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || (language === 'ru' ? 'Ошибка при обновлении' : 'Failed to update'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          {trigger || (
            <Button size="sm" variant="ghost" className="rounded-xl">
              <Edit className="w-4 h-4 mr-1" />
              {language === 'ru' ? 'Редактировать' : 'Edit'}
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5" />
            {language === 'ru' ? 'Редактировать задачу' : 'Edit Task'}
          </DialogTitle>
          <DialogDescription>
            {language === 'ru' ? 'Измените настройки задачи' : 'Modify task settings'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
          {/* Task Category */}
          <div className="space-y-2">
            <Label>{language === 'ru' ? 'Категория' : 'Category'}</Label>
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
                {language === 'ru' ? 'Рутина' : 'Routine'}
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
                {language === 'ru' ? 'Занятие' : 'Activity'}
              </button>
            </div>
          </div>

          {/* Task Type */}
          <div className="space-y-2">
            <Label>{language === 'ru' ? 'Повторение' : 'Recurrence'}</Label>
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
                🔄 {language === 'ru' ? 'Повторяющаяся' : 'Recurring'}
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
                📌 {language === 'ru' ? 'Разовая' : 'One-time'}
              </button>
            </div>
          </div>

          {/* Icon Selection */}
          <div className="space-y-2">
            <Label>{language === 'ru' ? 'Иконка' : 'Icon'}</Label>
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
            <Label htmlFor="edit-task-title">{language === 'ru' ? 'Название задачи *' : 'Task Title *'}</Label>
            <Input
              id="edit-task-title"
              placeholder={language === 'ru' ? 'Например: Заправить кровать' : 'E.g., Make bed'}
              className="rounded-xl"
              {...form.register('titleRu')}
            />
            {form.formState.errors.titleRu && (
              <p className="text-sm text-destructive">{form.formState.errors.titleRu.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="edit-task-description">{language === 'ru' ? 'Описание' : 'Description'}</Label>
            <Textarea
              id="edit-task-description"
              placeholder={language === 'ru' ? 'Подробности задания...' : 'Task details...'}
              className="rounded-xl resize-none"
              rows={2}
              {...form.register('descriptionRu')}
            />
          </div>

          {/* Child Selection */}
          <div className="space-y-2">
            <Label>{language === 'ru' ? 'Для кого' : 'For whom'}</Label>
            <Select
              value={form.watch('childId') || 'all'}
              onValueChange={(value) => form.setValue('childId', value === 'all' ? '' : value)}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder={language === 'ru' ? 'Выберите ребёнка' : 'Select child'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{language === 'ru' ? '👨‍👩‍👧 Для всех детей' : '👨‍👩‍👧 For all children'}</SelectItem>
                {children.map((child) => (
                  <SelectItem key={child.id} value={child.id}>
                    {child.avatar_url || '🦁'} {child.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Days Selection for Recurring */}
          {taskType === 'recurring' && (
            <div className="space-y-2">
              <Label>{language === 'ru' ? 'Дни недели' : 'Days of week'}</Label>
              <div className="flex gap-1 flex-wrap">
                {weekDays.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDay(day.value)}
                    className={cn(
                      "w-10 h-10 rounded-full text-sm font-medium transition-all",
                      selectedDays.includes(day.value)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted hover:bg-muted/80"
                    )}
                  >
                    {language === 'ru' ? day.labelRu : day.labelEn}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Date Range */}
          {taskType === 'recurring' ? (
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                {language === 'ru' ? 'Период действия' : 'Valid period'}
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">{language === 'ru' ? 'Дата начала' : 'Start date'}</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal rounded-xl",
                          !startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, 'dd.MM.yyyy', { locale }) : (language === 'ru' ? 'Выберите дату' : 'Select date')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={startDate}
                        onSelect={(date) => date && setStartDate(date)}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">{language === 'ru' ? 'Дата окончания' : 'End date'}</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal rounded-xl",
                          !endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, 'dd.MM.yyyy', { locale }) : (language === 'ru' ? 'Бессрочно' : 'Indefinite')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        disabled={(date) => date < startDate}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                {language === 'ru' ? 'Дата выполнения' : 'Due date'}
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal rounded-xl",
                      !oneTimeDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {oneTimeDate ? format(oneTimeDate, 'dd MMMM yyyy', { locale }) : (language === 'ru' ? 'Выберите дату' : 'Select date')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={oneTimeDate}
                    onSelect={(date) => date && setOneTimeDate(date)}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* Time */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {language === 'ru' ? 'Время' : 'Time'}
              </Label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{language === 'ru' ? 'Указать время' : 'Set time'}</span>
                <Switch
                  checked={hasTime}
                  onCheckedChange={setHasTime}
                />
              </div>
            </div>
            
            {hasTime && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">{language === 'ru' ? 'Время начала' : 'Start time'}</span>
                    <Input
                      type="time"
                      className="rounded-xl"
                      {...form.register('startTime')}
                    />
                  </div>
                  
                  {hasEndTime && (
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">{language === 'ru' ? 'Время окончания' : 'End time'}</span>
                      <Input
                        type="time"
                        className="rounded-xl"
                        {...form.register('endTime')}
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    id="edit-end-time-toggle"
                    checked={hasEndTime}
                    onCheckedChange={setHasEndTime}
                  />
                  <Label htmlFor="edit-end-time-toggle" className="text-sm text-muted-foreground">
                    {language === 'ru' ? 'Указать время окончания' : 'Set end time'}
                  </Label>
                </div>
              </div>
            )}
          </div>

          {/* Reward */}
          <div className="space-y-2">
            <Label htmlFor="edit-reward">{language === 'ru' ? 'Награда' : 'Reward'} 🪙</Label>
            <Input
              id="edit-reward"
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

          {/* Steps / Checklist */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <ListChecks className="w-4 h-4" />
              {language === 'ru' ? 'Шаги (чек-лист)' : 'Steps (checklist)'}
            </Label>
            
            <SortableStepList
              steps={localSteps}
              onReorder={setLocalSteps}
              onRemove={removeStep}
            />

            {/* Add new step */}
            <div className="space-y-2 border rounded-xl p-3 bg-muted/30">
              <Input
                placeholder={language === 'ru' ? 'Название шага...' : 'Step title...'}
                value={newStepTitle}
                onChange={(e) => setNewStepTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addStep();
                  }
                }}
                className="rounded-xl"
              />
              
              {/* Step options row */}
              <div className="grid grid-cols-3 gap-2">
                {/* Due date */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className={cn(
                        "w-full justify-start text-left font-normal rounded-lg text-xs h-8",
                        !newStepDueDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-1 h-3 w-3" />
                      {newStepDueDate ? format(newStepDueDate, 'dd.MM', { locale }) : (language === 'ru' ? 'Срок' : 'Due')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={newStepDueDate}
                      onSelect={setNewStepDueDate}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                
                {/* Bonus amount */}
                <div className="relative">
                  <Gift className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={newStepBonus || ''}
                    onChange={(e) => setNewStepBonus(parseInt(e.target.value) || 0)}
                    placeholder="0"
                    className="rounded-lg h-8 text-xs pl-6 pr-2"
                  />
                </div>
                
                {/* Hidden bonus toggle */}
                <Button
                  type="button"
                  variant={newStepBonusHidden ? "secondary" : "outline"}
                  size="sm"
                  className="h-8 text-xs rounded-lg"
                  onClick={() => setNewStepBonusHidden(!newStepBonusHidden)}
                  disabled={newStepBonus === 0}
                >
                  {newStepBonusHidden ? (
                    <>
                      <EyeOff className="w-3 h-3 mr-1" />
                      {language === 'ru' ? 'Скрыт' : 'Hidden'}
                    </>
                  ) : (
                    <>
                      <Eye className="w-3 h-3 mr-1" />
                      {language === 'ru' ? 'Виден' : 'Visible'}
                    </>
                  )}
                </Button>
              </div>
              
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full rounded-xl"
                onClick={addStep}
                disabled={!newStepTitle.trim()}
              >
                <Plus className="w-4 h-4 mr-1" />
                {language === 'ru' ? 'Добавить шаг' : 'Add step'}
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground">
              {language === 'ru' 
                ? 'Бонусы могут быть скрыты — ребенок увидит их только после завершения!'
                : 'Bonuses can be hidden — child will see them only after completion!'}
            </p>
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full rounded-xl" 
            size="lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {language === 'ru' ? 'Сохранение...' : 'Saving...'}
              </>
            ) : (
              language === 'ru' ? 'Сохранить изменения' : 'Save Changes'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
