import { useMemo } from 'react';
import { Sparkles, Trophy, Target } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useApp } from '@/contexts/AppContext';
import { TaskCard } from '@/components/TaskCard';

export const TodayBoard = () => {
  const { t } = useLanguage();
  const { tasks, currentChild } = useApp();

  const childTasks = useMemo(() => {
    if (!currentChild) return { todo: [], doing: [], done: [] };
    
    const filtered = tasks.filter(task => task.childId === currentChild.id);
    return {
      todo: filtered.filter(t => t.state === 'todo'),
      doing: filtered.filter(t => t.state === 'doing'),
      done: filtered.filter(t => t.state === 'done'),
    };
  }, [tasks, currentChild]);

  const totalTasks = childTasks.todo.length + childTasks.doing.length + childTasks.done.length;
  const completedPercent = totalTasks > 0 ? Math.round((childTasks.done.length / totalTasks) * 100) : 0;

  const earnedToday = childTasks.done.reduce((sum, task) => sum + task.rewardAmount, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Progress Summary */}
      <div className="bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 rounded-3xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            <span className="font-semibold">{t('today')}</span>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <Trophy className="w-4 h-4 text-coin" />
            <span className="font-bold">+{earnedToday}</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="relative h-4 bg-muted rounded-full overflow-hidden mb-2">
          <div 
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-success rounded-full transition-all duration-500"
            style={{ width: `${completedPercent}%` }}
          />
        </div>
        <p className="text-sm text-muted-foreground text-center">
          {childTasks.done.length} / {totalTasks} {t('tasks_completed_today').toLowerCase()}
        </p>
      </div>

      {/* In Progress */}
      {childTasks.doing.length > 0 && (
        <section className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 rounded-full bg-warning animate-pulse" />
            <h2 className="font-bold text-lg">{t('state_doing')}</h2>
            <span className="text-sm text-muted-foreground">({childTasks.doing.length})</span>
          </div>
          <div className="space-y-3">
            {childTasks.doing.map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </section>
      )}

      {/* To Do */}
      {childTasks.todo.length > 0 && (
        <section className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 rounded-full bg-muted-foreground/50" />
            <h2 className="font-bold text-lg">{t('state_todo')}</h2>
            <span className="text-sm text-muted-foreground">({childTasks.todo.length})</span>
          </div>
          <div className="space-y-3">
            {childTasks.todo.map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </section>
      )}

      {/* Done */}
      {childTasks.done.length > 0 && (
        <section className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 rounded-full bg-success" />
            <h2 className="font-bold text-lg">{t('state_done')}</h2>
            <Sparkles className="w-4 h-4 text-coin" />
            <span className="text-sm text-muted-foreground">({childTasks.done.length})</span>
          </div>
          <div className="space-y-3">
            {childTasks.done.map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {totalTasks === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4 animate-float">🎉</div>
          <p className="text-xl font-bold text-foreground">{t('no_tasks')}</p>
          <p className="text-muted-foreground mt-2">{t('great_job')}</p>
        </div>
      )}
    </div>
  );
};
