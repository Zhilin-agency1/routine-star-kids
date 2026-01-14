import { Home, Briefcase, Trophy, ShoppingBag, ListTodo, Calendar, User } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useApp } from '@/contexts/AppContext';

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
  { icon: Briefcase, labelKey: 'nav_jobs', path: '/exchange' },
];

// Personal child navigation (when viewMode is 'personal')
// Child mode = execution only - NO Schedule or Templates
const personalNavItems: NavItem[] = [
  { icon: Home, labelKey: 'nav_today', path: '/' },
  { icon: Trophy, labelKey: 'nav_rewards', path: '/rewards' },
  { icon: ShoppingBag, labelKey: 'nav_store', path: '/store' },
  { icon: Briefcase, labelKey: 'nav_jobs', path: '/jobs' },
];

// Parent navigation - Updated: removed Plans, added Profile
const parentNavItems: NavItem[] = [
  { icon: Home, labelKey: 'nav_dashboard', path: '/parent' },
  { icon: ListTodo, labelKey: 'nav_tasks', path: '/parent/tasks' },
  { icon: Briefcase, labelKey: 'nav_jobs', path: '/parent/jobs' },
  { icon: ShoppingBag, labelKey: 'nav_store', path: '/parent/store' },
  { icon: User, labelKey: 'nav_profile', path: '/parent/profile' },
];

export const BottomNav = () => {
  const { t } = useLanguage();
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

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border safe-area-bottom z-40">
      <div className="flex items-center justify-around h-20 max-w-lg mx-auto px-3">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 py-3 px-2 rounded-xl transition-all",
                isActive 
                  ? "text-secondary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className={cn(
                "p-2 rounded-2xl transition-all",
                isActive && "bg-primary/40"
              )}>
                <Icon className={cn(
                  "w-6 h-6 transition-transform",
                  isActive && "scale-110"
                )} />
              </div>
              <span className="text-xs font-semibold truncate max-w-full">
                {t(item.labelKey as any)}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};