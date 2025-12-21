import { useMemo } from 'react';
import { Trophy, Target } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useApp } from '@/contexts/AppContext';
import { CoinBadge } from '@/components/ui/CoinBadge';
import { SimpleTaskCard } from '@/components/SimpleTaskCard';

export const TodayBoard = () => {
  const { t } = useLanguage();
  const { tasks, currentChild, moveTask } = useApp();

  const childTasks = useMemo(() => {
    if (!currentChild) return { pending: [], done: [] };
    
    const filtered = tasks.filter(task => task.childId === currentChild.id);
    return {
      pending: filtered.filter(t => t.state !== 'done'),
      done: filtered.filter(t => t.state === 'done'),
    };
  }, [tasks, currentChild]);

  // Done tasks go to bottom
  const sortedTasks = [...childTasks.pending, ...childTasks.done];

  const totalTasks = sortedTasks.length;
  const completedPercent = totalTasks > 0 ? Math.round((childTasks.done.length / totalTasks) * 100) : 0;
  const earnedToday = childTasks.done.reduce((sum, task) => sum + task.rewardAmount, 0);

  const handleComplete = (taskId: string) => {
    moveTask(taskId, 'done');
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Progress Summary */}
      <div className="bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            <span className="font-semibold">{t('today')}</span>
          </div>
          <div className="flex items-center gap-1">
            <Trophy className="w-4 h-4 text-coin" />
            <CoinBadge amount={earnedToday} size="sm" showPlus />
          </div>
        </div>

        {/* Progress bar */}
        <div className="relative h-3 bg-muted rounded-full overflow-hidden mb-2">
          <div 
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-success rounded-full transition-all duration-500"
            style={{ width: `${completedPercent}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground text-center">
          {childTasks.done.length} / {totalTasks} {t('tasks_completed_today').toLowerCase()}
        </p>
      </div>

      {/* Tasks List */}
      <div className="space-y-2">
        {sortedTasks.map(task => (
          <SimpleTaskCard
            key={task.id}
            task={task}
            onComplete={() => handleComplete(task.id)}
          />
        ))}
      </div>

      {/* Empty state */}
      {totalTasks === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎉</div>
          <p className="text-xl font-bold text-foreground">{t('no_tasks')}</p>
          <p className="text-muted-foreground mt-2">{t('great_job')}</p>
        </div>
      )}
    </div>
  );
};
