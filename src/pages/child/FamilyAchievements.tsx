import { useMemo } from 'react';
import { Trophy } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useChildren } from '@/hooks/useChildren';
import { useAllTodayTasks } from '@/hooks/useAllTodayTasks';
import { useTasks } from '@/hooks/useTasks';
import { ChildAvatar } from '@/components/ui/ChildAvatar';
import { CoinBadge } from '@/components/ui/CoinBadge';
import { SimpleTaskCard } from '@/components/SimpleTaskCard';
import { ScrollArea } from '@/components/ui/scroll-area';

export const FamilyAchievements = () => {
  const { t, language } = useLanguage();
  const { children } = useChildren();
  const { instances } = useAllTodayTasks();
  const { completeTask } = useTasks();

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
    }));
  }, [instances]);

  // Group tasks by child with done tasks at bottom
  const childColumns = useMemo(() => {
    return children.map(child => {
      const childTasks = tasks.filter(task => task.childId === child.id);
      const pending = childTasks.filter(t => t.state !== 'done');
      const done = childTasks.filter(t => t.state === 'done');
      const sortedTasks = [...pending, ...done]; // Done goes to bottom
      
      const completedCount = done.length;
      const totalCount = childTasks.length;
      const earnedToday = done
        .filter(t => t.rewardGranted)
        .reduce((sum, t) => sum + t.rewardAmount, 0);

      return {
        child,
        tasks: sortedTasks,
        completedCount,
        totalCount,
        earnedToday,
        progress: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
      };
    });
  }, [children, tasks]);

  const totalEarned = childColumns.reduce((sum, c) => sum + c.earnedToday, 0);

  const handleComplete = (taskId: string, childId: string) => {
    completeTask.mutate({ instanceId: taskId, childId });
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Summary */}
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          <span className="font-semibold">{t('today')}</span>
        </div>
        <CoinBadge amount={totalEarned} size="md" showPlus />
      </div>

      {/* Children columns */}
      <div className="overflow-x-auto -mx-4 px-4 pb-2">
        <div className="flex gap-3" style={{ minWidth: 'max-content' }}>
          {childColumns.map(({ child, tasks: childTasks, completedCount, totalCount, earnedToday, progress }) => (
            <div 
              key={child.id} 
              className="w-[280px] flex-shrink-0"
            >
              {/* Child Header */}
              <div className="flex items-center gap-2 mb-3 px-1">
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

              {/* Tasks List */}
              <ScrollArea className="h-[calc(100vh-320px)]">
                <div className="space-y-2 pr-2">
                  {childTasks.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground bg-card/50 rounded-xl">
                      <span className="text-2xl block mb-1">✨</span>
                      <p className="text-sm">{t('no_tasks_label')}</p>
                    </div>
                  ) : (
                    childTasks.map(task => (
                      <SimpleTaskCard
                        key={task.id}
                        task={task}
                        onComplete={() => handleComplete(task.id, task.childId)}
                      />
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          ))}
        </div>
      </div>

      {children.length === 0 && (
        <div className="text-center py-8 bg-card rounded-2xl">
          <span className="text-4xl block mb-2">👨‍👩‍👧</span>
          <p className="text-muted-foreground">
            {t('no_children_yet')}
          </p>
        </div>
      )}
    </div>
  );
};