import { Check, Circle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTaskSteps, useStepCompletions, type TaskStep } from '@/hooks/useTaskSteps';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface StepChecklistProps {
  templateId: string;
  instanceId: string;
  readOnly?: boolean;
}

export const StepChecklist = ({ templateId, instanceId, readOnly = false }: StepChecklistProps) => {
  const { language } = useLanguage();
  const { steps, isLoading: stepsLoading } = useTaskSteps(templateId);
  const { completions, toggleStepCompletion } = useStepCompletions(instanceId);

  if (stepsLoading || steps.length === 0) {
    return null;
  }

  const completedStepIds = new Set(completions.map(c => c.step_id));
  const completedCount = completedStepIds.size;
  const totalCount = steps.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  const handleToggle = (step: TaskStep) => {
    if (readOnly) return;
    
    const isCompleted = completedStepIds.has(step.id);
    toggleStepCompletion.mutate({
      instanceId,
      stepId: step.id,
      isCompleted,
    });
  };

  return (
    <div className="mt-3 pt-3 border-t border-border/50">
      {/* Progress indicator */}
      <div className="flex items-center gap-2 mb-2">
        <Progress value={progressPercent} className="h-1.5 flex-1" />
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {completedCount}/{totalCount}
        </span>
      </div>

      {/* Steps list */}
      <div className="space-y-1.5">
        {steps.map((step) => {
          const isCompleted = completedStepIds.has(step.id);
          
          return (
            <button
              key={step.id}
              type="button"
              onClick={() => handleToggle(step)}
              disabled={readOnly || toggleStepCompletion.isPending}
              className={cn(
                "w-full flex items-center gap-2 text-left p-1.5 rounded-lg transition-all",
                !readOnly && "hover:bg-muted/50 cursor-pointer",
                readOnly && "cursor-default"
              )}
            >
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
            </button>
          );
        })}
      </div>
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

  return (
    <span className="text-xs px-1.5 py-0.5 bg-muted rounded-full flex items-center gap-1">
      <Circle className="w-2.5 h-2.5" />
      {completedCount}/{totalCount}
    </span>
  );
};
