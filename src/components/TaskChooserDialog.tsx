import { useState } from 'react';
import { Plus, RotateCcw, Calendar, FileText } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { AddTaskDialog } from './AddTaskDialog';
import { AddFromTemplateDialog } from './AddFromTemplateDialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface TaskChooserDialogProps {
  trigger?: React.ReactNode;
}

export const TaskChooserDialog = ({ trigger }: TaskChooserDialogProps) => {
  const { language } = useLanguage();
  const [open, setOpen] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddFromTemplate, setShowAddFromTemplate] = useState(false);
  const [initialCategory, setInitialCategory] = useState<'routine' | 'activity'>('routine');

  const handleChooseRoutine = () => {
    setInitialCategory('routine');
    setShowAddTask(true);
    setOpen(false);
  };

  const handleChooseActivity = () => {
    setInitialCategory('activity');
    setShowAddTask(true);
    setOpen(false);
  };

  const handleChooseTemplate = () => {
    setShowAddFromTemplate(true);
    setOpen(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {trigger || (
            <Button size="sm" className="rounded-xl">
              <Plus className="w-4 h-4 mr-1" />
              {language === 'ru' ? 'Добавить' : 'Add'}
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">
              {language === 'ru' ? 'Что добавить?' : 'What to add?'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-3 py-4">
            <button
              type="button"
              onClick={handleChooseRoutine}
              className="flex items-center gap-4 p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <RotateCcw className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{language === 'ru' ? 'Добавить рутину' : 'Add Routine'}</h3>
                <p className="text-sm text-muted-foreground">
                  {language === 'ru' ? 'Повторяющаяся ежедневная задача' : 'Repeating daily task'}
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={handleChooseActivity}
              className="flex items-center gap-4 p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-accent-foreground" />
              </div>
              <div>
                <h3 className="font-semibold">{language === 'ru' ? 'Добавить занятие' : 'Add Activity'}</h3>
                <p className="text-sm text-muted-foreground">
                  {language === 'ru' ? 'Появится в расписании' : 'Shows in schedule'}
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={handleChooseTemplate}
              className="flex items-center gap-4 p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <FileText className="w-6 h-6 text-success" />
              </div>
              <div>
                <h3 className="font-semibold">{language === 'ru' ? 'Добавить из шаблона' : 'Add from Template'}</h3>
                <p className="text-sm text-muted-foreground">
                  {language === 'ru' ? 'Готовый набор задач' : 'Ready-made task set'}
                </p>
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Task Dialog */}
      <AddTaskDialog 
        open={showAddTask} 
        onOpenChange={setShowAddTask}
        initialCategory={initialCategory}
      />

      {/* Add From Template Dialog */}
      <AddFromTemplateDialog 
        open={showAddFromTemplate} 
        onOpenChange={setShowAddFromTemplate}
      />
    </>
  );
};
