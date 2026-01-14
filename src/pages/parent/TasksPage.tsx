import { useState } from 'react';
import { Calendar, FileText, ClipboardList, Plus } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { TaskChooserDialog } from '@/components/TaskChooserDialog';
import { AddFromTemplateDialog } from '@/components/AddFromTemplateDialog';
import { JobberCalendar } from '@/components/JobberCalendar';
import { RoutineBlocks } from '@/components/RoutineBlocks';
import { MyPlansSheet } from '@/components/MyPlansSheet';

export const TasksPage = () => {
  const { t, language } = useLanguage();
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [myPlansOpen, setMyPlansOpen] = useState(false);

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
          {/* My Plans button */}
          <Button 
            variant="outline" 
            size="sm" 
            className="rounded-xl gap-1"
            onClick={() => setMyPlansOpen(true)}
          >
            <ClipboardList className="w-4 h-4" />
            {language === 'ru' ? 'Мои планы' : 'My Plans'}
          </Button>
          
          {/* From Template */}
          <AddFromTemplateDialog 
            trigger={
              <Button variant="outline" size="sm" className="rounded-xl gap-1">
                <FileText className="w-4 h-4" />
                {language === 'ru' ? 'Из шаблона' : 'From Template'}
              </Button>
            }
          />
          
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
        className="mb-4"
      />

      {/* Full-screen Calendar */}
      <div className="flex-1 min-h-0">
        <JobberCalendar
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          selectedChildId={selectedChildId}
          onChildChange={setSelectedChildId}
          className="h-full"
        />
      </div>

      {/* My Plans Sheet */}
      <MyPlansSheet 
        open={myPlansOpen} 
        onOpenChange={setMyPlansOpen} 
      />
    </div>
  );
};
