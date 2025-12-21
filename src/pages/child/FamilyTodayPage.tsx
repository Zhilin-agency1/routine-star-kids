import { useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useChildren } from '@/hooks/useChildren';
import { useAllTodayTasks } from '@/hooks/useAllTodayTasks';
import { useTasks } from '@/hooks/useTasks';
import { useSchedule } from '@/hooks/useSchedule';
import { ChildAvatar } from '@/components/ui/ChildAvatar';
import { SimpleTaskCard } from '@/components/SimpleTaskCard';
import { ScrollArea } from '@/components/ui/scroll-area';

export const FamilyTodayPage = () => {
  const { language } = useLanguage();
  const { children } = useChildren();
  const { instances } = useAllTodayTasks();
  const { completeTask } = useTasks();
  const { todayActivities } = useSchedule();

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

  // Group tasks and activities by child
  const childColumns = useMemo(() => {
    return children.map(child => {
      const childTasks = tasks.filter(task => task.childId === child.id);
      const pending = childTasks.filter(t => t.state !== 'done');
      const done = childTasks.filter(t => t.state === 'done');
      const sortedTasks = [...pending, ...done];
      
      const childActivities = todayActivities
        .filter(a => a.child_id === child.id)
        .sort((a, b) => a.time.localeCompare(b.time));
      
      const completedCount = done.length;
      const totalCount = childTasks.length;

      return {
        child,
        tasks: sortedTasks,
        activities: childActivities,
        completedCount,
        totalCount,
        progress: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
      };
    });
  }, [children, tasks, todayActivities]);

  const handleComplete = (taskId: string, childId: string) => {
    completeTask.mutate({ instanceId: taskId, childId });
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <h1 className="text-2xl font-bold">
        {language === 'ru' ? 'Сегодня' : 'Today'}
      </h1>

      {/* Children columns */}
      <div className="overflow-x-auto -mx-4 px-4 pb-2">
        <div className="flex gap-3" style={{ minWidth: 'max-content' }}>
          {childColumns.map(({ child, tasks: childTasks, activities, completedCount, totalCount, progress }) => (
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
              </div>

              {/* Activities for today */}
              {activities.length > 0 && (
                <div className="mb-3 space-y-1">
                  {activities.map(activity => (
                    <div 
                      key={activity.id}
                      className="flex items-center gap-2 p-2 rounded-lg bg-secondary/10 text-sm"
                    >
                      <span className="font-mono text-xs font-semibold">
                        {activity.time.slice(0, 5)}
                      </span>
                      <span className="truncate">
                        {language === 'ru' ? activity.title_ru : activity.title_en}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Tasks List */}
              <ScrollArea className="h-[calc(100vh-320px)]">
                <div className="space-y-2 pr-2">
                  {childTasks.length === 0 && activities.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground bg-card/50 rounded-xl">
                      <span className="text-2xl block mb-1">✨</span>
                      <p className="text-sm">{language === 'ru' ? 'Нет задач' : 'No tasks'}</p>
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
            {language === 'ru' ? 'Пока нет детей в семье' : 'No children in family yet'}
          </p>
        </div>
      )}
    </div>
  );
};
