import { useLanguage } from '@/contexts/LanguageContext';
import { useTaskSteps, useStepCompletions } from '@/hooks/useTaskSteps';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CoinBadge } from '@/components/ui/CoinBadge';

import { Check, ListChecks, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { differenceInDays } from 'date-fns';

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
  const { language, t } = useLanguage();
  const { steps, isLoading: stepsLoading } = useTaskSteps(task.templateId);
  const { completions, toggleStepCompletion } = useStepCompletions(task.id);
  const stepsDisabled = !canToggleSteps || toggleStepCompletion.isPending;
  
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

  const getDaysRemainingText = () => {
    if (daysRemaining === 0) return t('last_day');
    if (daysRemaining === 1) return t('one_day_left');
    return `${daysRemaining} ${t('days_left')}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-3">
            <span className="text-3xl">{task.icon || '✨'}</span>
            <span>{task.title[language]}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto -mx-6 px-6">
          <div className="space-y-4 pb-2">
          {/* Task reward */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {t('reward_label')}
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
                  {remainingSteps} {t('steps_remaining_of')} {steps.length} {t('steps')}
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
                <span>{getDaysRemainingText()}</span>
              </div>
            )}
          </div>

          {/* Steps list */}
          {hasSteps && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <ListChecks className="w-4 h-4" />
                {t('steps_execution')}
              </h4>
              
              <div className="space-y-2">
                {steps.map((step) => {
                  const completed = isStepCompleted(step.id);
                  
                  return (
                    <button
                      key={step.id}
                      type="button"
                      disabled={stepsDisabled}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-xl border border-border/70 bg-card p-3 text-left transition-colors",
                        canToggleSteps && "cursor-pointer hover:border-primary/30 hover:bg-muted/50",
                        !canToggleSteps && "cursor-default",
                        completed && "opacity-60"
                      )}
                      onClick={() => handleToggleStep(step.id)}
                    >
                      <div className={cn(
                        "mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2",
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
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Loading state */}
          {stepsLoading && (
            <div className="text-center py-4 text-muted-foreground text-sm">
              {t('loading')}
            </div>
          )}

          {/* Empty state */}
          {!hasSteps && !description && !stepsLoading && (
            <div className="text-center py-4 text-muted-foreground text-sm">
              {t('no_additional_info')}
            </div>
          )}
        </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
