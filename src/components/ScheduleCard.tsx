import { Clock, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { ActivitySchedule } from '@/contexts/AppContext';

interface ScheduleCardProps {
  activity: ActivitySchedule;
}

const dayLabels = {
  ru: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
};

export const ScheduleCard = ({ activity }: ScheduleCardProps) => {
  const { language } = useLanguage();

  const title = language === 'ru' ? activity.title_ru : activity.title_en;
  const days = (activity.recurring_days || []).map(d => dayLabels[language][d]).join(', ');

  return (
    <div className="bg-card-schedule rounded-2xl p-4 shadow-card interactive-card">
      <div className="flex items-center gap-4">
        {/* Time badge */}
        <div className="flex-shrink-0 bg-primary/10 rounded-xl px-3 py-2 text-center">
          <p className="text-xl font-bold text-primary">{activity.time}</p>
          <p className="text-xs text-muted-foreground">{activity.duration} мин</p>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg">{title}</h3>
          
          <div className="flex flex-wrap gap-2 mt-2">
            {activity.location && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                <MapPin className="w-3 h-3" />
                {activity.location}
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
              <Clock className="w-3 h-3" />
              {days}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
