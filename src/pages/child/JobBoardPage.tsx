import { Briefcase, Sparkles, Target, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useApp } from '@/contexts/AppContext';
import { JobCard } from '@/components/JobCard';
import { Button } from '@/components/ui/button';

export const JobBoardPage = () => {
  const { t, language } = useLanguage();
  const { jobBoardItems, tasks, currentChild } = useApp();
  const navigate = useNavigate();

  const activeJobs = jobBoardItems.filter(job => job.active);
  
  // Check if child has unfinished tasks today
  const childTasks = tasks.filter(task => task.childId === currentChild?.id);
  const pendingTasks = childTasks.filter(t => t.state !== 'done');
  const hasPendingTasks = pendingTasks.length > 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-card-job flex items-center justify-center">
          <Briefcase className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{t('job_board_title')}</h1>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            {t('extra_tasks')}
          </p>
        </div>
      </div>

      {/* Guardrail: Finish daily tasks first */}
      {hasPendingTasks && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-foreground">
                {language === 'ru' ? 'Сначала закончи план на сегодня' : 'Finish today\'s plan first'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {language === 'ru' 
                  ? `Осталось ${pendingTasks.length} ${pendingTasks.length === 1 ? 'задание' : 'заданий'}` 
                  : `${pendingTasks.length} task${pendingTasks.length === 1 ? '' : 's'} remaining`}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/')}
                className="mt-3 min-h-[44px]"
              >
                <Target className="w-4 h-4 mr-2" />
                {language === 'ru' ? 'Открыть задания' : 'Open Today'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Jobs List */}
      <div className="space-y-4">
        {activeJobs.map((job, index) => (
          <div 
            key={job.id}
            className="animate-fade-in-up"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <JobCard job={job} disabled={hasPendingTasks} />
          </div>
        ))}
      </div>

      {/* Empty state */}
      {activeJobs.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">💼</div>
          <p className="text-muted-foreground">
            {language === 'ru' ? 'Нет доступных заданий' : 'No jobs available'}
          </p>
        </div>
      )}
    </div>
  );
};
