import { Home, Calendar, Briefcase, Trophy, ShoppingBag, BarChart3, ListTodo } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useApp } from '@/contexts/AppContext';

interface NavItem {
  icon: React.ElementType;
  labelKey: string;
  path: string;
}

// Family dashboard navigation (when viewMode is 'family')
const familyNavItems: NavItem[] = [
  { icon: Home, labelKey: 'nav_today', path: '/' },
  { icon: Calendar, labelKey: 'nav_schedule', path: '/schedule' },
  { icon: Briefcase, labelKey: 'nav_exchange', path: '/exchange' },
];

// Personal child navigation (when viewMode is 'personal')
const personalNavItems: NavItem[] = [
  { icon: Trophy, labelKey: 'nav_rewards', path: '/rewards' },
  { icon: ShoppingBag, labelKey: 'nav_store', path: '/store' },
  { icon: Briefcase, labelKey: 'nav_job_board', path: '/jobs' },
];

// Parent navigation
const parentNavItems: NavItem[] = [
  { icon: Home, labelKey: 'nav_dashboard', path: '/parent' },
  { icon: ListTodo, labelKey: 'nav_tasks', path: '/parent/tasks' },
  { icon: Briefcase, labelKey: 'nav_job_board', path: '/parent/jobs' },
  { icon: ShoppingBag, labelKey: 'nav_store', path: '/parent/store' },
  { icon: BarChart3, labelKey: 'nav_reports', path: '/parent/reports' },
];

const translations: Record<string, { en: string; ru: string }> = {
  nav_today: { en: 'Today', ru: 'Сегодня' },
  nav_schedule: { en: 'Schedule', ru: 'Расписание' },
  nav_exchange: { en: 'Exchange', ru: 'Биржа' },
  nav_rewards: { en: 'Rewards', ru: 'Награды' },
  nav_store: { en: 'Store', ru: 'Магазин' },
  nav_job_board: { en: 'Job Board', ru: 'Биржа' },
  nav_dashboard: { en: 'Dashboard', ru: 'Главная' },
  nav_tasks: { en: 'Tasks', ru: 'Задачи' },
  nav_reports: { en: 'Reports', ru: 'Отчёты' },
};

export const BottomNav = () => {
  const { language } = useLanguage();
  const { role, viewMode } = useApp();
  const location = useLocation();
  const navigate = useNavigate();

  // Determine which nav items to show based on role and viewMode
  const getNavItems = () => {
    if (role === 'parent') return parentNavItems;
    if (viewMode === 'family') return familyNavItems;
    return personalNavItems;
  };

  const navItems = getNavItems();

  const getLabel = (key: string) => {
    const trans = translations[key];
    return trans ? trans[language] : key;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border safe-area-bottom z-40">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 py-2 px-1 rounded-lg transition-all",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className={cn(
                "p-1.5 rounded-xl transition-all",
                isActive && "bg-primary/10"
              )}>
                <Icon className={cn(
                  "w-5 h-5 transition-transform",
                  isActive && "scale-110"
                )} />
              </div>
              <span className="text-[10px] font-medium truncate max-w-full">
                {getLabel(item.labelKey)}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
