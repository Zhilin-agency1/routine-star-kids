import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutTemplate, Play } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useChildren } from '@/hooks/useChildren';
import { useAllTodayTasks } from '@/hooks/useAllTodayTasks';
import { useTasks } from '@/hooks/useTasks';
import { useSchedule } from '@/hooks/useSchedule';
import { ChildAvatar } from '@/components/ui/ChildAvatar';
import { SimpleTaskCard } from '@/components/SimpleTaskCard';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';

export const FamilyTodayPage = () => {
  const { language } = useLanguage();
  const { children } = useChildren();
  const { instances } = useAllTodayTasks();
  const { completeTask } = useTasks();
  const { todayActivities } = useSchedule();
  const navigate = useNavigate();

  // Get current date formatted
  const currentDate = useMemo(() => {
    const now = new Date();
    const locale = language === 'ru' ? ru : enUS;
    // Format: "22 декабря 2024, воскресенье" or "December 22, 2024, Sunday"
    return format(now, language === 'ru' ? "d MMMM yyyy, EEEE" : "MMMM d, yyyy, EEEE", { locale });
  }, [language]);

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
      description: {
        ru: instance.template?.description_ru || '',
        en: instance.template?.description_en || '',
      },
      rewardAmount: instance.template?.reward_amount || 0,
      state: instance.state as 'todo' | 'doing' | 'done' | 'skipped' | 'cancelled',
      icon: instance.template?.icon || '✨',
      rewardGranted: instance.reward_granted,
      endDate: instance.template?.end_date || null,
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
        hasTasks: totalCount > 0 || childActivities.length > 0,
      };
    });
  }, [children, tasks, todayActivities]);

  const handleComplete = (taskId: string, childId: string) => {
    completeTask.mutate({ instanceId: taskId, childId });
  };

  // Check if any child has no tasks
  const hasChildWithNoTasks = childColumns.some(col => !col.hasTasks);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header with date */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {language === 'ru' ? 'Сегодня' : 'Today'}
          </h1>
          <p className="text-sm text-muted-foreground capitalize">
            {currentDate}
          </p>
        </div>
        
        {/* Primary CTA: Apply Template (if anyone has no tasks) */}
        {hasChildWithNoTasks && (
          <Button
            onClick={() => navigate('/parent/templates')}
            size="sm"
            className="min-h-[44px]"
          >
            <LayoutTemplate className="w-4 h-4 mr-2" />
            {language === 'ru' ? 'Шаблоны' : 'Templates'}
          </Button>
        )}
      </div>

      {/* Children columns */}
      <div className="overflow-x-auto -mx-4 px-4 pb-2">
        <div className="flex gap-3" style={{ minWidth: 'max-content' }}>
          {childColumns.map(({ child, tasks: childTasks, activities, completedCount, totalCount, progress, hasTasks }) => (
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
                {/* Quick action to open day */}
                {hasTasks && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => navigate('/schedule')}
                    title={language === 'ru' ? 'Открыть день' : 'Open day'}
                  >
                    <Play className="w-4 h-4" />
                  </Button>
                )}
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
                  {!hasTasks ? (
                    <div className="text-center py-6 bg-card/50 rounded-xl">
                      <span className="text-2xl block mb-2">📋</span>
                      <p className="text-sm text-muted-foreground mb-3">
                        {language === 'ru' ? 'Нет плана' : 'No plan'}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/parent/templates')}
                        className="min-h-[40px]"
                      >
                        <LayoutTemplate className="w-4 h-4 mr-2" />
                        {language === 'ru' ? 'Применить шаблон' : 'Apply template'}
                      </Button>
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
