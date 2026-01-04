import { useState, useEffect } from 'react';
import { Plus, Trash2, GripVertical, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDayTemplates, DayTemplateWithTasks } from '@/hooks/useDayTemplates';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

interface TaskItem {
  id: string;
  title_ru: string;
  title_en: string;
  icon: string;
  time: string;
  reward_amount: number;
}

interface EditDayTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: DayTemplateWithTasks;
}

const EMOJI_OPTIONS = ['✨', '📚', '🧹', '🛏️', '🪥', '🍽️', '👕', '🎒', '⏰', '💪', '🎨', '⚽', '🧸', '📖', '✏️', '🔢', '👨‍🍳', '🧱', '✂️', '😴'];

export const EditDayTemplateDialog = ({
  open,
  onOpenChange,
  template,
}: EditDayTemplateDialogProps) => {
  const { language } = useLanguage();
  const { createTemplate, updateTemplate } = useDayTemplates();
  const isMobile = useIsMobile();
  
  const [nameRu, setNameRu] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const isEditing = !!template;

  useEffect(() => {
    if (template) {
      setNameRu(template.name_ru);
      setNameEn(template.name_en);
      setTasks(
        template.tasks.map((t, idx) => ({
          id: `task-${idx}`,
          title_ru: t.title_ru,
          title_en: t.title_en,
          icon: t.icon || '✨',
          time: t.time || '',
          reward_amount: t.reward_amount,
        }))
      );
    } else {
      setNameRu('');
      setNameEn('');
      setTasks([]);
    }
  }, [template, open]);

  const handleAddTask = () => {
    setTasks([
      ...tasks,
      {
        id: `task-${Date.now()}`,
        title_ru: '',
        title_en: '',
        icon: '✨',
        time: '',
        reward_amount: 5,
      },
    ]);
  };

  const handleRemoveTask = (taskId: string) => {
    setTasks(tasks.filter(t => t.id !== taskId));
  };

  const handleTaskChange = (taskId: string, field: keyof TaskItem, value: string | number) => {
    setTasks(
      tasks.map(t =>
        t.id === taskId ? { ...t, [field]: value } : t
      )
    );
  };

  const handleSave = async () => {
    if (!nameRu.trim() || !nameEn.trim()) {
      toast.error(language === 'ru' ? 'Введите название шаблона' : 'Enter template name');
      return;
    }

    const validTasks = tasks.filter(t => t.title_ru.trim() && t.title_en.trim());
    if (validTasks.length === 0) {
      toast.error(language === 'ru' ? 'Добавьте хотя бы одну задачу' : 'Add at least one task');
      return;
    }

    setIsSaving(true);
    try {
      const taskData = validTasks.map(t => ({
        title_ru: t.title_ru.trim(),
        title_en: t.title_en.trim(),
        icon: t.icon,
        time: t.time || undefined,
        reward_amount: t.reward_amount,
      }));

      if (isEditing && template) {
        await updateTemplate.mutateAsync({
          id: template.id,
          name_ru: nameRu.trim(),
          name_en: nameEn.trim(),
          tasks: taskData,
        });
        toast.success(language === 'ru' ? 'Шаблон обновлён!' : 'Template updated!');
      } else {
        await createTemplate.mutateAsync({
          name_ru: nameRu.trim(),
          name_en: nameEn.trim(),
          tasks: taskData,
        });
        toast.success(language === 'ru' ? 'Шаблон создан!' : 'Template created!');
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(language === 'ru' ? 'Ошибка сохранения' : 'Save error');
    } finally {
      setIsSaving(false);
    }
  };

  const mainContent = (
    <div className="flex-1 overflow-hidden flex flex-col gap-4 py-4 px-1">
      {/* Template name - stack on mobile */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-sm">{language === 'ru' ? 'Название (RU)' : 'Name (RU)'}</Label>
            <Input
              value={nameRu}
              onChange={(e) => setNameRu(e.target.value)}
              placeholder="Школьное утро"
              className="rounded-xl h-11"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm">{language === 'ru' ? 'Название (EN)' : 'Name (EN)'}</Label>
            <Input
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              placeholder="School Morning"
              className="rounded-xl h-11"
            />
          </div>
        </div>
      </div>

      {/* Tasks */}
      <div className="flex-1 min-h-0 space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm">{language === 'ru' ? 'Задачи' : 'Tasks'}</Label>
          <Button variant="ghost" size="sm" onClick={handleAddTask} className="h-9">
            <Plus className="w-4 h-4 mr-1" />
            {language === 'ru' ? 'Добавить' : 'Add'}
          </Button>
        </div>

        <ScrollArea className="h-[40vh] sm:h-64 border rounded-xl p-3">
          {tasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">{language === 'ru' ? 'Нет задач' : 'No tasks'}</p>
              <Button variant="link" onClick={handleAddTask} className="mt-2">
                {language === 'ru' ? 'Добавить первую задачу' : 'Add first task'}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task, index) => (
                <div
                  key={task.id}
                  className="bg-accent/30 rounded-xl p-3 space-y-2"
                >
                  {/* Task header with drag handle - touch-friendly */}
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 flex items-center justify-center touch-manipulation">
                      <GripVertical className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <span className="text-sm text-muted-foreground w-6">
                      {index + 1}.
                    </span>
                    {/* Emoji picker - larger touch target */}
                    <select
                      value={task.icon}
                      onChange={(e) => handleTaskChange(task.id, 'icon', e.target.value)}
                      className="w-12 h-10 rounded-lg bg-background border text-center text-lg touch-manipulation"
                    >
                      {EMOJI_OPTIONS.map(emoji => (
                        <option key={emoji} value={emoji}>{emoji}</option>
                      ))}
                    </select>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 ml-auto text-destructive touch-manipulation"
                      onClick={() => handleRemoveTask(task.id)}
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                  
                  {/* Title inputs - stack on mobile */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Input
                      value={task.title_ru}
                      onChange={(e) => handleTaskChange(task.id, 'title_ru', e.target.value)}
                      placeholder={language === 'ru' ? 'Название (RU)' : 'Title (RU)'}
                      className="h-10 text-sm rounded-lg"
                    />
                    <Input
                      value={task.title_en}
                      onChange={(e) => handleTaskChange(task.id, 'title_en', e.target.value)}
                      placeholder={language === 'ru' ? 'Название (EN)' : 'Title (EN)'}
                      className="h-10 text-sm rounded-lg"
                    />
                  </div>
                  
                  {/* Time and reward - responsive layout */}
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        value={task.time}
                        onChange={(e) => handleTaskChange(task.id, 'time', e.target.value)}
                        placeholder="09:00"
                        className="h-10 text-sm rounded-lg"
                      />
                    </div>
                    <div className="w-20">
                      <Input
                        type="number"
                        value={task.reward_amount}
                        onChange={(e) => handleTaskChange(task.id, 'reward_amount', parseInt(e.target.value) || 0)}
                        min={0}
                        className="h-10 text-sm rounded-lg"
                      />
                    </div>
                    <span className="flex items-center text-lg">💰</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );

  const footer = (
    <div className="flex flex-col sm:flex-row gap-2 w-full pb-safe">
      <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto sm:flex-1 h-11">
        {language === 'ru' ? 'Отмена' : 'Cancel'}
      </Button>
      <Button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto sm:flex-1 h-11">
        {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
        {language === 'ru' ? 'Сохранить' : 'Save'}
      </Button>
    </div>
  );

  // Use Drawer on mobile, Dialog on desktop
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[95vh]">
          <DrawerHeader className="px-4">
            <DrawerTitle>
              {isEditing
                ? (language === 'ru' ? 'Редактировать шаблон' : 'Edit Template')
                : (language === 'ru' ? 'Создать шаблон' : 'Create Template')}
            </DrawerTitle>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto px-4">
            {mainContent}
          </div>
          <DrawerFooter className="px-4">
            {footer}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? (language === 'ru' ? 'Редактировать шаблон' : 'Edit Template')
              : (language === 'ru' ? 'Создать шаблон' : 'Create Template')}
          </DialogTitle>
        </DialogHeader>
        {mainContent}
        <DialogFooter className="flex-col sm:flex-row gap-2">
          {footer}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
