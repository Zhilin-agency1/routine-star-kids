import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useApp } from '@/contexts/AppContext';
import { JobberCalendar } from '@/components/JobberCalendar';
import { RoutineBlocks } from '@/components/RoutineBlocks';

type ViewMode = 'day' | 'week' | 'month';

export const SchedulePage = () => {
  const { t } = useLanguage();
  const { currentChild } = useApp();
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('week');

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] md:h-[calc(100vh-80px)] animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-secondary/20 flex items-center justify-center">
          <Calendar className="w-5 h-5 text-secondary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">{t('schedule_title')}</h1>
          <p className="text-sm text-muted-foreground">{t('today')}</p>
        </div>
      </div>

      {/* Routine Blocks */}
      <RoutineBlocks
        selectedDate={selectedDate}
        selectedChildId={currentChild?.id || null}
        viewMode={viewMode}
        className="mb-4"
      />

      {/* Calendar - read only for child */}
      <div className="flex-1 min-h-0">
        <JobberCalendar
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          selectedChildId={currentChild?.id || null}
          onChildChange={() => {}} // Child can't change filter
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          isReadOnly // Children can't add/edit
          className="h-full"
        />
      </div>
    </div>
  );
};
