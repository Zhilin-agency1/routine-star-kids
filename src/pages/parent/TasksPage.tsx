import { useState } from 'react';
import { Calendar, Plus } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { TaskChooserDialog } from '@/components/TaskChooserDialog';
import { JobberCalendar } from '@/components/JobberCalendar';
import { RoutineBlocks } from '@/components/RoutineBlocks';
import { EditTaskDialog } from '@/components/EditTaskDialog';
import { useTasks } from '@/hooks/useTasks';

type ViewMode = 'day' | 'week' | 'month';

export const TasksPage = () => {
  const { t, language } = useLanguage();
  const { templates } = useTasks();
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);

  // Find the template being edited
  const editingTemplate = editingTemplateId 
    ? templates.find(t => t.id === editingTemplateId) 
    : null;

  const handleEditRoutine = (templateId: string) => {
    setEditingTemplateId(templateId);
  };

  const handleCopyRoutine = (templateId: string) => {
    // Open the copied routine in edit mode
    setEditingTemplateId(templateId);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] md:h-[calc(100vh-80px)] animate-fade-in">
      {/* Header with action buttons */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-xl font-bold">{t('nav_tasks')}</h1>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Add Task */}
          <TaskChooserDialog 
            trigger={
              <Button size="sm" className="rounded-xl gap-1">
                <Plus className="w-4 h-4" />
                {language === 'ru' ? 'Добавить' : 'Add'}
              </Button>
            }
          />
        </div>
      </div>

      {/* Routine Blocks (Morning/Evening) */}
      <RoutineBlocks
        selectedDate={selectedDate}
        selectedChildId={selectedChildId}
        viewMode={viewMode}
        onEditRoutine={handleEditRoutine}
        onCopyRoutine={handleCopyRoutine}
        className="mb-4"
      />

      {/* Full-screen Calendar */}
      <div className="flex-1 min-h-0">
        <JobberCalendar
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          selectedChildId={selectedChildId}
          onChildChange={setSelectedChildId}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          className="h-full"
        />
      </div>

      {/* Edit Routine/Task Dialog */}
      {editingTemplate && (
        <EditTaskDialog
          template={editingTemplate}
          open={!!editingTemplateId}
          onOpenChange={(open) => !open && setEditingTemplateId(null)}
        />
      )}
    </div>
  );
};
