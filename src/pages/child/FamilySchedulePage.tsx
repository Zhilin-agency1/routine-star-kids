import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { JobberCalendar } from '@/components/JobberCalendar';
import { ChildScheduleHeader } from '@/components/ChildScheduleHeader';
import { useChildren } from '@/hooks/useChildren';

type ViewMode = 'day' | 'week' | 'month';

export const FamilySchedulePage = () => {
  const { t } = useLanguage();
  const { children } = useChildren();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('week');

  // Read childId from query params on mount and when params change
  useEffect(() => {
    const childIdParam = searchParams.get('childId');
    if (childIdParam) {
      // Validate that this child exists
      const childExists = children.some(c => c.id === childIdParam);
      if (childExists) {
        setSelectedChildId(childIdParam);
      } else {
        // Invalid childId, clear the param
        setSelectedChildId(null);
        searchParams.delete('childId');
        setSearchParams(searchParams, { replace: true });
      }
    }
  }, [searchParams, children, setSearchParams]);

  // When filter dropdown changes, update URL (optional sync)
  const handleChildChange = (childId: string | null) => {
    setSelectedChildId(childId);
    if (childId) {
      searchParams.set('childId', childId);
    } else {
      searchParams.delete('childId');
    }
    setSearchParams(searchParams, { replace: true });
  };

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

      {/* Child Schedule Header: Selector + 3 Blocks (Routine, Wishlist, Jobs) */}
      <ChildScheduleHeader
        selectedDate={selectedDate}
        selectedChildId={selectedChildId}
        onChildChange={handleChildChange}
        className="mb-4"
      />

      {/* Calendar - no adults, read-only for kids */}
      <div className="flex-1 min-h-0">
        <JobberCalendar
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          selectedChildId={selectedChildId}
          onChildChange={handleChildChange}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          isReadOnly // Family view is read-only (parent uses Tasks page to edit)
          hideAdults // Kids should never see adult activities
          className="h-full"
        />
      </div>
    </div>
  );
};
