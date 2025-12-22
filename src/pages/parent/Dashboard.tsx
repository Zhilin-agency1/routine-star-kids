import { useMemo } from 'react';
import { TrendingUp, CheckCircle, Users, Undo2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useChildren } from '@/hooks/useChildren';
import { useAllTodayTasks } from '@/hooks/useAllTodayTasks';
import { useTasks } from '@/hooks/useTasks';
import { ChildAvatar } from '@/components/ui/ChildAvatar';
import { CoinBadge } from '@/components/ui/CoinBadge';
import { AddTaskDialog } from '@/components/AddTaskDialog';
import { AddChildDialog } from '@/components/AddChildDialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

export const ParentDashboard = () => {
  const { t, language } = useLanguage();
  const { children } = useChildren();
  const { instances } = useAllTodayTasks();
  const { completeTask, uncompleteTask, updateInstanceState } = useTasks();

  // Normalize instances to task format
  const tasks = useMemo(() => {
    return instances.map(instance => ({
      id: instance.id,
      templateId: instance.template_id,
      childId: instance.child_id,
      title: {
        ru: instance.template?.title_ru || '',
        en: instance.template?.title_en || '',
      },
      rewardAmount: instance.template?.reward_amount || 0,
      state: instance.state as 'todo' | 'doing' | 'done' | 'skipped' | 'cancelled',
      icon: instance.template?.icon || '✨',
      rewardGranted: instance.reward_granted,
      dueTime: instance.template?.recurring_time || null,
    }));
  }, [instances]);

  // Group tasks by child
  const childColumns = useMemo(() => {
    return children.map(child => {
      const childTasks = tasks.filter(task => task.childId === child.id);
      const todo = childTasks.filter(t => t.state === 'todo');
      const doing = childTasks.filter(t => t.state === 'doing');
      const done = childTasks.filter(t => t.state === 'done');
      const completedCount = done.length;
      const totalCount = childTasks.length;
      const earnedToday = done
        .filter(t => t.rewardGranted)
        .reduce((sum, t) => sum + t.rewardAmount, 0);

      return {
        child,
        tasks: [...doing, ...todo, ...done],
        todo,
        doing,
        done,
        completedCount,
        totalCount,
        earnedToday,
        progress: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
      };
    });
  }, [children, tasks]);

  const totalCompleted = childColumns.reduce((sum, c) => sum + c.completedCount, 0);
  const totalEarned = childColumns.reduce((sum, c) => sum + c.earnedToday, 0);

  const handleComplete = (taskId: string, childId: string) => {
    completeTask.mutate({ instanceId: taskId, childId });
  };

  const handleUncomplete = (taskId: string, childId: string) => {
    uncompleteTask.mutate({ instanceId: taskId, childId });
  };

  const handleStartTask = (taskId: string) => {
    updateInstanceState.mutate({ instanceId: taskId, state: 'doing' });
  };

  const stateColors: Record<string, string> = {
    todo: 'border-l-muted-foreground/50',
    doing: 'border-l-warning',
    done: 'border-l-success',
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('dashboard_title')}</h1>
          <p className="text-muted-foreground">{t('today')}</p>
        </div>
        <AddTaskDialog />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card rounded-2xl p-3 shadow-card">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <CheckCircle className="w-4 h-4" />
            <span className="text-xs">{t('tasks_completed_today')}</span>
          </div>
          <p className="text-2xl font-bold text-success">{totalCompleted}</p>
        </div>
        
        <div className="bg-card rounded-2xl p-3 shadow-card">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs">{t('earned_today')}</span>
          </div>
          <CoinBadge amount={totalEarned} size="md" />
        </div>
      </div>

      {/* Trello-style Board */}
      {children.length > 0 ? (
        <div className="overflow-x-auto -mx-4 px-4 md:overflow-visible md:mx-0 md:px-0">
          <div className="flex gap-3 md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:gap-4">
            {childColumns.map(({ child, tasks: childTasks, completedCount, totalCount, earnedToday, progress }) => (
              <div 
                key={child.id} 
                className="bg-card/50 rounded-2xl p-3 w-72 flex-shrink-0 md:w-full md:flex-shrink"
              >
                {/* Column Header */}
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/50">
                  <ChildAvatar avatar={child.avatar_url || '🦁'} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate">{child.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {completedCount}/{totalCount} • {progress}%
                    </p>
                  </div>
                  <div className="text-right">
                    <CoinBadge amount={child.balance} size="sm" />
                    <p className="text-xs text-success">+{earnedToday}</p>
                  </div>
                </div>

                {/* Tasks */}
                <ScrollArea className="h-[50vh] sm:h-[60vh] lg:h-[calc(100vh-380px)] pr-2">
                  <div className="space-y-2">
                    {childTasks.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground">
                        <span className="text-2xl block mb-1">✨</span>
                        <p className="text-sm">{language === 'ru' ? 'Нет задач' : 'No tasks'}</p>
                      </div>
                    ) : (
                      childTasks.map(task => (
                        <div 
                          key={task.id}
                          className={`bg-background rounded-xl p-3 border-l-4 ${stateColors[task.state]} shadow-sm transition-all hover:shadow-md ${
                            task.state === 'done' ? 'opacity-60' : ''
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <span className="text-lg">{task.icon}</span>
                            <div className="flex-1 min-w-0">
                              <p className={`font-medium text-sm ${task.state === 'done' ? 'line-through' : ''}`}>
                                {task.title[language]}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <CoinBadge amount={task.rewardAmount} size="sm" />
                                {task.dueTime && (
                                  <span className="text-xs text-muted-foreground">
                                    {task.dueTime.slice(0, 5)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {task.state !== 'done' ? (
                            <div className="flex gap-1 mt-2">
                              {task.state === 'todo' && (
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="flex-1 h-7 text-xs"
                                  onClick={() => handleStartTask(task.id)}
                                >
                                  {language === 'ru' ? 'Начать' : 'Start'}
                                </Button>
                              )}
                              <Button 
                                size="sm" 
                                className="flex-1 h-7 text-xs"
                                onClick={() => handleComplete(task.id, task.childId)}
                              >
                                {language === 'ru' ? 'Готово ✓' : 'Done ✓'}
                              </Button>
                            </div>
                          ) : (
                            <div className="flex gap-1 mt-2">
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="flex-1 h-7 text-xs text-muted-foreground hover:text-destructive"
                                onClick={() => handleUncomplete(task.id, task.childId)}
                              >
                                <Undo2 className="w-3 h-3 mr-1" />
                                {language === 'ru' ? 'Отменить' : 'Undo'}
                              </Button>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 bg-card rounded-2xl">
          <div className="text-4xl mb-2">👨‍👩‍👧</div>
          <p className="text-muted-foreground mb-3">
            {language === 'ru' ? 'Добавьте первого ребёнка' : 'Add your first child'}
          </p>
          <AddChildDialog />
        </div>
      )}

      {/* Quick Actions */}
      <section className="grid grid-cols-2 gap-3">
        <AddTaskDialog
          trigger={
            <button className="bg-primary/10 hover:bg-primary/20 text-primary rounded-2xl p-4 text-center transition-colors w-full">
              <span className="text-2xl block mb-1">➕</span>
              <span className="text-sm font-semibold">{t('add_task')}</span>
            </button>
          }
        />
        <AddChildDialog
          trigger={
            <button className="bg-secondary/10 hover:bg-secondary/20 text-secondary rounded-2xl p-4 text-center transition-colors w-full">
              <span className="text-2xl block mb-1">👶</span>
              <span className="text-sm font-semibold">{t('add_child')}</span>
            </button>
          }
        />
      </section>
    </div>
  );
};
