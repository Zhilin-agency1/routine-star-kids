import { Calendar } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useApp } from '@/contexts/AppContext';
import { ScheduleCard } from '@/components/ScheduleCard';

export const SchedulePage = () => {
  const { t } = useLanguage();
  const { activities, currentChild } = useApp();

  const childActivities = activities.filter(a => a.childId === currentChild?.id);

  // Group by days
  const today = new Date().getDay();
  const todayActivities = childActivities.filter(a => a.days.includes(today));
  const otherActivities = childActivities.filter(a => !a.days.includes(today));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-card-schedule flex items-center justify-center">
          <Calendar className="w-6 h-6 text-success" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{t('schedule_title')}</h1>
          <p className="text-sm text-muted-foreground">{t('today')}</p>
        </div>
      </div>

      {/* Today's activities */}
      {todayActivities.length > 0 && (
        <section>
          <h2 className="font-bold text-lg mb-3 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            {t('today')}
          </h2>
          <div className="space-y-3">
            {todayActivities.map((activity, index) => (
              <div 
                key={activity.id}
                className="animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <ScheduleCard activity={activity} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Other activities */}
      {otherActivities.length > 0 && (
        <section>
          <h2 className="font-bold text-lg mb-3 text-muted-foreground">
            Другие занятия
          </h2>
          <div className="space-y-3 opacity-75">
            {otherActivities.map((activity) => (
              <ScheduleCard key={activity.id} activity={activity} />
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {childActivities.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📅</div>
          <p className="text-muted-foreground">{t('no_activities')}</p>
        </div>
      )}
    </div>
  );
};
