import { Briefcase, Sparkles, Check } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useApp } from '@/contexts/AppContext';
import { JobCard } from '@/components/JobCard';
import { ChildAvatar } from '@/components/ui/ChildAvatar';
import { CoinBadge } from '@/components/ui/CoinBadge';
import { cn } from '@/lib/utils';

export const FamilyJobBoardPage = () => {
  const { language } = useLanguage();
  const { jobBoardItems, children, currentChild, setCurrentChild } = useApp();

  // Filter jobs: active + (assigned to this child OR assigned to all children)
  const activeJobs = jobBoardItems.filter(job => 
    job.active && 
    (job.child_id === null || job.child_id === currentChild?.id)
  );

  const handleSelectChild = (childId: string) => {
    const child = children.find(c => c.id === childId);
    if (child) {
      setCurrentChild(child);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header with integrated child selector */}
      <div className="bg-card rounded-2xl p-4 shadow-soft space-y-4">
        {/* Title row */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-card-job flex items-center justify-center shrink-0">
            <Briefcase className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold leading-tight">
              {language === 'ru' ? 'Биржа' : 'Job Board'}
            </h1>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              {language === 'ru' ? 'Выбери себя, чтобы взять задание' : 'Select yourself to take a job'}
            </p>
          </div>
        </div>

        {/* Child Selector - directly under title */}
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {children.map(child => {
            const isActive = currentChild?.id === child.id;
            return (
              <button
                key={child.id}
                onClick={() => handleSelectChild(child.id)}
                className={cn(
                  'relative flex flex-col items-center gap-1.5 p-2.5 rounded-xl transition-all duration-200',
                  'min-w-[76px] sm:min-w-[84px]',
                  isActive 
                    ? 'bg-primary/15 ring-2 ring-primary shadow-md scale-[1.02]' 
                    : 'bg-muted/50 hover:bg-muted active:scale-95'
                )}
              >
                {/* Active checkmark badge */}
                {isActive && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-sm">
                    <Check className="w-3 h-3 text-primary-foreground" strokeWidth={3} />
                  </div>
                )}
                
                <div className={cn(
                  'rounded-full transition-all',
                  isActive && 'ring-2 ring-primary/30 ring-offset-2 ring-offset-card'
                )}>
                  <ChildAvatar avatar={child.avatar_url || '🦁'} size="sm" />
                </div>
                
                <span className={cn(
                  'text-xs font-semibold truncate max-w-[64px] sm:max-w-[72px] text-center leading-tight',
                  isActive ? 'text-primary' : 'text-foreground/70'
                )}>
                  {child.name}
                </span>
                
                {/* Mini wallet balance */}
                <CoinBadge amount={child.balance ?? 0} size="xs" className="mt-0.5" />
              </button>
            );
          })}
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
          <p className="text-muted-foreground">
            {language === 'ru' ? 'Нет доступных заданий' : 'No available jobs'}
          </p>
        </div>
      )}
    </div>
  );
};
