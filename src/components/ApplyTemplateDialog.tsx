import { useState } from 'react';
import { format, addDays } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { Calendar, Users, Replace, Plus, Loader2, Check } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useChildren } from '@/hooks/useChildren';
import { useDayTemplates, PRESET_TEMPLATES, DayTemplateWithTasks } from '@/hooks/useDayTemplates';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ChildAvatar } from '@/components/ui/ChildAvatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from '@/components/ui/drawer';

interface ApplyTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: DayTemplateWithTasks;
  presetKey?: string;
}

export const ApplyTemplateDialog = ({
  open,
  onOpenChange,
  template,
  presetKey,
}: ApplyTemplateDialogProps) => {
  const { language } = useLanguage();
  const { children } = useChildren();
  const { applyTemplate } = useDayTemplates();
  const isMobile = useIsMobile();
  
  const [selectedChildren, setSelectedChildren] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<'today' | 'tomorrow' | 'custom'>('tomorrow');
  const [applyMode, setApplyMode] = useState<'replace' | 'add'>('replace');
  const [isApplying, setIsApplying] = useState(false);

  // Get template name for display
  const getTemplateName = () => {
    if (template) {
      return language === 'ru' ? template.name_ru : template.name_en;
    }
    if (presetKey) {
      const preset = PRESET_TEMPLATES.find(p => p.preset_key === presetKey);
      return preset ? (language === 'ru' ? preset.name_ru : preset.name_en) : '';
    }
    return '';
  };

  // Get target date
  const getTargetDate = () => {
    const today = new Date();
    if (selectedDate === 'today') return today;
    return addDays(today, 1); // tomorrow
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

  const handleApply = async () => {
    if (selectedChildren.length === 0) {
      toast.error(language === 'ru' ? 'Выберите хотя бы одного ребёнка' : 'Select at least one child');
      return;
    }

    setIsApplying(true);
    try {
      await applyTemplate.mutateAsync({
        templateId: template?.id,
        presetKey: template ? undefined : presetKey,
        childIds: selectedChildren,
        date: getTargetDate(),
        mode: applyMode,
      });

      toast.success(
        language === 'ru'
          ? `Шаблон "${getTemplateName()}" применён!`
          : `Template "${getTemplateName()}" applied!`
      );
      onOpenChange(false);
      setSelectedChildren([]);
    } catch (error) {
      toast.error(language === 'ru' ? 'Ошибка применения шаблона' : 'Error applying template');
    } finally {
      setIsApplying(false);
    }
  };

  const mainContent = (
    <div className="space-y-5 py-4 px-1">
      {/* Template name */}
      <div className="bg-primary/5 rounded-xl p-3 text-center">
        <p className="font-semibold text-base sm:text-lg">{getTemplateName()}</p>
      </div>

      {/* Select children */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2 text-sm sm:text-base">
            <Users className="w-4 h-4" />
            {language === 'ru' ? 'Для кого' : 'For whom'}
          </Label>
          <Button variant="ghost" size="sm" onClick={handleSelectAll} className="text-xs sm:text-sm">
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
              <span className="font-medium">{child.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Select date */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2 text-sm sm:text-base">
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
            <span className="text-sm sm:text-base">{language === 'ru' ? 'Сегодня' : 'Today'}</span>
          </label>
          <label
            className={`flex items-center justify-center gap-2 p-3 min-h-[48px] rounded-xl border cursor-pointer transition-colors ${
              selectedDate === 'tomorrow'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <RadioGroupItem value="tomorrow" />
            <span className="text-sm sm:text-base">{language === 'ru' ? 'Завтра' : 'Tomorrow'}</span>
          </label>
        </RadioGroup>
        <p className="text-xs sm:text-sm text-muted-foreground text-center">
          {formatDate(getTargetDate())}
        </p>
      </div>

      {/* Apply mode */}
      <div className="space-y-3">
        <Label className="text-sm sm:text-base">{language === 'ru' ? 'Режим применения' : 'Apply mode'}</Label>
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
                <span className="font-medium text-sm sm:text-base">
                  {language === 'ru' ? 'Заменить план' : 'Replace plan'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                {language === 'ru'
                  ? 'Удалит незавершённые задачи на этот день'
                  : 'Start fresh with this template'}
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
                <span className="font-medium text-sm sm:text-base">
                  {language === 'ru' ? 'Добавить к плану' : 'Add to plan'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                {language === 'ru'
                  ? 'Сохранит существующие и добавит новые'
                  : 'Keep current tasks and add these'}
              </p>
            </div>
          </label>
        </RadioGroup>
      </div>
    </div>
  );

  const footer = (
    <div className="flex flex-col sm:flex-row gap-2 w-full pb-safe">
      <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto sm:flex-1">
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
  );

  // Use Drawer on mobile, Dialog on desktop
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="px-4">
            <DrawerTitle>
              {language === 'ru' ? 'Применить шаблон' : 'Apply Template'}
            </DrawerTitle>
          </DrawerHeader>
          <ScrollArea className="flex-1 px-4 overflow-y-auto">
            {mainContent}
          </ScrollArea>
          <DrawerFooter className="px-4">
            {footer}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {language === 'ru' ? 'Применить шаблон' : 'Apply Template'}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 overflow-y-auto pr-2">
          {mainContent}
        </ScrollArea>
        <DialogFooter className="flex-col sm:flex-row gap-2 pt-4">
          {footer}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
