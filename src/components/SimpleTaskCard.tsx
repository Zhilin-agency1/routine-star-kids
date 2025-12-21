import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { CoinBadge } from './ui/CoinBadge';

interface SimpleTaskCardProps {
  task: {
    id: string;
    title: { ru: string; en: string };
    icon?: string;
    rewardAmount: number;
    state: 'todo' | 'doing' | 'done' | 'skipped' | 'cancelled';
  };
  onComplete?: () => void;
  showCheckbox?: boolean;
}

export const SimpleTaskCard = ({ task, onComplete, showCheckbox = true }: SimpleTaskCardProps) => {
  const { language } = useLanguage();
  const isDone = task.state === 'done';

  return (
    <div
      className={cn(
        "flex items-center gap-3 bg-card rounded-xl p-3 transition-all",
        isDone && "opacity-60"
      )}
    >
      {/* Checkbox */}
      {showCheckbox && (
        <button
          onClick={() => !isDone && onComplete?.()}
          disabled={isDone}
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

      {/* Title */}
      <span className={cn(
        "flex-1 font-medium text-sm",
        isDone && "line-through text-muted-foreground"
      )}>
        {task.title[language]}
      </span>

      {/* Reward */}
      <CoinBadge amount={task.rewardAmount} size="sm" />
    </div>
  );
};
