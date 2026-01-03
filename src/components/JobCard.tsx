import { Plus, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useApp, JobBoardItem } from '@/contexts/AppContext';
import { CoinBadge } from './ui/CoinBadge';
import { Button } from './ui/button';

interface JobCardProps {
  job: JobBoardItem;
  onTake?: () => void;
  disabled?: boolean;
}

export const JobCard = ({ job, onTake, disabled = false }: JobCardProps) => {
  const { language, t } = useLanguage();
  const { takeJob } = useApp();
  const [isTaken, setIsTaken] = useState(false);

  const title = language === 'ru' ? job.title_ru : job.title_en;
  const description = language === 'ru' ? (job.description_ru || '') : (job.description_en || '');

  const handleTake = () => {
    if (disabled) return;
    takeJob(job.id);
    setIsTaken(true);
    onTake?.();
  };

  return (
    <div 
      className={cn(
        "bg-card-job rounded-2xl p-4 shadow-card interactive-card",
        (isTaken || disabled) && "opacity-60"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="text-3xl flex-shrink-0">
          {job.icon || '💼'}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg">{title}</h3>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {description}
          </p>
          
          <div className="flex items-center justify-between mt-3">
            <CoinBadge amount={job.reward_amount} size="sm" showPlus />
            
            <Button
              size="sm"
              onClick={handleTake}
              disabled={isTaken || disabled}
              className={cn(
                "rounded-xl font-semibold",
                isTaken 
                  ? "bg-success/20 text-success" 
                  : "bg-primary hover:bg-primary/90"
              )}
            >
              {isTaken ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-1" />
                  {t('job_taken')}
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-1" />
                  {t('take_job')}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
