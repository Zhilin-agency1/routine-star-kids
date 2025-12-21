import { Briefcase, Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useApp } from '@/contexts/AppContext';
import { JobCard } from '@/components/JobCard';
import { ChildAvatar } from '@/components/ui/ChildAvatar';
import { cn } from '@/lib/utils';

export const FamilyJobBoardPage = () => {
  const { language } = useLanguage();
  const { jobBoardItems, children, currentChild, setCurrentChild, setViewMode } = useApp();

  const activeJobs = jobBoardItems.filter(job => job.active);

  const handleSelectChild = (childId: string) => {
    const child = children.find(c => c.id === childId);
    if (child) {
      setCurrentChild(child);
      setViewMode('personal');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-card-job flex items-center justify-center">
          <Briefcase className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">
            {language === 'ru' ? 'Биржа' : 'Job Board'}
          </h1>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            {language === 'ru' ? 'Выбери себя, чтобы взять задание' : 'Select yourself to take a job'}
          </p>
        </div>
      </div>

      {/* Child Selector - Avatar Switches */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2 -mx-4 px-4">
        {children.map(child => (
          <button
            key={child.id}
            onClick={() => handleSelectChild(child.id)}
            className={cn(
              'flex flex-col items-center gap-1 p-2 rounded-xl transition-all min-w-[72px]',
              currentChild?.id === child.id 
                ? 'bg-primary/10 ring-2 ring-primary' 
                : 'hover:bg-muted'
            )}
          >
            <ChildAvatar avatar={child.avatar_url || '🦁'} size="md" />
            <span className={cn(
              'text-xs font-medium truncate max-w-[60px]',
              currentChild?.id === child.id && 'text-primary'
            )}>
              {child.name}
            </span>
          </button>
        ))}
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
