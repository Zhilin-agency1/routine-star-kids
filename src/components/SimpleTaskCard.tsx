import { useState } from 'react';
import { Check, ListChecks } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { CoinBadge } from './ui/CoinBadge';
import { TaskDetailsDialog } from './TaskDetailsDialog';
import { useTaskSteps, useStepCompletions } from '@/hooks/useTaskSteps';

interface SimpleTaskCardProps {
  task: {
    id: string;
    templateId?: string;
    title: { ru: string; en: string };
    description?: { ru: string; en: string };
    icon?: string;
    rewardAmount: number;
    state: 'todo' | 'doing' | 'done' | 'skipped' | 'cancelled';
    endDate?: string | null;
  };
  onComplete?: () => void;
  showCheckbox?: boolean;
  canToggleSteps?: boolean;
}

export const SimpleTaskCard = ({ task, onComplete, showCheckbox = true, canToggleSteps = false }: SimpleTaskCardProps) => {
  const { language, t } = useLanguage();
  const [dialogOpen, setDialogOpen] = useState(false);
  const isDone = task.state === 'done';
  
  // Get steps count for indicator
  const { steps } = useTaskSteps(task.templateId);
  const { completions } = useStepCompletions(task.id);
  
  const hasSteps = steps.length > 0;
  const hasDescription = !!(task.description?.ru || task.description?.en);
  const hasDetails = hasSteps || hasDescription;
  const remainingSteps = steps.length - completions.length;

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't open dialog if clicking on checkbox
    if ((e.target as HTMLElement).closest('button')) return;
    // Open dialog if we have templateId (steps may still be loading)
    if (task.templateId) {
      setDialogOpen(true);
    }
  };

  const getStepsText = () => {
    if (remainingSteps === 1) {
      return `1 ${t('step_left')}`;
    }
    return `${remainingSteps} ${t('steps_left')}`;
  };

  return (
    <>
      <div
        className={cn(
          "flex items-center gap-3 bg-card rounded-xl p-3 transition-all",
          isDone && "opacity-60",
          task.templateId && "cursor-pointer hover:bg-card/80"
        )}
        onClick={handleCardClick}
      >
        {/* Checkbox */}
        {showCheckbox && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (!isDone) onComplete?.();
            }}
            disabled={isDone}
            aria-label={
              isDone
                ? (language === 'ru' ? 'Задача выполнена' : 'Task completed')
                : (language === 'ru' ? 'Отметить выполненной' : 'Mark as complete')
            }
            className={cn(
              "w-7 h-7 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all",
              isDone 
                ? "bg-success border-success" 
                : "border-muted-foreground/30 hover:border-primary"
            )}
          >
            {isDone && <Check className="w-4 h-4 text-success-foreground" strokeWidth={3} />}
          </button>
        )}

        {/* Icon */}
        <span className="text-2xl flex-shrink-0">{task.icon || '✨'}</span>

        {/* Title and steps indicator */}
        <div className="flex-1 min-w-0">
          <span className={cn(
            "font-medium text-sm block",
            isDone && "line-through text-muted-foreground"
          )}>
            {task.title[language]}
          </span>
          
          {hasSteps && !isDone && remainingSteps > 0 && (
            <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <ListChecks className="w-3 h-3" />
              {getStepsText()}
            </span>
          )}
        </div>

        {/* Reward */}
        <CoinBadge amount={task.rewardAmount} size="sm" />
      </div>

      {/* Details Dialog - always render if templateId exists */}
      {task.templateId && (
        <TaskDetailsDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          task={{
            id: task.id,
            templateId: task.templateId,
            title: task.title,
            description: task.description,
            icon: task.icon,
            rewardAmount: task.rewardAmount,
            state: task.state,
            endDate: task.endDate,
          }}
          canToggleSteps={canToggleSteps}
        />
      )}
    </>
  );
};
