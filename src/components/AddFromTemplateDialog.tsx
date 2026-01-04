import { useState } from 'react';
import { format, addDays } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { 
  Calendar, 
  Users, 
  Replace, 
  Plus, 
  Loader2, 
  Check, 
  ChevronRight, 
  ArrowLeft,
  Clock,
  Copy,
  Edit,
  FileText
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useChildren } from '@/hooks/useChildren';
import { useDayTemplates, DayTemplateWithTasks, PRESET_TEMPLATES } from '@/hooks/useDayTemplates';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChildAvatar } from '@/components/ui/ChildAvatar';
import { CoinBadge } from '@/components/ui/CoinBadge';
import { PaywallDialog } from './PaywallDialog';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerTrigger,
} from '@/components/ui/drawer';

interface AddFromTemplateDialogProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

type Step = 'select' | 'configure';
type ScheduleType = 'one_time' | 'recurring';

export const AddFromTemplateDialog = ({ trigger, open: controlledOpen, onOpenChange }: AddFromTemplateDialogProps) => {
  const { language } = useLanguage();
  const { children } = useChildren();
  const { templates: userTemplates, applyTemplate, applyRecurringTemplate } = useDayTemplates();
  const isMobile = useIsMobile();
  
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  const [step, setStep] = useState<Step>('select');
  const [selectedTemplate, setSelectedTemplate] = useState<{ type: 'preset' | 'user'; key?: string; template?: DayTemplateWithTasks } | null>(null);
  const [selectedChildren, setSelectedChildren] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<'today' | 'tomorrow'>('today');
  const [applyMode, setApplyMode] = useState<'replace' | 'add'>('replace');
  const [scheduleType, setScheduleType] = useState<ScheduleType>('one_time');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]); // Mon-Fri by default
  const [isApplying, setIsApplying] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  const weekDays = language === 'ru' 
    ? ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const resetState = () => {
    setStep('select');
    setSelectedTemplate(null);
    setSelectedChildren([]);
    setSelectedDate('today');
    setApplyMode('replace');
    setScheduleType('one_time');
    setSelectedDays([1, 2, 3, 4, 5]);
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      resetState();
    }
  };

  const getSelectedPreset = () => {
    if (selectedTemplate?.type === 'preset' && selectedTemplate?.key) {
      return PRESET_TEMPLATES.find(p => p.preset_key === selectedTemplate.key);
    }
    return null;
  };

  const getTemplateName = () => {
    const preset = getSelectedPreset();
    if (preset) {
      return language === 'ru' ? preset.name_ru : preset.name_en;
    }
    if (selectedTemplate?.template) {
      return language === 'ru' ? selectedTemplate.template.name_ru : selectedTemplate.template.name_en;
    }
    return '';
  };

  const getTemplateTasks = () => {
    const preset = getSelectedPreset();
    if (preset) {
      return preset.tasks;
    }
    if (selectedTemplate?.template) {
      return selectedTemplate.template.tasks.map(t => ({
        title_ru: t.title_ru,
        title_en: t.title_en,
        icon: t.icon || '✨',
        time: t.time || undefined,
        reward_amount: t.reward_amount,
        duration_minutes: undefined as number | undefined,
      }));
    }
    return [];
  };

  const getDefaultApplyMode = () => {
    const preset = getSelectedPreset();
    return preset?.default_mode || 'replace';
  };

  const getTargetDate = () => {
    const today = new Date();
    if (selectedDate === 'today') return today;
    return addDays(today, 1);
  };

  const formatDate = (date: Date) => {
    const locale = language === 'ru' ? ru : enUS;
    return format(date, language === 'ru' ? 'd MMMM, EEEE' : 'MMMM d, EEEE', { locale });
  };

  const handleChildToggle = (childId: string) => {
    setSelectedChildren(prev =>
      prev.includes(childId)
        ? prev.filter(id => id !== childId)
        : [...prev, childId]
    );
  };

  const handleSelectAll = () => {
    if (selectedChildren.length === children.length) {
      setSelectedChildren([]);
    } else {
      setSelectedChildren(children.map(c => c.id));
    }
  };

  const toggleDay = (dayIndex: number) => {
    const day = dayIndex === 6 ? 0 : dayIndex + 1;
    setSelectedDays(prev =>
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day].sort((a, b) => a - b)
    );
  };

  const isDaySelected = (dayIndex: number) => {
    const day = dayIndex === 6 ? 0 : dayIndex + 1;
    return selectedDays.includes(day);
  };

  const handleSelectTemplate = (type: 'preset' | 'user', key?: string, template?: DayTemplateWithTasks) => {
    setSelectedTemplate({ type, key, template });
    // Set default apply mode based on template
    if (type === 'preset' && key) {
      const preset = PRESET_TEMPLATES.find(p => p.preset_key === key);
      if (preset) {
        setApplyMode(preset.default_mode);
      }
    }
    setStep('configure');
  };

  const handleEditOrDuplicate = () => {
    setShowPaywall(true);
  };

  const handleApply = async () => {
    if (selectedChildren.length === 0) {
      toast.error(language === 'ru' ? 'Выберите хотя бы одного ребёнка' : 'Select at least one child');
      return;
    }

    if (scheduleType === 'recurring' && selectedDays.length === 0) {
      toast.error(language === 'ru' ? 'Выберите хотя бы один день недели' : 'Select at least one day of the week');
      return;
    }

    setIsApplying(true);
    try {
      const targetDate = getTargetDate();
      let tasksCreated = 0;

      if (scheduleType === 'one_time') {
        const result = await applyTemplate.mutateAsync({
          templateId: selectedTemplate?.template?.id,
          presetKey: selectedTemplate?.type === 'preset' ? selectedTemplate?.key : undefined,
          childIds: selectedChildren,
          date: targetDate,
          mode: applyMode,
        });
        tasksCreated = result.tasksCreated;
      } else {
        const result = await applyRecurringTemplate.mutateAsync({
          templateId: selectedTemplate?.template?.id,
          presetKey: selectedTemplate?.type === 'preset' ? selectedTemplate?.key : undefined,
          childIds: selectedChildren,
          startDate: targetDate,
          recurringDays: selectedDays,
          mode: applyMode,
        });
        tasksCreated = result.tasksCreated;
      }

      const childNames = selectedChildren
        .map(id => children.find(c => c.id === id)?.name)
        .filter(Boolean)
        .join(', ');

      const dateStr = formatDate(targetDate);
      const successMsg = language === 'ru'
        ? `Добавлено ${tasksCreated} задач на ${scheduleType === 'recurring' ? 'выбранные дни' : dateStr} для ${childNames}.`
        : `Added ${tasksCreated} tasks to ${scheduleType === 'recurring' ? 'selected days' : dateStr} for ${childNames}.`;

      toast.success(successMsg);
      handleOpenChange(false);
    } catch (error) {
      toast.error(language === 'ru' ? 'Ошибка применения плана' : 'Error applying plan');
    } finally {
      setIsApplying(false);
    }
  };

  const totalReward = getTemplateTasks().reduce((sum, t) => sum + t.reward_amount, 0);
  const [isTemplateExpanded, setIsTemplateExpanded] = useState(false);

  // Preset icons for display
  const presetIcons: Record<string, string> = {
    'school_day': '📚',
    'after_school_reset': '🏠',
    'weekend_clean_help': '🧹',
  };

  // Template selection step content
  const selectStepContent = (
    <div className="space-y-4 py-4 px-1">
      {/* Preset templates */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground uppercase tracking-wide">
          {language === 'ru' ? 'Готовые' : 'Presets'}
        </Label>
        {PRESET_TEMPLATES.map(preset => {
          const presetReward = preset.tasks.reduce((sum, t) => sum + t.reward_amount, 0);
          return (
            <button
              key={preset.preset_key}
              type="button"
              className="w-full flex items-center gap-3 p-4 min-h-[72px] rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors text-left"
              onClick={() => handleSelectTemplate('preset', preset.preset_key)}
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl flex-shrink-0">
                {presetIcons[preset.preset_key] || '📋'}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm sm:text-base">
                  {language === 'ru' ? preset.name_ru : preset.name_en}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {preset.tasks.length} {language === 'ru' ? 'задач' : 'tasks'} • +{presetReward} coins
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            </button>
          );
        })}
      </div>

      {/* User templates */}
      {userTemplates.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground uppercase tracking-wide">
            {language === 'ru' ? 'Мои планы' : 'My Plans'}
          </Label>
          {userTemplates.map(template => (
            <button
              key={template.id}
              type="button"
              className="w-full flex items-center gap-3 p-4 min-h-[72px] rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors text-left"
              onClick={() => handleSelectTemplate('user', undefined, template)}
            >
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-2xl flex-shrink-0">
                ✨
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate text-sm sm:text-base">
                  {language === 'ru' ? template.name_ru : template.name_en}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {template.tasks.length} {language === 'ru' ? 'задач' : 'tasks'}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            </button>
          ))}
        </div>
      )}

      {/* Edit/Duplicate hint */}
      <div className="flex items-center justify-center pt-2">
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground text-xs sm:text-sm"
          onClick={handleEditOrDuplicate}
        >
          <Copy className="w-4 h-4 mr-1" />
          {language === 'ru' ? 'Создать свой план' : 'Create custom plan'}
        </Button>
      </div>
    </div>
  );

  // Configure step content
  const configureStepContent = (
    <div className="space-y-5 py-4 px-1">
      {/* Template preview */}
      <div className="bg-primary/5 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3 gap-2">
          <h3 className="font-semibold text-sm sm:text-base truncate">{getTemplateName()}</h3>
          {selectedTemplate?.type === 'preset' && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs flex-shrink-0"
              onClick={handleEditOrDuplicate}
            >
              <Edit className="w-3 h-3 mr-1" />
              {language === 'ru' ? 'Изменить' : 'Edit'}
            </Button>
          )}
        </div>
        <div className={`space-y-1.5 ${isTemplateExpanded ? 'max-h-48' : 'max-h-28'} overflow-y-auto`}>
          {(isTemplateExpanded ? getTemplateTasks() : getTemplateTasks().slice(0, 4)).map((task, i) => (
            <div key={i} className="flex items-center gap-2 text-xs sm:text-sm">
              <span>{task.icon}</span>
              <span className="truncate flex-1">{language === 'ru' ? task.title_ru : task.title_en}</span>
              {task.reward_amount > 0 && (
                <CoinBadge amount={task.reward_amount} size="sm" />
              )}
            </div>
          ))}
        </div>
        {getTemplateTasks().length > 4 && (
          <button
            type="button"
            onClick={() => setIsTemplateExpanded(!isTemplateExpanded)}
            className="text-xs text-primary hover:text-primary/80 font-medium mt-2 transition-colors"
          >
            {isTemplateExpanded 
              ? (language === 'ru' ? 'Скрыть' : 'Hide')
              : `+${getTemplateTasks().length - 4} ${language === 'ru' ? 'ещё' : 'more'}...`
            }
          </button>
        )}
      </div>

      {/* Select children */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2 text-sm">
            <Users className="w-4 h-4" />
            {language === 'ru' ? 'Для кого' : 'For whom'}
          </Label>
          <Button variant="ghost" size="sm" onClick={handleSelectAll} className="text-xs">
            {selectedChildren.length === children.length
              ? (language === 'ru' ? 'Снять всё' : 'Deselect all')
              : (language === 'ru' ? 'Выбрать всех' : 'Select all')}
          </Button>
        </div>
        <div className="space-y-2">
          {children.map(child => (
            <label
              key={child.id}
              className={`flex items-center gap-3 p-3 min-h-[48px] rounded-xl border cursor-pointer transition-colors ${
                selectedChildren.includes(child.id)
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <Checkbox
                checked={selectedChildren.includes(child.id)}
                onCheckedChange={() => handleChildToggle(child.id)}
              />
              <ChildAvatar avatar={child.avatar_url || '🦁'} size="sm" />
              <span className="font-medium text-sm sm:text-base">{child.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Schedule type */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4" />
          {language === 'ru' ? 'Как применить' : 'How to apply'}
        </Label>
        <RadioGroup
          value={scheduleType}
          onValueChange={(v) => setScheduleType(v as ScheduleType)}
          className="grid grid-cols-2 gap-2"
        >
          <label
            className={`flex items-center justify-center gap-2 p-3 min-h-[48px] rounded-xl border cursor-pointer transition-colors ${
              scheduleType === 'one_time'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <RadioGroupItem value="one_time" />
            <span className="text-xs sm:text-sm">{language === 'ru' ? 'На один день' : 'One-time'}</span>
          </label>
          <label
            className={`flex items-center justify-center gap-2 p-3 min-h-[48px] rounded-xl border cursor-pointer transition-colors ${
              scheduleType === 'recurring'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <RadioGroupItem value="recurring" />
            <span className="text-xs sm:text-sm">{language === 'ru' ? 'Еженедельно' : 'Weekly'}</span>
          </label>
        </RadioGroup>
      </div>

      {/* Date selection for one-time */}
      {scheduleType === 'one_time' && (
        <div className="space-y-3">
          <Label className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4" />
            {language === 'ru' ? 'На какой день' : 'For which day'}
          </Label>
          <RadioGroup
            value={selectedDate}
            onValueChange={(v) => setSelectedDate(v as 'today' | 'tomorrow')}
            className="grid grid-cols-2 gap-2"
          >
            <label
              className={`flex items-center justify-center gap-2 p-3 min-h-[48px] rounded-xl border cursor-pointer transition-colors ${
                selectedDate === 'today'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <RadioGroupItem value="today" />
              <span className="text-sm">{language === 'ru' ? 'Сегодня' : 'Today'}</span>
            </label>
            <label
              className={`flex items-center justify-center gap-2 p-3 min-h-[48px] rounded-xl border cursor-pointer transition-colors ${
                selectedDate === 'tomorrow'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <RadioGroupItem value="tomorrow" />
              <span className="text-sm">{language === 'ru' ? 'Завтра' : 'Tomorrow'}</span>
            </label>
          </RadioGroup>
          <p className="text-xs text-muted-foreground text-center">
            {formatDate(getTargetDate())}
          </p>
        </div>
      )}

      {/* Days selection for recurring */}
      {scheduleType === 'recurring' && (
        <div className="space-y-3">
          <Label className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4" />
            {language === 'ru' ? 'Дни недели' : 'Days of week'}
          </Label>
          <div className="flex gap-1.5 justify-center flex-wrap">
            {weekDays.map((day, i) => (
              <button
                key={i}
                type="button"
                onClick={() => toggleDay(i)}
                className={`w-10 h-10 rounded-xl text-xs sm:text-sm font-medium transition-colors touch-manipulation ${
                  isDaySelected(i)
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                {day.substring(0, 2)}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center">
            {language === 'ru' ? `Начиная с ${formatDate(getTargetDate())}` : `Starting ${formatDate(getTargetDate())}`}
          </p>
        </div>
      )}

      {/* Apply mode - confirmation */}
      <div className="space-y-3">
        <Label className="text-sm">{language === 'ru' ? 'Режим применения' : 'Apply mode'}</Label>
        <RadioGroup
          value={applyMode}
          onValueChange={(v) => setApplyMode(v as 'replace' | 'add')}
          className="space-y-2"
        >
          <label
            className={`flex items-start gap-3 p-3 min-h-[64px] rounded-xl border cursor-pointer transition-colors ${
              applyMode === 'replace'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <RadioGroupItem value="replace" className="mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Replace className="w-4 h-4 text-warning flex-shrink-0" />
                <span className="font-medium text-sm">
                  {language === 'ru' ? 'Заменить план' : 'Replace plan for that day'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {language === 'ru' ? 'Начать с чистого листа' : 'Start fresh with this template'}
              </p>
            </div>
          </label>
          <label
            className={`flex items-start gap-3 p-3 min-h-[64px] rounded-xl border cursor-pointer transition-colors ${
              applyMode === 'add'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <RadioGroupItem value="add" className="mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Plus className="w-4 h-4 text-success flex-shrink-0" />
                <span className="font-medium text-sm">
                  {language === 'ru' ? 'Добавить к плану' : 'Add to existing tasks'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {language === 'ru' ? 'Сохранить текущие задачи' : 'Keep current tasks and add these'}
              </p>
            </div>
          </label>
        </RadioGroup>
      </div>
    </div>
  );

  const header = (
    <div className="flex items-center gap-2">
      {step === 'configure' && (
        <Button 
          variant="ghost" 
          size="icon" 
          className="w-8 h-8 -ml-2"
          onClick={() => setStep('select')}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
      )}
      <FileText className="w-5 h-5" />
      <span>
        {step === 'select'
          ? (language === 'ru' ? 'Выбрать план' : 'Select Plan')
          : (language === 'ru' ? 'Применить план' : 'Apply Plan')}
      </span>
    </div>
  );

  const footer = step === 'configure' ? (
    <div className="flex flex-col sm:flex-row gap-2 w-full pb-safe">
      <Button variant="outline" onClick={() => handleOpenChange(false)} className="w-full sm:w-auto sm:flex-1">
        {language === 'ru' ? 'Отмена' : 'Cancel'}
      </Button>
      <Button
        onClick={handleApply}
        disabled={isApplying || selectedChildren.length === 0}
        className="w-full sm:w-auto sm:flex-1"
      >
        {isApplying ? (
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
        ) : (
          <Check className="w-4 h-4 mr-2" />
        )}
        {language === 'ru' ? 'Применить' : 'Apply'}
      </Button>
    </div>
  ) : null;

  // Use Drawer on mobile, Dialog on desktop
  if (isMobile) {
    return (
      <>
        <Drawer open={open} onOpenChange={handleOpenChange}>
          {trigger && <DrawerTrigger asChild>{trigger}</DrawerTrigger>}
          <DrawerContent className="max-h-[90vh]">
            <DrawerHeader className="px-4">
              <DrawerTitle>{header}</DrawerTitle>
            </DrawerHeader>
            <ScrollArea className="flex-1 px-4 overflow-y-auto">
              {step === 'select' ? selectStepContent : configureStepContent}
            </ScrollArea>
            {footer && (
              <DrawerFooter className="px-4">
                {footer}
              </DrawerFooter>
            )}
          </DrawerContent>
        </Drawer>

        <PaywallDialog open={showPaywall} onOpenChange={setShowPaywall} />
      </>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
        <DialogContent className="max-w-md max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{header}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 overflow-y-auto pr-2">
            {step === 'select' ? selectStepContent : configureStepContent}
          </ScrollArea>
          {footer && (
            <DialogFooter className="flex-col sm:flex-row gap-2 pt-4">
              {footer}
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      <PaywallDialog open={showPaywall} onOpenChange={setShowPaywall} />
    </>
  );
};
