import { Clock, Play, Copy, Pencil } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { DayTemplateWithTasks, PRESET_TEMPLATES } from '@/hooks/useDayTemplates';
import { Button } from '@/components/ui/button';
import { CoinBadge } from '@/components/ui/CoinBadge';

export type PresetTemplate = typeof PRESET_TEMPLATES[number];
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';

interface TemplatePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: DayTemplateWithTasks;
  preset?: PresetTemplate;
  onApply: () => void;
  onDuplicate?: () => void;
  onEdit?: () => void;
  isUserTemplate?: boolean;
}

export const TemplatePreviewDialog = ({
  open,
  onOpenChange,
  template,
  preset,
  onApply,
  onDuplicate,
  onEdit,
  isUserTemplate = false,
}: TemplatePreviewDialogProps) => {
  const { language } = useLanguage();
  const isMobile = useIsMobile();

  const name = template
    ? (language === 'ru' ? template.name_ru : template.name_en)
    : preset
    ? (language === 'ru' ? preset.name_ru : preset.name_en)
    : '';

  const tasks = template?.tasks || preset?.tasks || [];

  const getTotalReward = () => {
    return tasks.reduce((sum, t) => sum + t.reward_amount, 0);
  };

  const getTotalDuration = () => {
    return tasks.reduce((sum, t) => sum + ('duration_minutes' in t ? (t.duration_minutes || 0) : 0), 0);
  };

  const getTaskDuration = (task: typeof tasks[number]) => {
    return 'duration_minutes' in task ? task.duration_minutes : undefined;
  };

  const content = (
    <div className="flex flex-col h-full">
      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4 flex-wrap">
        <span className="flex items-center gap-1.5">
          <Clock className="w-4 h-4" />
          {tasks.length} {language === 'ru' ? 'задач' : 'tasks'}
        </span>
        {getTotalDuration() > 0 && (
          <span className="flex items-center gap-1.5">
            ~{getTotalDuration()} {language === 'ru' ? 'мин' : 'min'}
          </span>
        )}
        <CoinBadge amount={getTotalReward()} size="sm" />
      </div>

      {/* Full task list */}
      <ScrollArea className="flex-1 -mx-4 px-4 min-h-0" style={{ maxHeight: isMobile ? 'calc(100vh - 280px)' : '400px' }}>
        <div className="space-y-2 pb-2">
          {tasks.map((task, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl min-h-[48px]"
            >
              <span className="text-lg flex-shrink-0">{task.icon || '📋'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {language === 'ru' ? task.title_ru : task.title_en}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 flex-wrap">
                  {getTaskDuration(task) && getTaskDuration(task)! > 0 && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {getTaskDuration(task)} {language === 'ru' ? 'мин' : 'min'}
                    </span>
                  )}
                  {task.reward_amount > 0 && (
                    <CoinBadge amount={task.reward_amount} size="sm" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Actions */}
      <div className="pt-4 space-y-2 mt-auto border-t border-border">
        <Button className="w-full rounded-xl h-12" onClick={onApply}>
          <Play className="w-4 h-4 mr-2" />
          {language === 'ru' ? 'Применить' : 'Apply'}
        </Button>
        
        <div className="flex gap-2">
          {isUserTemplate && onEdit && (
            <Button
              variant="outline"
              className="flex-1 rounded-xl h-11"
              onClick={onEdit}
            >
              <Pencil className="w-4 h-4 mr-2" />
              {language === 'ru' ? 'Редактировать' : 'Edit'}
            </Button>
          )}
          {!isUserTemplate && onDuplicate && (
            <Button
              variant="outline"
              className="flex-1 rounded-xl h-11"
              onClick={onDuplicate}
            >
              <Copy className="w-4 h-4 mr-2" />
              {language === 'ru' ? 'Дублировать' : 'Duplicate'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="pb-2">
            <DrawerTitle className="text-lg">{name}</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6 flex flex-col flex-1 min-h-0">
            {content}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{name}</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
};
