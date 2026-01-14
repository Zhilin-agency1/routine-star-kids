import { Pencil, Copy, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { type ActivitySchedule } from '@/hooks/useSchedule';

interface ActivityActionSheetProps {
  activity: ActivitySchedule | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
  onCopy: () => void;
  onDelete: () => void;
}

export const ActivityActionSheet = ({
  activity,
  open,
  onOpenChange,
  onEdit,
  onCopy,
  onDelete,
}: ActivityActionSheetProps) => {
  const { language } = useLanguage();

  if (!activity) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center truncate px-4">
            {language === 'ru' ? activity.title_ru : activity.title_en}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <Button
            variant="outline"
            className="w-full justify-start gap-3 h-12"
            onClick={() => {
              onOpenChange(false);
              onEdit();
            }}
          >
            <Pencil className="w-5 h-5" />
            {language === 'ru' ? 'Редактировать' : 'Edit'}
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start gap-3 h-12"
            onClick={() => {
              onOpenChange(false);
              onCopy();
            }}
          >
            <Copy className="w-5 h-5" />
            {language === 'ru' ? 'Копировать' : 'Copy'}
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start gap-3 h-12 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => {
              onOpenChange(false);
              onDelete();
            }}
          >
            <Trash2 className="w-5 h-5" />
            {language === 'ru' ? 'Удалить' : 'Delete'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
