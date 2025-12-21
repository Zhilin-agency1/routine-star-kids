import { Plus, Calendar, MoreVertical } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useApp } from '@/contexts/AppContext';
import { CoinBadge } from '@/components/ui/CoinBadge';
import { Button } from '@/components/ui/button';
import { ChildAvatar } from '@/components/ui/ChildAvatar';

export const TasksPage = () => {
  const { t, language } = useLanguage();
  const { tasks, children } = useApp();

  const getChildById = (id: string) => children.find(c => c.id === id);

  const stateColors = {
    todo: 'bg-muted-foreground/20 text-muted-foreground',
    doing: 'bg-warning/20 text-warning',
    done: 'bg-success/20 text-success',
    skipped: 'bg-muted text-muted-foreground',
    cancelled: 'bg-destructive/20 text-destructive',
  };

  const stateLabels = {
    todo: language === 'ru' ? 'Сделать' : 'To Do',
    doing: language === 'ru' ? 'В процессе' : 'In Progress',
    done: language === 'ru' ? 'Выполнено' : 'Done',
    skipped: language === 'ru' ? 'Пропущено' : 'Skipped',
    cancelled: language === 'ru' ? 'Отменено' : 'Cancelled',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{t('nav_tasks')}</h1>
          <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded-full">
            {tasks.length}
          </span>
        </div>
        <Button size="sm" className="rounded-xl">
          <Plus className="w-4 h-4 mr-1" />
          {t('add_task')}
        </Button>
      </div>

      {/* Date selector (placeholder) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {['Сегодня', 'Завтра', 'Пн', 'Вт', 'Ср'].map((day, i) => (
          <button
            key={day}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
              i === 0 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {day}
          </button>
        ))}
        <button className="p-2 rounded-xl bg-muted text-muted-foreground">
          <Calendar className="w-4 h-4" />
        </button>
      </div>

      {/* Tasks List */}
      <div className="space-y-3">
        {tasks.map((task, index) => {
          const child = getChildById(task.childId);
          return (
            <div 
              key={task.id}
              className="bg-card rounded-2xl p-4 shadow-card interactive-card animate-fade-in-up"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="text-2xl flex-shrink-0">{task.icon || '✨'}</div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold truncate">{task.title[language]}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${stateColors[task.state]}`}>
                      {stateLabels[task.state]}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    {child && (
                      <div className="flex items-center gap-1">
                        <ChildAvatar avatar={child.avatar_url || '🦁'} size="sm" />
                        <span>{child.name}</span>
                      </div>
                    )}
                    <CoinBadge amount={task.rewardAmount} size="sm" />
                  </div>
                </div>

                {/* Actions */}
                <Button variant="ghost" size="icon" className="rounded-full flex-shrink-0">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
