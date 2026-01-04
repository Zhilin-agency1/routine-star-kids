import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Plus, Loader2, ClipboardList, Clock, Calendar, RotateCcw, CalendarIcon, X, ListChecks, Gift, EyeOff, Eye, GripVertical } from 'lucide-react';
import { SortableStepList, type SortableStep } from './SortableStepList';
import { useTasks } from '@/hooks/useTasks';
import { useTaskSteps } from '@/hooks/useTaskSteps';
import { useChildren } from '@/hooks/useChildren';
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

interface AddTaskDialogProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  initialCategory?: 'routine' | 'activity';
}

export const AddTaskDialog = ({ trigger, open: controlledOpen, onOpenChange, initialCategory }: AddTaskDialogProps) => {
  const { language } = useLanguage();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;
  
  const [selectedIcon, setSelectedIcon] = useState(taskIcons[0]);
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [taskType, setTaskType] = useState<'recurring' | 'one_time'>('recurring');
  const [taskCategory, setTaskCategory] = useState<'routine' | 'activity'>(initialCategory || 'routine');
  const [hasTime, setHasTime] = useState(true);
  const [hasEndTime, setHasEndTime] = useState(false);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [oneTimeDate, setOneTimeDate] = useState<Date>(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [steps, setSteps] = useState<{ 
    titleRu: string; 
    titleEn: string; 
    dueDate?: string;
    bonusAmount: number;
    bonusHidden: boolean;
    durationMinutes?: number;
  }[]>([]);
  const [newStepTitle, setNewStepTitle] = useState('');
  const [newStepDueDate, setNewStepDueDate] = useState<Date | undefined>(undefined);
  const [newStepBonus, setNewStepBonus] = useState(0);
  const [newStepBonusHidden, setNewStepBonusHidden] = useState(false);
  const [newStepDuration, setNewStepDuration] = useState<number | undefined>(undefined);
  
  const { createTemplate } = useTasks();
  const { createSteps } = useTaskSteps();
  const { children } = useChildren();

  const locale = language === 'ru' ? ru : undefined;

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      titleRu: '',
      titleEn: '',
      descriptionRu: '',
      descriptionEn: '',
      rewardAmount: 5,
      startTime: '',
      endTime: '',
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

  const addStep = () => {
    if (newStepTitle.trim()) {
      setSteps([...steps, { 
        titleRu: newStepTitle.trim(), 
        titleEn: newStepTitle.trim(),
        dueDate: newStepDueDate ? format(newStepDueDate, 'yyyy-MM-dd') : undefined,
        bonusAmount: newStepBonus,
        bonusHidden: newStepBonusHidden,
        durationMinutes: newStepDuration,
      }]);
      setNewStepTitle('');
      setNewStepDueDate(undefined);
      setNewStepBonus(0);
      setNewStepBonusHidden(false);
      setNewStepDuration(undefined);
    }
  };

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const handleSubmit = async (data: TaskFormData) => {
    if (taskType === 'recurring' && selectedDays.length === 0) {
      toast.error('Выберите хотя бы один день недели');
      return;
    }

    // Validate time interval
    if (hasTime && hasEndTime && data.startTime && data.endTime) {
      if (data.endTime <= data.startTime) {
        toast.error(language === 'ru' ? 'Время окончания должно быть после времени начала' : 'End time must be after start time');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const template = await createTemplate.mutateAsync({
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

      // Create steps if any
      if (steps.length > 0) {
        await createSteps.mutateAsync(
          steps.map((step, index) => ({
            template_id: template.id,
            title_ru: step.titleRu,
            title_en: step.titleEn,
            order_index: index,
            due_date: step.dueDate || null,
            bonus_amount: step.bonusAmount,
            bonus_hidden: step.bonusHidden,
            duration_minutes: step.durationMinutes || null,
          }))
        );
      }
      
      toast.success('Задача создана!');
      setOpen(false);
      form.reset();
      setSelectedIcon(taskIcons[0]);
      setSelectedDays([1, 2, 3, 4, 5]);
      setTaskCategory('routine');
      setHasTime(true);
      setHasEndTime(false);
      setStartDate(new Date());
      setEndDate(undefined);
      setOneTimeDate(new Date());
      setSteps([]);
      setNewStepTitle('');
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при создании задачи');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Effect to sync initialCategory when dialog opens
  useEffect(() => {
    if (open && initialCategory) {
      setTaskCategory(initialCategory);
    }
  }, [open, initialCategory]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && (
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
      )}
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

          {/* Date Range */}
          {taskType === 'recurring' ? (
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                Период действия
              </Label>
              <div className="grid grid-cols-2 gap-3">
                {/* Start Date */}
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Дата начала</span>
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
                        {startDate ? format(startDate, 'dd.MM.yyyy', { locale }) : 'Выберите дату'}
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

                {/* End Date */}
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Дата окончания</span>
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
                        {endDate ? format(endDate, 'dd.MM.yyyy', { locale }) : 'Бессрочно'}
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
                Дата выполнения
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
                    {oneTimeDate ? format(oneTimeDate, 'dd MMMM yyyy', { locale }) : 'Выберите дату'}
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

          {/* Time Interval */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Время
              </Label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Указать время</span>
                <Switch
                  checked={hasTime}
                  onCheckedChange={setHasTime}
                />
              </div>
            </div>
            
            {hasTime && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {/* Start Time */}
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">Начало</span>
                    <Input
                      type="time"
                      className="rounded-xl"
                      {...form.register('startTime')}
                    />
                  </div>
                  
                  {/* End Time */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Окончание</span>
                      <Switch
                        checked={hasEndTime}
                        onCheckedChange={setHasEndTime}
                        className="scale-75"
                      />
                    </div>
                    {hasEndTime ? (
                      <Input
                        type="time"
                        className="rounded-xl"
                        {...form.register('endTime')}
                      />
                    ) : (
                      <div className="h-10 flex items-center text-sm text-muted-foreground">
                        —
                      </div>
                    )}
                  </div>
                </div>
                
                {hasEndTime && form.watch('startTime') && form.watch('endTime') && (
                  <p className="text-xs text-muted-foreground">
                    ⏱️ Интервал: {form.watch('startTime')} — {form.watch('endTime')}
                  </p>
                )}
              </div>
            )}
            
            {!hasTime && (
              <p className="text-sm text-muted-foreground py-1">Без привязки ко времени</p>
            )}
          </div>

          {/* Reward */}
          <div className="space-y-2">
            <Label htmlFor="task-reward">Награда 💰</Label>
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

          {/* Steps / Checklist */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <ListChecks className="w-4 h-4" />
              {language === 'ru' ? 'Шаги (чек-лист)' : 'Steps (checklist)'}
            </Label>
            
            <SortableStepList
              steps={steps.map((s, i) => ({
                id: `add-step-${i}`,
                title_ru: s.titleRu,
                title_en: s.titleEn,
                due_date: s.dueDate,
                bonus_amount: s.bonusAmount,
                bonus_hidden: s.bonusHidden,
                duration_minutes: s.durationMinutes,
              }))}
              onReorder={(reordered) => setSteps(reordered.map(s => ({
                titleRu: s.title_ru,
                titleEn: s.title_en,
                dueDate: s.due_date || undefined,
                bonusAmount: s.bonus_amount,
                bonusHidden: s.bonus_hidden,
                durationMinutes: s.duration_minutes || undefined,
              })))}
              onRemove={removeStep}
            />
            
            {/* New step input */}
            <div className="space-y-2 border rounded-xl p-3 bg-muted/30">
              <div className="flex gap-2">
                <Input
                  placeholder={language === 'ru' ? 'Название шага...' : 'Step title...'}
                  value={newStepTitle}
                  onChange={(e) => setNewStepTitle(e.target.value)}
                  className="rounded-xl flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addStep();
                    }
                  }}
                />
              </div>
              
              {/* Step options row */}
              <div className="grid grid-cols-4 gap-2">
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
                
                {/* Duration minutes */}
                <div className="relative">
                  <Clock className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                  <Input
                    type="number"
                    min={0}
                    max={180}
                    value={newStepDuration || ''}
                    onChange={(e) => setNewStepDuration(parseInt(e.target.value) || undefined)}
                    placeholder={language === 'ru' ? 'мин' : 'min'}
                    className="rounded-lg h-8 text-xs pl-6 pr-2"
                  />
                </div>
                
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
                ? 'Шаги помогают разбить задачу на части. Бонусы могут быть скрыты до завершения!'
                : 'Steps help break down tasks. Bonuses can be hidden until completion!'}
            </p>
          </div>

          {/* Days of Week (for recurring) */}
          {taskType === 'recurring' && (
            <div className="space-y-2">
              <Label>{language === 'ru' ? 'Дни недели' : 'Days of week'}</Label>
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
                <p className="text-sm text-destructive">{language === 'ru' ? 'Выберите хотя бы один день' : 'Select at least one day'}</p>
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
