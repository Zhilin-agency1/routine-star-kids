import { useState } from 'react';
import { Briefcase, Edit, Trash2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { CoinBadge } from '@/components/ui/CoinBadge';
import { Button } from '@/components/ui/button';
import { AddJobDialog } from '@/components/AddJobDialog';
import { useJobBoard, type JobBoardItem } from '@/hooks/useJobBoard';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

export const ParentJobBoardPage = () => {
  const { language } = useLanguage();
  const { jobs, deleteJob } = useJobBoard();
  const [deletingJob, setDeletingJob] = useState<JobBoardItem | null>(null);

  const handleDelete = async () => {
    if (!deletingJob) return;
    
    try {
      await deleteJob.mutateAsync(deletingJob.id);
      toast.success(language === 'ru' ? 'Работа удалена' : 'Job deleted');
      setDeletingJob(null);
    } catch (error) {
      toast.error(language === 'ru' ? 'Ошибка при удалении' : 'Failed to delete');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Briefcase className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">
            {language === 'ru' ? 'Доска объявлений' : 'Job Board'}
          </h1>
        </div>
        <AddJobDialog />
      </div>

      {/* Jobs List */}
      <div className="space-y-3">
        {jobs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-4xl mb-2">💼</p>
            <p>{language === 'ru' ? 'Нет работ на доске' : 'No jobs on the board'}</p>
            <p className="text-sm mb-4">
              {language === 'ru' ? 'Добавьте первую работу' : 'Add your first job'}
            </p>
            <AddJobDialog />
          </div>
        ) : (
          jobs.map((job, index) => (
            <div 
              key={job.id}
              className="bg-card rounded-2xl p-4 shadow-card interactive-card animate-fade-in-up"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="text-4xl flex-shrink-0">{job.icon || '💼'}</div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold">
                    {language === 'ru' ? job.title_ru : job.title_en}
                  </h3>
                  {(job.description_ru || job.description_en) && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {language === 'ru' ? job.description_ru : job.description_en}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <CoinBadge amount={job.reward_amount} size="sm" />
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      job.active 
                        ? 'bg-success/20 text-success' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {job.active 
                        ? (language === 'ru' ? 'Активна' : 'Active') 
                        : (language === 'ru' ? 'Скрыта' : 'Hidden')}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-1 flex-shrink-0">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="rounded-full text-destructive"
                    onClick={() => setDeletingJob(job)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingJob} onOpenChange={(open) => !open && setDeletingJob(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === 'ru' ? 'Удалить работу?' : 'Delete job?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'ru' 
                ? `Вы уверены, что хотите удалить "${deletingJob?.title_ru}"? Это действие нельзя отменить.`
                : `Are you sure you want to delete "${deletingJob?.title_en}"? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {language === 'ru' ? 'Отмена' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {language === 'ru' ? 'Удалить' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
