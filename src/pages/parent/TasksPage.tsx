import { useMemo, useState } from 'react';
import { Calendar, MoreVertical, ClipboardList, Trash2, Edit, ListChecks, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { CoinBadge } from '@/components/ui/CoinBadge';
import { Button } from '@/components/ui/button';
import { ChildAvatar } from '@/components/ui/ChildAvatar';
import { TaskChooserDialog } from '@/components/TaskChooserDialog';
import { AddFromTemplateDialog } from '@/components/AddFromTemplateDialog';
import { EditTaskDialog } from '@/components/EditTaskDialog';
import { StepChecklist, StepProgressBadge } from '@/components/StepChecklist';
import { useChildren } from '@/hooks/useChildren';
import { useTasks } from '@/hooks/useTasks';
import { useAllTodayTasks } from '@/hooks/useAllTodayTasks';
import { useTaskSteps } from '@/hooks/useTaskSteps';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

export const TasksPage = () => {
  const { t, language } = useLanguage();
  const { children } = useChildren();
  const { templates, deleteTemplate } = useTasks();
  const { instances } = useAllTodayTasks();
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<typeof templates[0] | null>(null);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  const getChildById = (id: string) => children.find(c => c.id === id);

  // Normalize instances to task format
  const todayTasks = useMemo(() => {
    return instances.map(instance => ({
      id: instance.id,
      templateId: instance.template_id,
      childId: instance.child_id,
      title: {
        ru: instance.template?.title_ru || '',
        en: instance.template?.title_en || '',
      },
      rewardAmount: instance.template?.reward_amount || 0,
      state: instance.state as 'todo' | 'doing' | 'done' | 'skipped' | 'cancelled',
      icon: instance.template?.icon || '✨',
    }));
  }, [instances]);

  const stateColors = {
    todo: 'bg-muted-foreground/20 text-muted-foreground',
    doing: 'bg-warning/20 text-warning',
    done: 'bg-success/20 text-success',
    skipped: 'bg-muted text-muted-foreground',
    cancelled: 'bg-destructive/20 text-destructive',
  };

  const stateLabels = {
    todo: language === 'ru' ? 'Сделать' : 'To Do',
    doing: language === 'ru' ? 'В процессе' : 'In Progress',
    done: language === 'ru' ? 'Выполнено' : 'Done',
    skipped: language === 'ru' ? 'Пропущено' : 'Skipped',
    cancelled: language === 'ru' ? 'Отменено' : 'Cancelled',
  };

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
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{t('nav_tasks')}</h1>
        </div>
        <div className="flex items-center gap-2">
          <AddFromTemplateDialog 
            trigger={
              <Button variant="outline" size="sm" className="rounded-xl">
                <FileText className="w-4 h-4 mr-1" />
                {language === 'ru' ? 'Из шаблона' : 'From Template'}
              </Button>
            }
          />
          <TaskChooserDialog />
        </div>
      </div>

      <Tabs defaultValue="today" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="today">
            {language === 'ru' ? 'Сегодня' : 'Today'} ({todayTasks.length})
          </TabsTrigger>
          <TabsTrigger value="templates">
            {language === 'ru' ? 'Мои планы' : 'My Plans'} ({templates.length})
          </TabsTrigger>
        </TabsList>

        {/* Today's Tasks */}
        <TabsContent value="today" className="mt-4">
          {todayTasks.length > 0 ? (
            <div className="space-y-3">
              {todayTasks.map((task, index) => {
                const child = getChildById(task.childId);
                const isExpanded = expandedTaskId === task.id;
                return (
                  <div 
                    key={task.id}
                    className="bg-card rounded-2xl p-4 shadow-card interactive-card animate-fade-in-up"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div 
                      className="flex items-start gap-3 cursor-pointer"
                      onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                    >
                      <div className="text-2xl flex-shrink-0">{task.icon || '✨'}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold truncate">{task.title[language]}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${stateColors[task.state]}`}>
                            {stateLabels[task.state]}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          {child && (
                            <div className="flex items-center gap-1">
                              <ChildAvatar avatar={child.avatar_url || '🦁'} size="sm" />
                              <span>{child.name}</span>
                            </div>
                          )}
                          <CoinBadge amount={task.rewardAmount} size="sm" />
                          <StepProgressBadge templateId={task.templateId} instanceId={task.id} />
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="rounded-full flex-shrink-0">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>
                    </div>
                    
                    {/* Expanded step checklist */}
                    {isExpanded && (
                      <StepChecklist 
                        templateId={task.templateId} 
                        instanceId={task.id}
                        isParent
                      />
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-20 h-20 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                <ClipboardList className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {language === 'ru' ? 'Нет задач на сегодня' : 'No tasks for today'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {language === 'ru' ? 'Создайте задачу или дождитесь расписания' : 'Create a task or wait for schedule'}
              </p>
              <TaskChooserDialog />
            </div>
          )}
        </TabsContent>

        {/* Task Templates */}
        <TabsContent value="templates" className="mt-4">
          {templates.length > 0 ? (
            <div className="space-y-3">
              {templates.map((template, index) => {
                const child = template.child_id ? getChildById(template.child_id) : null;
                const recurringDays = template.recurring_days || [];
                
                return (
                  <div 
                    key={template.id}
                    className="bg-card rounded-2xl p-4 shadow-card animate-fade-in-up"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-2xl flex-shrink-0">{template.icon || '✨'}</div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold truncate mb-1">
                          {language === 'ru' ? template.title_ru : template.title_en}
                        </h3>
                        
                        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-2">
                          {child ? (
                            <div className="flex items-center gap-1">
                              <ChildAvatar avatar={child.avatar_url || '🦁'} size="sm" />
                              <span>{child.name}</span>
                            </div>
                          ) : (
                            <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                              {language === 'ru' ? 'Все дети' : 'All children'}
                            </span>
                          )}
                          <CoinBadge amount={template.reward_amount} size="sm" />
                          {template.recurring_time && (
                            <span className="text-xs">
                              🕐 {template.recurring_time.slice(0, 5)}
                              {(template as any).end_time && ` — ${(template as any).end_time.slice(0, 5)}`}
                            </span>
                          )}
                        </div>

                        {/* Task type & days */}
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            template.task_type === 'recurring' 
                              ? 'bg-primary/20 text-primary' 
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {template.task_type === 'recurring' 
                              ? (language === 'ru' ? 'Повтор' : 'Recurring')
                              : (language === 'ru' ? 'Разовая' : 'One-time')}
                          </span>
                          
                          {template.task_type === 'recurring' && recurringDays.length > 0 && (
                            <div className="flex gap-0.5">
                              {dayLabels.map((day, i) => (
                                <span 
                                  key={i}
                                  className={`text-xs w-5 h-5 flex items-center justify-center rounded ${
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
                          
                          {template.task_type === 'one_time' && template.one_time_date && (
                            <span className="text-xs text-muted-foreground">
                              📅 {template.one_time_date}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="rounded-full flex-shrink-0">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover">
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
              <div className="w-20 h-20 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                <ClipboardList className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {language === 'ru' ? 'Нет своих планов' : 'No custom plans'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {language === 'ru' ? 'Создайте свой план' : 'Create your own plan'}
              </p>
              <TaskChooserDialog />
            </div>
          )}
        </TabsContent>
      </Tabs>

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

      {/* Edit Task Dialog - outside dropdown for mobile compatibility */}
      {editingTemplate && (
        <EditTaskDialog 
          template={editingTemplate}
          open={!!editingTemplate}
          onOpenChange={(open) => !open && setEditingTemplate(null)}
          onSuccess={() => setEditingTemplate(null)}
        />
      )}
    </div>
  );
};
