import { useState } from 'react';
import { ClipboardList, MoreVertical, Trash2, Edit, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { CoinBadge } from '@/components/ui/CoinBadge';
import { Button } from '@/components/ui/button';
import { ChildAvatar } from '@/components/ui/ChildAvatar';
import { EditTaskDialog } from '@/components/EditTaskDialog';
import { useChildren } from '@/hooks/useChildren';
import { useTasks } from '@/hooks/useTasks';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

interface MyPlansSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MyPlansSheet = ({ open, onOpenChange }: MyPlansSheetProps) => {
  const { language } = useLanguage();
  const { children } = useChildren();
  const { templates, deleteTemplate } = useTasks();
  
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<typeof templates[0] | null>(null);

  const getChildById = (id: string) => children.find(c => c.id === id);

  const dayLabels = language === 'ru' 
    ? ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const handleDeleteTemplate = async () => {
    if (!deletingTemplateId) return;
    try {
      await deleteTemplate.mutateAsync(deletingTemplateId);
      toast.success(language === 'ru' ? 'План удалён' : 'Plan deleted');
      setDeletingTemplateId(null);
    } catch (error) {
      toast.error(language === 'ru' ? 'Ошибка при удалении' : 'Failed to delete');
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5" />
              {language === 'ru' ? 'Мои планы' : 'My Plans'}
              <span className="text-sm font-normal text-muted-foreground">
                ({templates.length})
              </span>
            </SheetTitle>
          </SheetHeader>

          {templates.length > 0 ? (
            <div className="space-y-3">
              {templates.map((template, index) => {
                const child = template.child_id ? getChildById(template.child_id) : null;
                const recurringDays = template.recurring_days || [];
                
                return (
                  <div 
                    key={template.id}
                    className="bg-card rounded-xl p-3 border shadow-sm animate-fade-in-up"
                    style={{ animationDelay: `${index * 0.03}s` }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-2xl flex-shrink-0">{template.icon || '✨'}</div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm truncate mb-1">
                          {language === 'ru' ? template.title_ru : template.title_en}
                        </h3>
                        
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-2">
                          {child ? (
                            <div className="flex items-center gap-1">
                              <ChildAvatar avatar={child.avatar_url || '🦁'} size="xs" />
                              <span>{child.name}</span>
                            </div>
                          ) : (
                            <span className="bg-muted px-1.5 py-0.5 rounded-full text-[10px]">
                              {language === 'ru' ? 'Все' : 'All'}
                            </span>
                          )}
                          <CoinBadge amount={template.reward_amount} size="xs" />
                          {template.recurring_time && (
                            <span className="text-[10px]">
                              🕐 {template.recurring_time.slice(0, 5)}
                            </span>
                          )}
                        </div>

                        {/* Task type & days */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                            template.task_type === 'recurring' 
                              ? 'bg-primary/20 text-primary' 
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {template.task_type === 'recurring' 
                              ? (language === 'ru' ? 'Повтор' : 'Recurring')
                              : (language === 'ru' ? 'Разовая' : 'One-time')}
                          </span>
                          
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                            template.task_category === 'routine' 
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' 
                              : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                          }`}>
                            {template.task_category === 'routine' 
                              ? (language === 'ru' ? 'Рутина' : 'Routine')
                              : (language === 'ru' ? 'Занятие' : 'Activity')}
                          </span>
                          
                          {template.task_type === 'recurring' && recurringDays.length > 0 && (
                            <div className="flex gap-0.5">
                              {dayLabels.map((day, i) => (
                                <span 
                                  key={i}
                                  className={`text-[9px] w-4 h-4 flex items-center justify-center rounded ${
                                    recurringDays.includes(i) 
                                      ? 'bg-primary text-primary-foreground' 
                                      : 'bg-muted/50 text-muted-foreground'
                                  }`}
                                >
                                  {day.charAt(0)}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            className="cursor-pointer"
                            onClick={() => setEditingTemplate(template)}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            {language === 'ru' ? 'Редактировать' : 'Edit'}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive cursor-pointer"
                            onClick={() => setDeletingTemplateId(template.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            {language === 'ru' ? 'Удалить' : 'Delete'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                <ClipboardList className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {language === 'ru' ? 'Нет своих планов' : 'No custom plans'}
              </h3>
              <p className="text-muted-foreground text-sm">
                {language === 'ru' ? 'Создайте свой план' : 'Create your own plan'}
              </p>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingTemplateId} onOpenChange={(open) => !open && setDeletingTemplateId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === 'ru' ? 'Удалить план?' : 'Delete plan?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'ru' 
                ? 'Все связанные задачи будут также удалены. Это действие нельзя отменить.'
                : 'All related task instances will also be deleted. This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {language === 'ru' ? 'Отмена' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteTemplate}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {language === 'ru' ? 'Удалить' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Task Dialog */}
      {editingTemplate && (
        <EditTaskDialog 
          template={editingTemplate}
          open={!!editingTemplate}
          onOpenChange={(open) => !open && setEditingTemplate(null)}
          onSuccess={() => setEditingTemplate(null)}
        />
      )}
    </>
  );
};
