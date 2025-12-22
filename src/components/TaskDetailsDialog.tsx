import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTaskSteps, useStepCompletions } from '@/hooks/useTaskSteps';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { CoinBadge } from '@/components/ui/CoinBadge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, ListChecks, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, differenceInDays } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';

interface TaskDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: {
    id: string;
    templateId: string;
    title: { ru: string; en: string };
    description?: { ru: string; en: string };
    icon?: string;
    rewardAmount: number;
    state: 'todo' | 'doing' | 'done' | 'skipped' | 'cancelled';
    endDate?: string | null;
  };
  canToggleSteps?: boolean;
}

export const TaskDetailsDialog = ({ 
  open, 
  onOpenChange, 
  task,
  canToggleSteps = false 
}: TaskDetailsDialogProps) => {
  const { language } = useLanguage();
  const { steps, isLoading: stepsLoading } = useTaskSteps(task.templateId);
  const { completions, toggleStepCompletion } = useStepCompletions(task.id);
  
  const hasSteps = steps.length > 0;
  const completedSteps = completions.length;
  const remainingSteps = steps.length - completedSteps;
  
  const description = task.description?.[language];
  
  // Calculate days remaining if end date exists
  const daysRemaining = task.endDate 
    ? differenceInDays(new Date(task.endDate), new Date())
    : null;

  const handleToggleStep = (stepId: string) => {
    if (!canToggleSteps) return;
    
    const isCompleted = completions.some(c => c.step_id === stepId);
    toggleStepCompletion.mutate({
      instanceId: task.id,
      stepId,
      isCompleted,
    });
  };

  const isStepCompleted = (stepId: string) => {
    return completions.some(c => c.step_id === stepId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-3">
            <span className="text-3xl">{task.icon || '✨'}</span>
            <span>{task.title[language]}</span>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-4 pb-2">
          {/* Task reward */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {language === 'ru' ? 'Награда:' : 'Reward:'}
            </span>
            <CoinBadge amount={task.rewardAmount} size="sm" showPlus />
          </div>

          {/* Description */}
          {description && (
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {description}
              </p>
            </div>
          )}

          {/* Status badges */}
          <div className="flex flex-wrap gap-2">
            {hasSteps && (
              <div className="flex items-center gap-1.5 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                <ListChecks className="w-3.5 h-3.5" />
                <span>
                  {language === 'ru' 
                    ? `Осталось ${remainingSteps} из ${steps.length} шагов`
                    : `${remainingSteps} of ${steps.length} steps remaining`}
                </span>
              </div>
            )}
            
            {daysRemaining !== null && daysRemaining >= 0 && (
              <div className={cn(
                "flex items-center gap-1.5 text-xs px-2 py-1 rounded-full",
                daysRemaining <= 1 
                  ? "bg-destructive/10 text-destructive" 
                  : daysRemaining <= 3 
                    ? "bg-warning/10 text-warning"
                    : "bg-muted text-muted-foreground"
              )}>
                <Calendar className="w-3.5 h-3.5" />
                <span>
                  {daysRemaining === 0
                    ? (language === 'ru' ? 'Сегодня последний день' : 'Last day')
                    : daysRemaining === 1
                      ? (language === 'ru' ? 'Остался 1 день' : '1 day left')
                      : (language === 'ru' ? `Осталось ${daysRemaining} дней` : `${daysRemaining} days left`)}
                </span>
              </div>
            )}
          </div>

          {/* Steps list */}
          {hasSteps && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <ListChecks className="w-4 h-4" />
                {language === 'ru' ? 'Шаги выполнения' : 'Steps'}
              </h4>
              
              <div className="space-y-2">
                {steps.map((step, index) => {
                  const completed = isStepCompleted(step.id);
                  
                  return (
                    <div 
                      key={step.id}
                      className={cn(
                        "flex items-start gap-3 p-2 rounded-lg transition-colors",
                        canToggleSteps && "cursor-pointer hover:bg-muted/50",
                        completed && "opacity-60"
                      )}
                      onClick={() => handleToggleStep(step.id)}
                    >
                      <div className={cn(
                        "w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5",
                        completed 
                          ? "bg-success border-success" 
                          : "border-muted-foreground/30"
                      )}>
                        {completed && <Check className="w-3 h-3 text-success-foreground" strokeWidth={3} />}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "text-sm",
                          completed && "line-through text-muted-foreground"
                        )}>
                          {language === 'ru' ? step.title_ru : step.title_en}
                        </p>
                      </div>
                      
                      {step.bonus_amount > 0 && !step.bonus_hidden && (
                        <CoinBadge amount={step.bonus_amount} size="sm" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Loading state */}
          {stepsLoading && (
            <div className="text-center py-4 text-muted-foreground text-sm">
              {language === 'ru' ? 'Загрузка...' : 'Loading...'}
            </div>
          )}

          {/* Empty state */}
          {!hasSteps && !description && !stepsLoading && (
            <div className="text-center py-4 text-muted-foreground text-sm">
              {language === 'ru' ? 'Нет дополнительной информации' : 'No additional information'}
            </div>
          )}
        </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
