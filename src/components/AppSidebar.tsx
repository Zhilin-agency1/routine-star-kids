import { Home, Calendar, Briefcase, Trophy, ShoppingBag, BarChart3, ListTodo, Users } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useApp } from '@/contexts/AppContext';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';

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

export const AppSidebar = () => {
  const { language, t } = useLanguage();
  const { role, viewMode } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = useSidebar();

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

  const groupLabel = role === 'parent' 
    ? (language === 'ru' ? 'Управление' : 'Management')
    : viewMode === 'family' 
      ? (language === 'ru' ? 'Семья' : 'Family')
      : (language === 'ru' ? 'Личное' : 'Personal');

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
            <Users className="w-4 h-4 text-primary-foreground" />
          </div>
          {state !== 'collapsed' && (
            <span className="font-bold text-lg">{t('app_name')}</span>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          {state !== 'collapsed' && (
            <SidebarGroupLabel>{groupLabel}</SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;

                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      onClick={() => navigate(item.path)}
                      isActive={isActive}
                      tooltip={getLabel(item.labelKey)}
                      className={cn(
                        "transition-all",
                        isActive && "bg-primary/10 text-primary font-medium"
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{getLabel(item.labelKey)}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        {state !== 'collapsed' && (
          <p className="text-xs text-muted-foreground text-center">
            {language === 'ru' ? 'Семейный планировщик' : 'Family Planner'}
          </p>
        )}
      </SidebarFooter>
    </Sidebar>
  );
};
