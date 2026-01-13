import { useMemo, useState, useEffect } from 'react';
import { TrendingUp, CheckCircle, Undo2, MapPin, Award, Calendar, ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useChildren } from '@/hooks/useChildren';
import { useAllTodayTasks } from '@/hooks/useAllTodayTasks';
import { useTasks } from '@/hooks/useTasks';
import { useSchedule } from '@/hooks/useSchedule';
import { useTransactions } from '@/hooks/useTransactions';
import { useFamily } from '@/hooks/useFamily';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { ChildAvatar } from '@/components/ui/ChildAvatar';
import { CoinBadge } from '@/components/ui/CoinBadge';
import { TaskChooserDialog } from '@/components/TaskChooserDialog';
import { AddChildDialog } from '@/components/AddChildDialog';
import { ParentOnboardingDialog } from '@/components/ParentOnboardingDialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface DashboardTask {
  id: string;
  templateId: string;
  childId: string;
  title: { ru: string; en: string };
  rewardAmount: number;
  state: 'todo' | 'doing' | 'done' | 'skipped' | 'cancelled';
  icon: string;
  rewardGranted: boolean;
  dueTime: string | null;
  isActivity?: boolean;
  location?: string | null;
}

export const ParentDashboard = () => {
  const { t, language } = useLanguage();
  const { children } = useChildren();
  const { instances } = useAllTodayTasks();
  const { completeTask, uncompleteTask, updateInstanceState } = useTasks();
  const { todayActivities } = useSchedule();
  const { family } = useFamily();
  const [selectedChildId, setSelectedChildId] = useState<string>('all');
  const { transactions } = useTransactions(selectedChildId === 'all' ? undefined : selectedChildId, 100);

  const dateLocale = language === 'ru' ? ru : enUS;

  // Onboarding state
  const ONBOARDING_KEY = 'kids_routine_parent_onboarding_completed';
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem(ONBOARDING_KEY);
    if (!completed) {
      const timer = setTimeout(() => setShowOnboarding(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleOnboardingComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setShowOnboarding(false);
  };

  // Fetch all task instances for weekly stats
  const { data: allInstances = [] } = useQuery({
    queryKey: ['all_task_instances', family?.id],
    queryFn: async () => {
      if (!family) return [];
      
      const sevenDaysAgo = subDays(new Date(), 7);
      
      const { data, error } = await supabase
        .from('task_instances')
        .select(`
          *,
          template:task_templates(*)
        `)
        .gte('due_datetime', sevenDaysAgo.toISOString())
        .order('due_datetime', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!family,
  });

  // Normalize instances to task format
  const tasks = useMemo(() => {
    const taskList: DashboardTask[] = instances.map(instance => ({
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
      rewardGranted: instance.reward_granted,
      dueTime: instance.template?.recurring_time || null,
      isActivity: false,
    }));

    // Add today's activities as read-only items
    todayActivities.forEach(activity => {
      taskList.push({
        id: `activity-${activity.id}`,
        templateId: activity.id,
        childId: activity.child_id,
        title: {
          ru: activity.title_ru,
          en: activity.title_en,
        },
        rewardAmount: 0,
        state: 'todo',
        icon: '📅',
        rewardGranted: false,
        dueTime: activity.time,
        isActivity: true,
        location: activity.location,
      });
    });

    return taskList;
  }, [instances, todayActivities]);

  // Group tasks by child
  const childColumns = useMemo(() => {
    return children.map(child => {
      const childTasks = tasks.filter(task => task.childId === child.id);
      const todo = childTasks.filter(t => t.state === 'todo');
      const doing = childTasks.filter(t => t.state === 'doing');
      const done = childTasks.filter(t => t.state === 'done');
      const completedCount = done.length;
      const totalCount = childTasks.length;
      const earnedToday = done
        .filter(t => t.rewardGranted)
        .reduce((sum, t) => sum + t.rewardAmount, 0);

      return {
        child,
        tasks: [...doing, ...todo, ...done],
        todo,
        doing,
        done,
        completedCount,
        totalCount,
        earnedToday,
        progress: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
      };
    });
  }, [children, tasks]);

  const totalCompleted = childColumns.reduce((sum, c) => sum + c.completedCount, 0);
  const totalEarned = childColumns.reduce((sum, c) => sum + c.earnedToday, 0);

  // Calculate weekly stats for reports section
  const weeklyStats = useMemo(() => {
    const days = [];
    const dayNames = language === 'ru' 
      ? ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
      : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);
      
      const dayInstances = allInstances.filter((inst: any) => {
        const instDate = new Date(inst.due_datetime);
        const matchesChild = selectedChildId === 'all' || inst.child_id === selectedChildId;
        return instDate >= dayStart && instDate <= dayEnd && matchesChild;
      });
      
      const completed = dayInstances.filter((inst: any) => inst.state === 'done').length;
      const earned = dayInstances
        .filter((inst: any) => inst.state === 'done' && inst.reward_granted)
        .reduce((sum: number, inst: any) => sum + (inst.template?.reward_amount || 0), 0);
      
      const dayIndex = (date.getDay() + 6) % 7;
      
      days.push({
        day: dayNames[dayIndex],
        date: format(date, 'd MMM', { locale: dateLocale }),
        completed,
        earned,
        total: dayInstances.length,
      });
    }
    
    return days;
  }, [allInstances, selectedChildId, language, dateLocale]);

  const totalWeekCompleted = weeklyStats.reduce((sum, d) => sum + d.completed, 0);
  const totalWeekEarned = weeklyStats.reduce((sum, d) => sum + d.earned, 0);
  const totalWeekTasks = weeklyStats.reduce((sum, d) => sum + d.total, 0);
  const completionRate = totalWeekTasks > 0 ? Math.round((totalWeekCompleted / totalWeekTasks) * 100) : 0;
  const maxCompleted = Math.max(...weeklyStats.map(d => d.completed), 1);

  // Filter transactions for display
  const filteredTransactions = useMemo(() => {
    return transactions.slice(0, 20);
  }, [transactions]);

  // Child stats for leaderboard
  const childStats = useMemo(() => {
    return children.map(child => {
      const childInstances = allInstances.filter((inst: any) => inst.child_id === child.id);
      const completed = childInstances.filter((inst: any) => inst.state === 'done').length;
      const total = childInstances.length;
      const earned = childInstances
        .filter((inst: any) => inst.state === 'done' && inst.reward_granted)
        .reduce((sum: number, inst: any) => sum + (inst.template?.reward_amount || 0), 0);
      
      return {
        ...child,
        completed,
        total,
        earned,
        rate: total > 0 ? Math.round((completed / total) * 100) : 0,
      };
    }).sort((a, b) => b.completed - a.completed);
  }, [children, allInstances]);

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'earn':
        return <ArrowUpRight className="w-4 h-4 text-success" />;
      case 'spend':
        return <ArrowDownRight className="w-4 h-4 text-destructive" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getTransactionLabel = (tx: any) => {
    if (tx.source === 'task_instance') {
      return language === 'ru' ? 'Задача выполнена' : 'Task completed';
    }
    if (tx.source === 'store_purchase') {
      return language === 'ru' ? 'Покупка в магазине' : 'Store purchase';
    }
    if (tx.source === 'job_claim') {
      return language === 'ru' ? 'Работа выполнена' : 'Job completed';
    }
    return tx.note || (language === 'ru' ? 'Транзакция' : 'Transaction');
  };

  const handleComplete = (taskId: string, childId: string) => {
    completeTask.mutate({ instanceId: taskId, childId });
  };

  const handleUncomplete = (taskId: string, childId: string) => {
    uncompleteTask.mutate({ instanceId: taskId, childId });
  };

  const handleStartTask = (taskId: string) => {
    updateInstanceState.mutate({ instanceId: taskId, state: 'doing' });
  };

  const stateColors: Record<string, string> = {
    todo: 'border-l-muted-foreground/50',
    doing: 'border-l-warning',
    done: 'border-l-success',
  };

  const activityColor = 'border-l-primary';

  return (
    <>
    <ParentOnboardingDialog
      open={showOnboarding}
      onOpenChange={setShowOnboarding}
      onComplete={handleOnboardingComplete}
    />
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('dashboard_title')}</h1>
          <p className="text-muted-foreground">{t('today')}</p>
        </div>
        <TaskChooserDialog />
      </div>

      {/* Today Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card rounded-2xl p-3 shadow-card">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <CheckCircle className="w-4 h-4" />
            <span className="text-xs">{t('tasks_completed_today')}</span>
          </div>
          <p className="text-2xl font-bold text-success">{totalCompleted}</p>
        </div>
        
        <div className="bg-card rounded-2xl p-3 shadow-card">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs">{t('earned_today')}</span>
          </div>
          <CoinBadge amount={totalEarned} size="md" />
        </div>
      </div>


      {/* Weekly Progress Section (from Reports) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">
            {language === 'ru' ? 'Прогресс за неделю' : 'Weekly Progress'}
          </h2>
          
          {/* Child Filter */}
          <Select value={selectedChildId} onValueChange={setSelectedChildId}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder={language === 'ru' ? 'Все дети' : 'All children'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {language === 'ru' ? 'Все дети' : 'All children'}
              </SelectItem>
              {children.map(child => (
                <SelectItem key={child.id} value={child.id}>
                  <span className="flex items-center gap-2">
                    <span>{child.avatar_url}</span>
                    <span>{child.name}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Weekly Summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card rounded-2xl p-4 shadow-card">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Award className="w-4 h-4" />
              <span className="text-xs">{language === 'ru' ? 'Выполнено' : 'Completed'}</span>
            </div>
            <p className="text-2xl font-bold text-primary">{totalWeekCompleted}</p>
            <p className="text-xs text-muted-foreground">
              {language === 'ru' ? 'за 7 дней' : 'in 7 days'}
            </p>
          </div>
          
          <div className="bg-card rounded-2xl p-4 shadow-card">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs">{language === 'ru' ? 'Заработано' : 'Earned'}</span>
            </div>
            <CoinBadge amount={totalWeekEarned} size="md" />
          </div>

          <div className="bg-card rounded-2xl p-4 shadow-card">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Calendar className="w-4 h-4" />
              <span className="text-xs">{language === 'ru' ? 'Успех' : 'Success'}</span>
            </div>
            <p className="text-2xl font-bold text-success">{completionRate}%</p>
            <p className="text-xs text-muted-foreground">
              {totalWeekCompleted}/{totalWeekTasks}
            </p>
          </div>
        </div>

        <Tabs defaultValue="chart" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="chart">
              {language === 'ru' ? 'График' : 'Chart'}
            </TabsTrigger>
            <TabsTrigger value="leaderboard">
              {language === 'ru' ? 'Рейтинг' : 'Leaderboard'}
            </TabsTrigger>
            <TabsTrigger value="history">
              {language === 'ru' ? 'История' : 'History'}
            </TabsTrigger>
          </TabsList>

          {/* Chart Tab */}
          <TabsContent value="chart" className="mt-4">
            <div className="bg-card rounded-2xl p-5 shadow-card">
              <h3 className="font-bold mb-4">
                {language === 'ru' ? 'Выполненные задачи' : 'Completed Tasks'}
              </h3>
              <div className="flex items-end justify-between gap-2 h-32">
                {weeklyStats.map((data, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs font-medium text-primary">{data.completed}</span>
                    <div 
                      className="w-full bg-primary/20 rounded-t-lg relative overflow-hidden transition-all"
                      style={{ height: `${(data.completed / maxCompleted) * 100}%`, minHeight: '4px' }}
                    >
                      <div 
                        className="absolute inset-0 bg-primary rounded-t-lg animate-fade-in"
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">{data.day}</span>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard" className="mt-4">
            <div className="bg-card rounded-2xl p-5 shadow-card">
              <h3 className="font-bold mb-4">
                {language === 'ru' ? 'Рейтинг за неделю' : 'Weekly Leaderboard'}
              </h3>
              <div className="space-y-3">
                {childStats.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    {language === 'ru' ? 'Нет данных' : 'No data'}
                  </p>
                ) : (
                  childStats.map((child, index) => (
                    <div key={child.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/50 transition-colors">
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0 ? 'bg-yellow-500/20 text-yellow-600' :
                        index === 1 ? 'bg-gray-300/30 text-gray-600' :
                        index === 2 ? 'bg-orange-400/20 text-orange-600' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {index + 1}
                      </span>
                      <ChildAvatar avatar={child.avatar_url || '🦁'} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{child.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {child.completed}/{child.total} {language === 'ru' ? 'задач' : 'tasks'} ({child.rate}%)
                        </p>
                      </div>
                      <div className="text-right">
                        <CoinBadge amount={child.earned} size="sm" />
                        <p className="text-xs text-muted-foreground">
                          {language === 'ru' ? 'за неделю' : 'this week'}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="mt-4">
            <div className="bg-card rounded-2xl p-5 shadow-card">
              <h3 className="font-bold mb-4">
                {language === 'ru' ? 'История транзакций' : 'Transaction History'}
              </h3>
              <div className="space-y-2">
                {filteredTransactions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    {language === 'ru' ? 'Нет транзакций' : 'No transactions'}
                  </p>
                ) : (
                  filteredTransactions.map((tx) => {
                    const child = children.find(c => c.id === tx.child_id);
                    return (
                      <div key={tx.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/50 transition-colors">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          tx.transaction_type === 'earn' ? 'bg-success/20' : 'bg-destructive/20'
                        }`}>
                          {getTransactionIcon(tx.transaction_type)}
                        </div>
                        {child && (
                          <ChildAvatar avatar={child.avatar_url || '🦁'} size="sm" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{getTransactionLabel(tx)}</p>
                          <p className="text-xs text-muted-foreground">
                            {child?.name} • {format(new Date(tx.created_at), 'd MMM, HH:mm', { locale: dateLocale })}
                          </p>
                        </div>
                        <span className={`font-bold ${
                          tx.transaction_type === 'earn' ? 'text-success' : 'text-destructive'
                        }`}>
                          {tx.transaction_type === 'earn' ? '+' : ''}{tx.amount}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Action Buttons - Bottom */}
      <section className="flex justify-center gap-4 pt-4">
        <TaskChooserDialog
          trigger={
            <button className="bg-primary/10 hover:bg-primary/20 text-primary rounded-2xl px-6 py-4 text-center transition-colors">
              <span className="text-2xl block mb-1">➕</span>
              <span className="text-sm font-semibold">{t('add_task')}</span>
            </button>
          }
        />
        <AddChildDialog
          trigger={
            <button className="bg-secondary/10 hover:bg-secondary/20 text-secondary rounded-2xl px-6 py-4 text-center transition-colors">
              <span className="text-2xl block mb-1">👶</span>
              <span className="text-sm font-semibold">{t('add_child')}</span>
            </button>
          }
        />
      </section>
    </div>
    </>
  );
};
