import { useState } from 'react';
import { Check, Play, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useApp, TaskInstance } from '@/contexts/AppContext';
import { CoinBadge } from './ui/CoinBadge';
import { Button } from './ui/button';
import { Confetti } from './Confetti';

interface TaskCardProps {
  task: TaskInstance;
  onComplete?: () => void;
}

export const TaskCard = ({ task, onComplete }: TaskCardProps) => {
  const { language, t } = useLanguage();
  const { moveTask } = useApp();
  const [showConfetti, setShowConfetti] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const title = task.title[language];
  const description = task.description?.[language];

  const handleComplete = () => {
    setIsCompleting(true);
    setShowConfetti(true);
    
    setTimeout(() => {
      moveTask(task.id, 'done');
      setIsCompleting(false);
      onComplete?.();
    }, 500);
  };

  const handleStart = () => {
    moveTask(task.id, 'doing');
  };

  const stateStyles = {
    todo: 'border-l-4 border-l-muted-foreground/30',
    doing: 'border-l-4 border-l-warning ring-2 ring-warning/20',
    done: 'border-l-4 border-l-success opacity-75',
    skipped: 'border-l-4 border-l-muted opacity-50',
    cancelled: 'border-l-4 border-l-destructive opacity-50',
  };

  return (
    <>
      <Confetti isActive={showConfetti} />
      <div 
        className={cn(
          "bg-card rounded-2xl p-5 shadow-card interactive-card",
          stateStyles[task.state],
          isCompleting && "animate-bounce-in scale-105",
          task.state === 'done' && "bg-success/10"
        )}
      >
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="text-4xl flex-shrink-0 animate-float">
            {task.icon || '✨'}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className={cn(
              "font-bold text-xl leading-tight",
              task.state === 'done' && "line-through text-muted-foreground"
            )}>
              {title}
            </h3>
            {description && (
              <p className="text-base text-muted-foreground mt-2 line-clamp-2">
                {description}
              </p>
            )}
            
            <div className="flex items-center gap-3 mt-4">
              <CoinBadge amount={task.rewardAmount} size="md" showPlus />
              
              {task.state === 'doing' && (
                <span className="flex items-center gap-1.5 text-sm text-warning font-semibold">
                  <Clock className="w-4 h-4" />
                  {t('state_doing')}
                </span>
              )}
            </div>
          </div>

          {/* Action Button */}
          <div className="flex-shrink-0">
            {task.state === 'todo' && (
              <Button
                size="icon"
                variant="outline"
                className="rounded-full w-14 h-14 border-2 border-primary hover:bg-primary hover:text-primary-foreground transition-all"
                onClick={handleStart}
              >
                <Play className="w-6 h-6" />
              </Button>
            )}
            {task.state === 'doing' && (
              <Button
                size="icon"
                className="rounded-full w-14 h-14 bg-success hover:bg-success/90 text-success-foreground shadow-lg animate-pulse-glow"
                onClick={handleComplete}
              >
                <Check className="w-7 h-7" strokeWidth={3} />
              </Button>
            )}
            {task.state === 'done' && (
              <div className="w-14 h-14 rounded-full bg-success/20 flex items-center justify-center">
                <Check className="w-7 h-7 text-success" strokeWidth={3} />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
