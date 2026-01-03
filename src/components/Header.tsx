import { Globe, User, Users, LogIn, LogOut, ChevronDown, Check, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/hooks/useAuth';
import { CoinBadge } from './ui/CoinBadge';
import { ChildAvatar } from './ui/ChildAvatar';
import { NotificationBell } from './NotificationBell';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from './ui/dropdown-menu';
import { useIsMobile } from '@/hooks/use-mobile';

export const Header = () => {
  const { language, setLanguage, t } = useLanguage();
  const { role, setRole, viewMode, setViewMode, currentChild, setCurrentChild, children } = useApp();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const handleSelectChild = (child: typeof currentChild) => {
    setCurrentChild(child);
    setViewMode('personal');
    navigate('/');
  };

  const handleSelectFamily = () => {
    setViewMode('family');
    navigate('/');
  };

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
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-lg border-b-2 border-border safe-area-top shadow-sm">
        <div className="flex items-center justify-between h-16 px-4">
          {/* Left: Avatar & Name or Logo */}
          <div className="flex items-center gap-3">
            {role === 'child' ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                    {viewMode === 'family' ? (
                      <>
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                          <Trophy className="w-5 h-5 text-primary" />
                        </div>
                        <div className="text-left">
                          <div className="flex items-center gap-1">
                        <p className="font-bold text-lg leading-tight">
                              {language === 'ru' ? 'Обзор' : 'Overview'}
                            </p>
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          </div>
                        </div>
                      </>
                    ) : currentChild ? (
                      <>
                        <ChildAvatar avatar={currentChild.avatar_url || '🦁'} size="sm" />
                        <div className="text-left">
                          <p className="text-xs text-muted-foreground">{t('hello')},</p>
                          <div className="flex items-center gap-1">
                            <p className="font-bold text-lg leading-tight">{currentChild.name}</p>
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                          <User className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div className="flex items-center gap-1">
                          <p className="font-bold text-lg leading-tight">
                            {language === 'ru' ? 'Выберите' : 'Select'}
                          </p>
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        </div>
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
                      {viewMode === 'personal' && currentChild?.id === child.id && (
                        <Check className="w-4 h-4 text-primary" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
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
            {role === 'child' && viewMode === 'personal' && currentChild && (
              <CoinBadge amount={currentChild.balance} size="md" />
            )}

            {/* Notifications for parents */}
            {role === 'parent' && <NotificationBell />}

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

            {/* Role Toggle */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <User className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleRoleChange('child')}>
                  👶 {t('role_child')} {role === 'child' && '✓'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleRoleChange('parent')}>
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
  }

  // Desktop: compact header (logo is in sidebar)
  return (
    <div className="flex items-center gap-4 flex-1 justify-end">
      {role === 'child' && viewMode === 'personal' && currentChild && (
        <CoinBadge amount={currentChild.balance} size="md" />
      )}

      {/* Notifications for parents */}
      {role === 'parent' && <NotificationBell />}

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

      {/* Role Toggle */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full">
            <User className="w-5 h-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleRoleChange('child')}>
            👶 {t('role_child')} {role === 'child' && '✓'}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleRoleChange('parent')}>
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
  );
};
