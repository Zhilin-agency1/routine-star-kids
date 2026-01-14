import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { JobberCalendar } from '@/components/JobberCalendar';
import { RoutineBlocks } from '@/components/RoutineBlocks';

export const FamilySchedulePage = () => {
  const { t } = useLanguage();
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] md:h-[calc(100vh-80px)] animate-fade-in px-4 md:px-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-secondary/20 flex items-center justify-center shrink-0">
          <Calendar className="w-5 h-5 text-secondary" />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-bold break-words">
            {t('family_schedule')}
          </h1>
          <p className="text-sm text-muted-foreground break-words">
            {t('family_schedule_desc')}
          </p>
        </div>
      </div>

      {/* Routine Blocks */}
      <RoutineBlocks
        selectedDate={selectedDate}
        selectedChildId={selectedChildId}
        className="mb-4"
      />

      {/* Calendar */}
      <div className="flex-1 min-h-0">
        <JobberCalendar
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          selectedChildId={selectedChildId}
          onChildChange={setSelectedChildId}
          isReadOnly // Family view is read-only (parent uses Tasks page to edit)
          className="h-full"
        />
      </div>
    </div>
  );
};
