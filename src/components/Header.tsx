import { Globe, User, LogIn, LogOut, Check, Baby, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/hooks/useAuth';
import { GroweeCharacter } from './ui/GroweeCharacter';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { useIsMobile } from '@/hooks/use-mobile';

export const Header = () => {
  const { language, setLanguage, t } = useLanguage();
  const { role, setRole } = useApp();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const handleRoleChange = (newRole: 'child' | 'parent') => {
    setRole(newRole);
    if (newRole === 'parent') {
      navigate('/parent');
    } else {
      navigate('/');
    }
  };

  // Mobile: full header with logo
  if (isMobile) {
    return (
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border safe-area-top">
        <div className="flex items-center justify-between h-16 px-4">
          {/* Left: Logo */}
          <div className="flex items-center gap-2">
            <GroweeCharacter size="xs" />
            <span className="font-bold text-lg">{t('app_name')}</span>
          </div>

          {/* Right: Controls */}
          <div className="flex items-center gap-2">
            {/* Language Toggle */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Globe className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setLanguage('ru')} className="flex items-center justify-between gap-4">
                  <span>Русский</span>
                  {language === 'ru' && <Check className="w-4 h-4 text-primary" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLanguage('en')} className="flex items-center justify-between gap-4">
                  <span>English</span>
                  {language === 'en' && <Check className="w-4 h-4 text-primary" />}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Role Toggle */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <User className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleRoleChange('child')} className="flex items-center justify-between gap-4">
                  <span className="flex items-center gap-2">
                    <Baby className="w-4 h-4" />
                    {t('role_child')}
                  </span>
                  {role === 'child' && <Check className="w-4 h-4 text-primary" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleRoleChange('parent')} className="flex items-center justify-between gap-4">
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    {t('role_parent')}
                  </span>
                  {role === 'parent' && <Check className="w-4 h-4 text-primary" />}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {user ? (
                  <DropdownMenuItem onClick={() => signOut()} className="text-destructive">
                    <LogOut className="w-4 h-4 mr-2" />
                    {language === 'ru' ? 'Выйти' : 'Sign out'}
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => navigate('/auth')}>
                    <LogIn className="w-4 h-4 mr-2" />
                    {language === 'ru' ? 'Войти' : 'Sign in'}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
    );
  }

  // Desktop: compact header (logo is in sidebar)
  return (
    <div className="flex items-center gap-4 flex-1 justify-end">
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
            🇺🇸 English {language === 'en' && '✓'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Role Toggle */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full">
            <User className="w-5 h-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleRoleChange('child')} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2">
              <Baby className="w-4 h-4" />
              {t('role_child')}
            </span>
            {role === 'child' && <Check className="w-4 h-4 text-primary" />}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleRoleChange('parent')} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              {t('role_parent')}
            </span>
            {role === 'parent' && <Check className="w-4 h-4 text-primary" />}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {user ? (
            <DropdownMenuItem onClick={() => signOut()} className="text-destructive">
              <LogOut className="w-4 h-4 mr-2" />
              {language === 'ru' ? 'Выйти' : 'Sign out'}
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => navigate('/auth')}>
              <LogIn className="w-4 h-4 mr-2" />
              {language === 'ru' ? 'Войти' : 'Sign in'}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
