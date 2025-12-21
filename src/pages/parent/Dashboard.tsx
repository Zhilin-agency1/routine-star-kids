import { useMemo } from 'react';
import { TrendingUp, CheckCircle, Users } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useApp } from '@/contexts/AppContext';
import { ChildAvatar } from '@/components/ui/ChildAvatar';
import { CoinBadge } from '@/components/ui/CoinBadge';
import { Progress } from '@/components/ui/progress';

export const ParentDashboard = () => {
  const { t } = useLanguage();
  const { children, tasks } = useApp();

  const childStats = useMemo(() => {
    return children.map(child => {
      const childTasks = tasks.filter(task => task.childId === child.id);
      const completedToday = childTasks.filter(t => t.state === 'done').length;
      const totalToday = childTasks.length;
      const earnedToday = childTasks
        .filter(t => t.rewardGranted)
        .reduce((sum, t) => sum + t.rewardAmount, 0);
      
      return {
        child,
        completedToday,
        totalToday,
        earnedToday,
        progress: totalToday > 0 ? (completedToday / totalToday) * 100 : 0,
      };
    });
  }, [children, tasks]);

  const totalCompleted = childStats.reduce((sum, s) => sum + s.completedToday, 0);
  const totalEarned = childStats.reduce((sum, s) => sum + s.earnedToday, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{t('dashboard_title')}</h1>
        <p className="text-muted-foreground">{t('today')}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card rounded-2xl p-4 shadow-card">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm">{t('tasks_completed_today')}</span>
          </div>
          <p className="text-3xl font-bold text-success">{totalCompleted}</p>
        </div>
        
        <div className="bg-card rounded-2xl p-4 shadow-card">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm">{t('earned_today')}</span>
          </div>
          <CoinBadge amount={totalEarned} size="lg" />
        </div>
      </div>

      {/* Children Overview */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-primary" />
          <h2 className="font-bold text-lg">{t('nav_children')}</h2>
        </div>

        <div className="space-y-4">
          {childStats.map(({ child, completedToday, totalToday, earnedToday, progress }, index) => (
            <div 
              key={child.id}
              className="bg-card rounded-2xl p-4 shadow-card interactive-card animate-fade-in-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center gap-4">
                <ChildAvatar avatar={child.avatarUrl} name={child.name} size="lg" showName />
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">
                      {completedToday} / {totalToday} задач
                    </span>
                    <CoinBadge amount={child.balance} size="sm" />
                  </div>
                  
                  <Progress value={progress} className="h-2 mb-1" />
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{Math.round(progress)}% выполнено</span>
                    <span className="text-success">+{earnedToday} сегодня</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Actions */}
      <section className="grid grid-cols-2 gap-3">
        <button className="bg-primary/10 hover:bg-primary/20 text-primary rounded-2xl p-4 text-center transition-colors">
          <span className="text-2xl block mb-1">➕</span>
          <span className="text-sm font-semibold">{t('add_task')}</span>
        </button>
        <button className="bg-secondary/10 hover:bg-secondary/20 text-secondary rounded-2xl p-4 text-center transition-colors">
          <span className="text-2xl block mb-1">🎁</span>
          <span className="text-sm font-semibold">{t('add_store_item')}</span>
        </button>
      </section>
    </div>
  );
};
