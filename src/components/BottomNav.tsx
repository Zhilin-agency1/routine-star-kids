import { Home, Briefcase, ShoppingBag, ListTodo, Calendar, User } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useApp } from '@/contexts/AppContext';

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
];

export const BottomNav = () => {
  const { t } = useLanguage();
  const { role } = useApp();
  const location = useLocation();
  const navigate = useNavigate();

  // Determine which nav items to show based on role
  const navItems = role === 'parent' ? parentNavItems : childNavItems;

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
