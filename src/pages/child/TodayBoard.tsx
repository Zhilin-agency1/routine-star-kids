import { useMemo } from 'react';
import { Trophy, Target, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useApp } from '@/contexts/AppContext';
import { CoinBadge } from '@/components/ui/CoinBadge';
import { SimpleTaskCard } from '@/components/SimpleTaskCard';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';

export const TodayBoard = () => {
  const { t, language } = useLanguage();
  const { tasks, currentChild, moveTask } = useApp();
  const navigate = useNavigate();

  // Get current date formatted
  const currentDate = useMemo(() => {
    const now = new Date();
    const locale = language === 'ru' ? ru : enUS;
    return format(now, language === 'ru' ? "d MMMM yyyy, EEEE" : "MMMM d, yyyy, EEEE", { locale });
  }, [language]);

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
  
  // Find the first incomplete task for "next task" focus
  const nextTask = childTasks.pending[0];

  const handleComplete = (taskId: string) => {
    moveTask(taskId, 'done');
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Progress Summary */}
      <div className="bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            <span className="font-semibold">{t('today')}</span>
          </div>
          <div className="flex items-center gap-1">
            <Trophy className="w-4 h-4 text-coin" />
            <CoinBadge amount={earnedToday} size="sm" showPlus />
          </div>
        </div>
        
        {/* Current date */}
        <p className="text-xs text-muted-foreground capitalize mb-3">
          {currentDate}
        </p>

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

      {/* Next Task Highlight (if there are pending tasks) */}
      {nextTask && (
        <div className="bg-primary/5 border-2 border-primary/20 rounded-2xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-4 h-4 text-primary fill-primary" />
            <span className="text-sm font-semibold text-primary">
              {language === 'ru' ? 'Следующее задание' : 'Next task'}
            </span>
          </div>
          <SimpleTaskCard
            task={{
              ...nextTask,
              templateId: nextTask.templateId,
            }}
            onComplete={() => handleComplete(nextTask.id)}
            canToggleSteps={true}
          />
        </div>
      )}

      {/* Remaining Tasks List */}
      {childTasks.pending.length > 1 && (
        <div className="space-y-2">
          {sortedTasks.slice(1).map(task => (
            <SimpleTaskCard
              key={task.id}
              task={{
                ...task,
                templateId: task.templateId,
              }}
              onComplete={() => handleComplete(task.id)}
              canToggleSteps={true}
            />
          ))}
        </div>
      )}

      {/* Done tasks (if next task exists, show remaining done) */}
      {nextTask && childTasks.done.length > 0 && (
        <div className="space-y-2">
          {childTasks.done.map(task => (
            <SimpleTaskCard
              key={task.id}
              task={{
                ...task,
                templateId: task.templateId,
              }}
              onComplete={() => handleComplete(task.id)}
              canToggleSteps={true}
            />
          ))}
        </div>
      )}

      {/* All tasks done celebration */}
      {totalTasks > 0 && childTasks.pending.length === 0 && (
        <div className="text-center py-8 bg-gradient-to-br from-success/10 to-primary/10 rounded-2xl">
          <div className="text-6xl mb-4">🎉</div>
          <p className="text-xl font-bold text-foreground">
            {language === 'ru' ? 'Всё сделано!' : 'All done!'}
          </p>
          <p className="text-muted-foreground mt-2">
            {language === 'ru' 
              ? 'Отличная работа! Можешь отдохнуть.' 
              : 'Great job! You can rest now.'}
          </p>
        </div>
      )}

      {/* Empty state - Child cannot add tasks */}
      {totalTasks === 0 && (
        <div className="text-center py-12 bg-card rounded-2xl">
          <div className="text-6xl mb-4">📋</div>
          <p className="text-xl font-bold text-foreground">
            {language === 'ru' ? 'План ещё не готов' : 'No plan for today yet'}
          </p>
          <p className="text-muted-foreground mt-2 mb-6">
            {language === 'ru' 
              ? 'Твой план на сегодня ещё не составлен' 
              : 'Your plan for today is not ready yet'}
          </p>
          {/* Option to switch to parent mode - only visible, no action here */}
          <p className="text-xs text-muted-foreground">
            {language === 'ru' 
              ? 'Попроси родителя составить план' 
              : 'Ask a parent to set up your plan'}
          </p>
        </div>
      )}
    </div>
  );
};
