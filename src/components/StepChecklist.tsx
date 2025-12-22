import { Check, Circle, Gift, EyeOff, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTaskSteps, useStepCompletions, type TaskStep } from '@/hooks/useTaskSteps';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface StepChecklistProps {
  templateId: string;
  instanceId: string;
  readOnly?: boolean;
  isParent?: boolean; // If true, show hidden bonuses
  taskCompleted?: boolean; // If true, reveal hidden bonuses to child
}

export const StepChecklist = ({ 
  templateId, 
  instanceId, 
  readOnly = false,
  isParent = false,
  taskCompleted = false,
}: StepChecklistProps) => {
  const { language } = useLanguage();
  const { steps, isLoading: stepsLoading } = useTaskSteps(templateId);
  const { completions, toggleStepCompletion } = useStepCompletions(instanceId);
  const locale = language === 'ru' ? ru : undefined;

  if (stepsLoading || steps.length === 0) {
    return null;
  }

  const completedStepIds = new Set(completions.map(c => c.step_id));
  const completedCount = completedStepIds.size;
  const totalCount = steps.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  // Calculate total bonuses
  const totalVisibleBonus = steps.reduce((sum, s) => sum + (s.bonus_hidden ? 0 : s.bonus_amount), 0);
  const totalHiddenBonus = steps.reduce((sum, s) => sum + (s.bonus_hidden ? s.bonus_amount : 0), 0);

  const handleToggle = (step: TaskStep) => {
    if (readOnly) return;
    
    const isCompleted = completedStepIds.has(step.id);
    toggleStepCompletion.mutate({
      instanceId,
      stepId: step.id,
      isCompleted,
    });
  };

  // Should we show hidden bonus for a step?
  const shouldShowHiddenBonus = (step: TaskStep) => {
    if (!step.bonus_hidden) return true;
    if (isParent) return true;
    if (taskCompleted) return true;
    return false;
  };

  return (
    <div className="mt-3 pt-3 border-t border-border/50">
      {/* Progress indicator */}
      <div className="flex items-center gap-2 mb-2">
        <Progress value={progressPercent} className="h-1.5 flex-1" />
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {completedCount}/{totalCount}
        </span>
        {totalVisibleBonus > 0 && (
          <span className="text-xs text-amber-600 flex items-center gap-0.5">
            <Gift className="w-3 h-3" />
            +{totalVisibleBonus}
          </span>
        )}
        {isParent && totalHiddenBonus > 0 && (
          <span className="text-xs text-muted-foreground flex items-center gap-0.5">
            <EyeOff className="w-3 h-3" />
            +{totalHiddenBonus}
          </span>
        )}
      </div>

      {/* Steps list */}
      <div className="space-y-1.5">
        {steps.map((step) => {
          const isCompleted = completedStepIds.has(step.id);
          const showBonus = shouldShowHiddenBonus(step);
          
          return (
            <button
              key={step.id}
              type="button"
              onClick={() => handleToggle(step)}
              disabled={readOnly || toggleStepCompletion.isPending}
              className={cn(
                "w-full text-left p-1.5 rounded-lg transition-all",
                !readOnly && "hover:bg-muted/50 cursor-pointer",
                readOnly && "cursor-default"
              )}
            >
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center transition-all flex-shrink-0",
                  isCompleted 
                    ? "bg-success text-success-foreground" 
                    : "border-2 border-muted-foreground/30"
                )}>
                  {isCompleted && <Check className="w-3 h-3" />}
                </div>
                <span className={cn(
                  "text-sm flex-1",
                  isCompleted && "line-through text-muted-foreground"
                )}>
                  {language === 'ru' ? step.title_ru : step.title_en}
                </span>
                {step.bonus_amount > 0 && showBonus && (
                  <span className={cn(
                    "text-xs px-1.5 py-0.5 rounded-full flex items-center gap-0.5",
                    step.bonus_hidden ? "bg-muted-foreground/20 text-muted-foreground" : "bg-amber-500/20 text-amber-600"
                  )}>
                    {step.bonus_hidden && <EyeOff className="w-2.5 h-2.5" />}
                    +{step.bonus_amount}
                  </span>
                )}
                {step.bonus_amount > 0 && !showBonus && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground flex items-center gap-0.5">
                    <Gift className="w-2.5 h-2.5" />?
                  </span>
                )}
              </div>
              {step.due_date && (
                <div className="ml-7 mt-0.5 text-xs text-muted-foreground flex items-center gap-1">
                  <CalendarIcon className="w-3 h-3" />
                  {format(new Date(step.due_date), 'dd.MM.yyyy', { locale })}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Reveal hidden bonuses after task completed */}
      {taskCompleted && totalHiddenBonus > 0 && !isParent && (
        <div className="mt-2 p-2 bg-amber-500/10 rounded-lg text-center">
          <span className="text-sm text-amber-600 flex items-center justify-center gap-1">
            🎉 {language === 'ru' ? 'Скрытые бонусы:' : 'Hidden bonuses:'} +{totalHiddenBonus}
          </span>
        </div>
      )}
    </div>
  );
};

// Compact version for displaying just progress
interface StepProgressBadgeProps {
  templateId: string;
  instanceId: string;
}

export const StepProgressBadge = ({ templateId, instanceId }: StepProgressBadgeProps) => {
  const { steps } = useTaskSteps(templateId);
  const { completions } = useStepCompletions(instanceId);

  if (steps.length === 0) {
    return null;
  }

  const completedCount = completions.length;
  const totalCount = steps.length;
  const totalBonus = steps.reduce((sum, s) => sum + (s.bonus_hidden ? 0 : s.bonus_amount), 0);

  return (
    <span className="text-xs px-1.5 py-0.5 bg-muted rounded-full flex items-center gap-1">
      <Circle className="w-2.5 h-2.5" />
      {completedCount}/{totalCount}
      {totalBonus > 0 && (
        <span className="text-amber-600 ml-1">+{totalBonus}</span>
      )}
    </span>
  );
};
