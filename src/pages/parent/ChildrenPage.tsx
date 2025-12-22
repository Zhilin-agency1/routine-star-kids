import { useState } from 'react';
import { Settings, Users, Calendar, Clock } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useApp } from '@/contexts/AppContext';
import { ChildAvatar } from '@/components/ui/ChildAvatar';
import { CoinBadge } from '@/components/ui/CoinBadge';
import { Button } from '@/components/ui/button';
import { AddChildDialog } from '@/components/AddChildDialog';
import { EditChildProfileDialog } from '@/components/EditChildProfileDialog';
import { Progress } from '@/components/ui/progress';
import { useTasks } from '@/hooks/useTasks';
import { differenceInDays, parseISO, format } from 'date-fns';
import type { Child } from '@/hooks/useChildren';

export const ChildrenPage = () => {
  const { t, language } = useLanguage();
  const { children } = useApp();
  const { templates } = useTasks();
  const [editingChild, setEditingChild] = useState<Child | null>(null);

  // Get multi-day tasks (tasks with end_date set and spanning multiple days)
  const getChildLongRunningTasks = (childId: string) => {
    const today = new Date();
    return templates.filter(template => {
      const isForChild = !template.child_id || template.child_id === childId;
      const hasEndDate = !!template.end_date;
      const startDate = parseISO(template.start_date);
      const endDate = template.end_date ? parseISO(template.end_date) : null;
      
      if (!isForChild || !hasEndDate || !endDate) return false;
      
      // Check if task spans multiple days and is active
      const daysSpan = differenceInDays(endDate, startDate);
      const isActive = today >= startDate && today <= endDate;
      
      return daysSpan > 1 && isActive;
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('nav_children')}</h1>
        <AddChildDialog />
      </div>

      {/* Children List */}
      {children.length > 0 ? (
        <div className="space-y-4">
          {children.map((child, index) => {
            const longRunningTasks = getChildLongRunningTasks(child.id);
            
            return (
              <div 
                key={child.id}
                className="bg-card rounded-2xl p-5 shadow-card interactive-card animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center gap-4">
                  <ChildAvatar avatar={child.avatar_url || '🦁'} size="xl" />
                  
                  <div className="flex-1">
                    <h3 className="text-xl font-bold">{child.name}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <CoinBadge amount={child.balance} size="md" />
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                        {child.language_preference === 'ru' ? '🇷🇺 RU' : '🇬🇧 EN'}
                      </span>
                    </div>
                  </div>

                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="rounded-full"
                    onClick={() => setEditingChild(child as Child)}
                  >
                    <Settings className="w-5 h-5" />
                  </Button>
                </div>

                {/* Long-running tasks section */}
                {longRunningTasks.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <p className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {language === 'ru' ? 'Долгосрочные задачи' : 'Long-term tasks'}
                    </p>
                    <div className="space-y-3">
                      {longRunningTasks.map(task => {
                        const startDate = parseISO(task.start_date);
                        const endDate = task.end_date ? parseISO(task.end_date) : new Date();
                        const today = new Date();
                        
                        const totalDays = differenceInDays(endDate, startDate) + 1;
                        const daysPassed = Math.max(0, differenceInDays(today, startDate) + 1);
                        const daysRemaining = Math.max(0, differenceInDays(endDate, today));
                        const progressPercent = Math.min(100, Math.round((daysPassed / totalDays) * 100));
                        
                        return (
                          <div key={task.id} className="bg-muted/50 rounded-xl p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-lg">{task.icon}</span>
                              <span className="font-medium text-sm flex-1">
                                {language === 'ru' ? task.title_ru : task.title_en}
                              </span>
                              <CoinBadge amount={task.reward_amount} size="sm" />
                            </div>
                            <Progress value={progressPercent} className="h-2 mb-2" />
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {language === 'ru' 
                                  ? `Осталось ${daysRemaining} дн.`
                                  : `${daysRemaining} days left`}
                              </span>
                              <span>
                                {format(endDate, 'dd.MM.yyyy')}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-20 h-20 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
            <Users className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">{language === 'ru' ? 'Пока нет детей' : 'No children yet'}</h3>
          <p className="text-muted-foreground mb-4">{language === 'ru' ? 'Добавьте первого ребёнка, чтобы начать' : 'Add your first child to get started'}</p>
          <AddChildDialog />
        </div>
      )}

      {/* Edit Child Dialog */}
      {editingChild && (
        <EditChildProfileDialog
          child={editingChild}
          open={!!editingChild}
          onOpenChange={(open) => !open && setEditingChild(null)}
        />
      )}
    </div>
  );
};
