import { Briefcase, Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useApp } from '@/contexts/AppContext';
import { JobCard } from '@/components/JobCard';

export const JobBoardPage = () => {
  const { t } = useLanguage();
  const { jobBoardItems } = useApp();

  const activeJobs = jobBoardItems.filter(job => job.active);

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

      {/* Jobs List */}
      <div className="space-y-4">
        {activeJobs.map((job, index) => (
          <div 
            key={job.id}
            className="animate-fade-in-up"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <JobCard job={job} />
          </div>
        ))}
      </div>

      {/* Empty state */}
      {activeJobs.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">💼</div>
          <p className="text-muted-foreground">Нет доступных заданий</p>
        </div>
      )}
    </div>
  );
};
