import { Home, Calendar, Briefcase, ShoppingBag, ListTodo, LogOut, LogIn, User, Shield } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/hooks/useAuth';
import { GroweeCharacter } from '@/components/ui/GroweeCharacter';
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

// Child navigation - unified KIDS mode (no personal/family split)
const childNavItems: NavItem[] = [
  { icon: Home, labelKey: 'nav_today', path: '/' },
  { icon: Calendar, labelKey: 'nav_schedule', path: '/schedule' },
  { icon: Briefcase, labelKey: 'nav_jobs', path: '/exchange' },
  { icon: ShoppingBag, labelKey: 'nav_store', path: '/store' },
];

// Parent navigation
const parentNavItems: NavItem[] = [
  { icon: Home, labelKey: 'nav_dashboard', path: '/parent' },
  { icon: ListTodo, labelKey: 'nav_tasks', path: '/parent/tasks' },
  { icon: Briefcase, labelKey: 'nav_jobs', path: '/parent/jobs' },
  { icon: ShoppingBag, labelKey: 'nav_store', path: '/parent/store' },
  { icon: User, labelKey: 'nav_profile', path: '/parent/profile' },
  { icon: Shield, labelKey: 'nav_security', path: '/parent/security' },
];

const translations: Record<string, { en: string; ru: string }> = {
  nav_today: { en: 'Today', ru: 'Сегодня' },
  nav_schedule: { en: 'Schedule', ru: 'Расписание' },
  nav_store: { en: 'Store', ru: 'Магазин' },
  nav_jobs: { en: 'Jobs', ru: 'Работы' },
  nav_tasks: { en: 'Tasks', ru: 'Задания' },
  nav_dashboard: { en: 'Dashboard', ru: 'Главная' },
  nav_profile: { en: 'Profile', ru: 'Профиль' },
  nav_security: { en: 'Security', ru: 'Безопасность' },
};

export const AppSidebar = () => {
  const { language, t } = useLanguage();
  const { role } = useApp();
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = useSidebar();

  const isCollapsed = state === 'collapsed';

  // Determine which nav items to show based on role
  const navItems = role === 'parent' ? parentNavItems : childNavItems;

  const getLabel = (key: string) => {
    const trans = translations[key];
    return trans ? trans[language] : key;
  };

  const groupLabel = role === 'parent' 
    ? (language === 'ru' ? 'Управление' : 'Management')
    : (language === 'ru' ? 'Меню' : 'Menu');

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <GroweeCharacter size="xs" />
          {!isCollapsed && (
            <span className="font-bold text-lg">{t('app_name')}</span>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Navigation */}
        <SidebarGroup>
          {!isCollapsed && (
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

      <SidebarFooter className="p-3">
        {user ? (
          <button
            onClick={() => signOut()}
            className={cn(
              "w-full flex items-center gap-2 p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors",
              isCollapsed && "justify-center"
            )}
          >
            <LogOut className="w-4 h-4" />
            {!isCollapsed && (
              <span className="text-sm">{language === 'ru' ? 'Выйти' : 'Sign out'}</span>
            )}
          </button>
        ) : (
          <button
            onClick={() => navigate('/auth')}
            className={cn(
              "w-full flex items-center gap-2 p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors",
              isCollapsed && "justify-center"
            )}
          >
            <LogIn className="w-4 h-4" />
            {!isCollapsed && (
              <span className="text-sm">{language === 'ru' ? 'Войти' : 'Sign in'}</span>
            )}
          </button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
};
