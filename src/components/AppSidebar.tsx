import { useState } from 'react';
import { Home, Calendar, Briefcase, Trophy, ShoppingBag, BarChart3, ListTodo, Users, LogOut, LogIn, ChevronDown, Check, Pencil, LayoutTemplate } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/hooks/useAuth';
import { ChildAvatar } from '@/components/ui/ChildAvatar';
import { CoinBadge } from '@/components/ui/CoinBadge';
import { GroweeCharacter } from '@/components/ui/GroweeCharacter';
import { EditChildProfileDialog } from '@/components/EditChildProfileDialog';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

interface NavItem {
  icon: React.ElementType;
  labelKey: string;
  path: string;
}

// Family dashboard navigation (when viewMode is 'family' AND role is 'child')
// Child mode = execution only - NO Templates
const familyNavItems: NavItem[] = [
  { icon: Home, labelKey: 'nav_today', path: '/' },
  { icon: Calendar, labelKey: 'nav_schedule', path: '/schedule' },
  { icon: Briefcase, labelKey: 'nav_exchange', path: '/exchange' },
];

// Personal child navigation (when viewMode is 'personal')
const personalNavItems: NavItem[] = [
  { icon: Home, labelKey: 'nav_today', path: '/' },
  { icon: Trophy, labelKey: 'nav_rewards', path: '/rewards' },
  { icon: ShoppingBag, labelKey: 'nav_store', path: '/store' },
  { icon: Briefcase, labelKey: 'nav_tasks', path: '/jobs' },
];

// Parent navigation
const parentNavItems: NavItem[] = [
  { icon: Home, labelKey: 'nav_dashboard', path: '/parent' },
  { icon: ListTodo, labelKey: 'nav_tasks', path: '/parent/tasks' },
  { icon: LayoutTemplate, labelKey: 'nav_templates', path: '/parent/templates' },
  { icon: Briefcase, labelKey: 'nav_job_board', path: '/parent/jobs' },
  { icon: ShoppingBag, labelKey: 'nav_store', path: '/parent/store' },
  { icon: BarChart3, labelKey: 'nav_reports', path: '/parent/reports' },
];

const translations: Record<string, { en: string; ru: string }> = {
  nav_today: { en: 'Today', ru: 'Сегодня' },
  nav_schedule: { en: 'Plan', ru: 'План' },
  nav_templates: { en: 'Plans', ru: 'Планы' },
  nav_exchange: { en: 'Tasks', ru: 'Задания' },
  nav_rewards: { en: 'Rewards', ru: 'Награды' },
  nav_store: { en: 'Store', ru: 'Магазин' },
  nav_job_board: { en: 'Tasks', ru: 'Задания' },
  nav_tasks: { en: 'Tasks', ru: 'Задания' },
  nav_dashboard: { en: 'Dashboard', ru: 'Главная' },
  nav_reports: { en: 'Reports', ru: 'Отчёты' },
  nav_overview: { en: 'Overview', ru: 'Обзор' },
};

export const AppSidebar = () => {
  const { language, t } = useLanguage();
  const { role, viewMode, setViewMode, currentChild, setCurrentChild, children } = useApp();
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = useSidebar();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [childToEdit, setChildToEdit] = useState<typeof currentChild>(null);

  const isCollapsed = state === 'collapsed';

  const handleEditChild = (child: typeof currentChild, e: React.MouseEvent) => {
    e.stopPropagation();
    if (child) {
      setChildToEdit(child);
      setEditDialogOpen(true);
    }
  };

  const handleEditSuccess = (updatedChild: typeof currentChild) => {
    if (updatedChild && currentChild?.id === updatedChild.id) {
      setCurrentChild(updatedChild);
    }
  };

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

  const handleSelectChild = (child: typeof currentChild) => {
    setCurrentChild(child);
    setViewMode('personal');
    navigate('/');
  };

  const handleSelectFamily = () => {
    setViewMode('family');
    navigate('/');
  };

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
        {/* User Profile Section */}
        {role === 'child' && (
          <SidebarGroup>
            {!isCollapsed && (
              <SidebarGroupLabel>
                {language === 'ru' ? 'Профиль' : 'Profile'}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors",
                    isCollapsed && "justify-center p-2"
                  )}>
                    {viewMode === 'family' ? (
                      <>
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Trophy className="w-5 h-5 text-primary" />
                        </div>
                        {!isCollapsed && (
                          <div className="flex-1 text-left min-w-0">
                            <div className="flex items-center gap-1">
                              <p className="font-semibold truncate">
                                {language === 'ru' ? 'Семья' : 'Family'}
                              </p>
                              <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            </div>
                          <p className="text-xs text-muted-foreground">
                            {language === 'ru' ? 'Обзор' : 'Overview'}
                          </p>
                        </div>
                        )}
                      </>
                    ) : currentChild ? (
                      <>
                        <ChildAvatar avatar={currentChild.avatar_url || '🦁'} size="md" />
                        {!isCollapsed && (
                          <div className="flex-1 text-left min-w-0">
                            <div className="flex items-center gap-1">
                              <p className="font-semibold truncate">{currentChild.name}</p>
                              <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            </div>
                            <CoinBadge amount={currentChild.balance} size="sm" />
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                          <Users className="w-5 h-5 text-muted-foreground" />
                        </div>
                        {!isCollapsed && (
                          <div className="flex items-center gap-1">
                            <p className="font-semibold">
                              {language === 'ru' ? 'Выберите' : 'Select'}
                            </p>
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          </div>
                        )}
                      </>
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuLabel>
                    {language === 'ru' ? 'Переключить вид' : 'Switch view'}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  {/* Family Dashboard Option */}
                  <DropdownMenuItem
                    onClick={handleSelectFamily}
                    className="flex items-center gap-3"
                  >
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Trophy className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">
                        {language === 'ru' ? 'Обзор' : 'Overview'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {language === 'ru' ? 'Все дети' : 'All children'}
                      </p>
                    </div>
                    {viewMode === 'family' && (
                      <Check className="w-4 h-4 text-primary" />
                    )}
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  {/* Children List */}
                  {children.map((child) => (
                    <DropdownMenuItem
                      key={child.id}
                      onClick={() => handleSelectChild(child)}
                      className="flex items-center gap-3"
                    >
                      <ChildAvatar avatar={child.avatar_url || '🦁'} size="sm" />
                      <div className="flex-1">
                        <p className="font-medium">{child.name}</p>
                        <p className="text-xs text-muted-foreground">{child.balance} 🪙</p>
                      </div>
                      <button
                        onClick={(e) => handleEditChild(child, e)}
                        className="p-1.5 rounded-md hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-colors"
                        title={language === 'ru' ? 'Редактировать' : 'Edit'}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      {viewMode === 'personal' && currentChild?.id === child.id && (
                        <Check className="w-4 h-4 text-primary" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

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

      {/* Edit Child Profile Dialog */}
      {childToEdit && (
        <EditChildProfileDialog
          child={childToEdit}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSuccess={handleEditSuccess}
        />
      )}
    </Sidebar>
  );
};
