import { Globe, User, Users, LogIn, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/hooks/useAuth';
import { CoinBadge } from './ui/CoinBadge';
import { ChildAvatar } from './ui/ChildAvatar';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

export const Header = () => {
  const { language, setLanguage, t } = useLanguage();
  const { role, setRole, currentChild } = useApp();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-lg border-b border-border safe-area-top">
      <div className="flex items-center justify-between h-16 px-4 max-w-lg mx-auto">
        {/* Left: Avatar & Name or Logo */}
        <div className="flex items-center gap-3">
          {role === 'child' && currentChild ? (
            <>
              <ChildAvatar avatar={currentChild.avatar_url || '🦁'} size="sm" />
              <div>
                <p className="text-xs text-muted-foreground">{t('hello')},</p>
                <p className="font-bold text-lg leading-tight">{currentChild.name}!</p>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Users className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg">{t('app_name')}</span>
            </div>
          )}
        </div>

        {/* Right: Balance + Controls */}
        <div className="flex items-center gap-2">
          {role === 'child' && currentChild && (
            <CoinBadge amount={currentChild.balance} size="md" />
          )}

          {/* Language Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Globe className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setLanguage('ru')}>
                🇷🇺 Русский {language === 'ru' && '✓'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage('en')}>
                🇬🇧 English {language === 'en' && '✓'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Role Toggle (for demo) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <User className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setRole('child')}>
                👶 {t('role_child')} {role === 'child' && '✓'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setRole('parent')}>
                👨‍👩‍👧 {t('role_parent')} {role === 'parent' && '✓'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {user ? (
                <DropdownMenuItem onClick={() => signOut()} className="text-destructive">
                  <LogOut className="w-4 h-4 mr-2" />
                  Выйти
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => navigate('/auth')}>
                  <LogIn className="w-4 h-4 mr-2" />
                  Войти
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
