import { BarChart3, TrendingUp, Award } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useApp } from '@/contexts/AppContext';
import { CoinBadge } from '@/components/ui/CoinBadge';
import { ChildAvatar } from '@/components/ui/ChildAvatar';

export const ReportsPage = () => {
  const { t, language } = useLanguage();
  const { children, tasks } = useApp();

  // Mock weekly data
  const weekData = [
    { day: language === 'ru' ? 'Пн' : 'Mon', completed: 8, earned: 45 },
    { day: language === 'ru' ? 'Вт' : 'Tue', completed: 6, earned: 32 },
    { day: language === 'ru' ? 'Ср' : 'Wed', completed: 10, earned: 58 },
    { day: language === 'ru' ? 'Чт' : 'Thu', completed: 7, earned: 40 },
    { day: language === 'ru' ? 'Пт' : 'Fri', completed: 9, earned: 52 },
    { day: language === 'ru' ? 'Сб' : 'Sat', completed: 4, earned: 25 },
    { day: language === 'ru' ? 'Вс' : 'Sun', completed: 3, earned: 18 },
  ];

  const maxCompleted = Math.max(...weekData.map(d => d.completed));
  const totalWeekEarned = weekData.reduce((sum, d) => sum + d.earned, 0);
  const totalWeekCompleted = weekData.reduce((sum, d) => sum + d.completed, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <BarChart3 className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold">{t('nav_reports')}</h1>
      </div>

      {/* Weekly Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card rounded-2xl p-4 shadow-card">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Award className="w-4 h-4" />
            <span className="text-sm">За неделю</span>
          </div>
          <p className="text-3xl font-bold text-primary">{totalWeekCompleted}</p>
          <p className="text-xs text-muted-foreground">задач выполнено</p>
        </div>
        
        <div className="bg-card rounded-2xl p-4 shadow-card">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm">Заработано</span>
          </div>
          <CoinBadge amount={totalWeekEarned} size="lg" />
        </div>
      </div>

      {/* Simple Bar Chart */}
      <div className="bg-card rounded-2xl p-5 shadow-card">
        <h3 className="font-bold mb-4">Выполненные задачи</h3>
        <div className="flex items-end justify-between gap-2 h-32">
          {weekData.map((data, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div 
                className="w-full bg-primary/20 rounded-t-lg relative overflow-hidden transition-all"
                style={{ height: `${(data.completed / maxCompleted) * 100}%`, minHeight: '8px' }}
              >
                <div 
                  className="absolute inset-0 bg-primary rounded-t-lg"
                  style={{ height: `${(data.completed / maxCompleted) * 100}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">{data.day}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Leaderboard */}
      <div className="bg-card rounded-2xl p-5 shadow-card">
        <h3 className="font-bold mb-4">Лидерборд</h3>
        <div className="space-y-3">
          {children.map((child, index) => (
            <div key={child.id} className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-coin/20 flex items-center justify-center text-sm font-bold">
                {index + 1}
              </span>
              <ChildAvatar avatar={child.avatarUrl} size="sm" />
              <span className="flex-1 font-medium">{child.name}</span>
              <CoinBadge amount={child.balance} size="sm" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
