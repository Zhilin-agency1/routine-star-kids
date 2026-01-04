import { Globe, User, Users, LogIn, LogOut, ChevronDown, Check, Trophy, Eye, RefreshCw, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/hooks/useAuth';
import { CoinBadge } from './ui/CoinBadge';
import { ChildAvatar } from './ui/ChildAvatar';
import { NotificationBell } from './NotificationBell';
import { GroweeCharacter } from './ui/GroweeCharacter';
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
  const { 
    role, setRole, userRoles, viewMode, setViewMode, 
    currentChild, setCurrentChild, children,
    childrenLoading, childrenError, refetchChildren, familyLoaded
  } = useApp();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Check if user can switch roles (only if they have both roles in database)
  const canSwitchRoles = userRoles.includes('parent') && userRoles.includes('child');
  const hasParentRole = userRoles.includes('parent');
  const hasChildRole = userRoles.includes('child');

  // Log errors for debugging
  if (childrenError) {
    console.error('Failed to load children:', childrenError);
  }

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
    // Only allow role change if user has this role
    if ((newRole === 'parent' && hasParentRole) || (newRole === 'child' && hasChildRole)) {
      setRole(newRole);
      if (newRole === 'parent') {
        navigate('/parent');
      } else {
        navigate('/');
      }
    }
  };

  // Parent preview: switch to child view mode without changing actual role
  const handleSwitchToChildView = (child?: typeof currentChild) => {
    if (child) {
      setCurrentChild(child);
      setViewMode('personal');
    } else if (children.length > 0) {
      setCurrentChild(children[0]);
      setViewMode('personal');
    } else {
      setViewMode('family');
    }
    setRole('child');
    navigate('/');
  };

  const handleRetryLoadChildren = () => {
    refetchChildren();
  };

  // Mobile: full header with logo
  if (isMobile) {
    return (
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border safe-area-top">
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
                        <p className="text-xs text-muted-foreground">{child.balance} coins</p>
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
                <GroweeCharacter size="xs" />
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
                  🇺🇸 English {language === 'en' && '✓'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Role Toggle - only show if user can switch roles OR for auth actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <User className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                {/* Parent-only: Switch to child view */}
                {hasParentRole && role === 'parent' && (
                  <>
                    <DropdownMenuLabel className="flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      {language === 'ru' ? 'Просмотр как ребенок' : 'Preview as child'}
                    </DropdownMenuLabel>
                    
                    {!familyLoaded ? (
                      <DropdownMenuItem disabled className="text-muted-foreground">
                        {language === 'ru' ? 'Семья не настроена' : 'Family not set up'}
                      </DropdownMenuItem>
                    ) : childrenLoading ? (
                      <DropdownMenuItem disabled className="text-muted-foreground">
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        {language === 'ru' ? 'Загрузка...' : 'Loading...'}
                      </DropdownMenuItem>
                    ) : childrenError ? (
                      <DropdownMenuItem 
                        onClick={handleRetryLoadChildren}
                        className="text-destructive"
                      >
                        <AlertCircle className="w-4 h-4 mr-2" />
                        {language === 'ru' ? 'Ошибка загрузки. Повторить?' : 'Load failed. Retry?'}
                      </DropdownMenuItem>
                    ) : children.length === 0 ? (
                      <DropdownMenuItem disabled className="text-muted-foreground">
                        {language === 'ru' ? 'Дети не добавлены' : 'No children added'}
                      </DropdownMenuItem>
                    ) : (
                      <>
                        {/* Family Overview option */}
                        <DropdownMenuItem onClick={() => handleSwitchToChildView()}>
                          <Trophy className="w-4 h-4 mr-2 text-primary" />
                          {language === 'ru' ? 'Обзор семьи' : 'Family overview'}
                        </DropdownMenuItem>
                        {/* Individual children */}
                        {children.map((child) => (
                          <DropdownMenuItem 
                            key={child.id}
                            onClick={() => handleSwitchToChildView(child)}
                          >
                            <ChildAvatar avatar={child.avatar_url || '🦁'} size="xs" />
                            <span className="ml-2">{child.name}</span>
                          </DropdownMenuItem>
                        ))}
                      </>
                    )}
                    <DropdownMenuSeparator />
                  </>
                )}

                {/* Show "Back to parent mode" when in child view as a parent */}
                {hasParentRole && role === 'child' && (
                  <>
                    <DropdownMenuItem onClick={() => handleRoleChange('parent')}>
                      👨‍👩‍👧 {language === 'ru' ? 'Назад к родителю' : 'Back to parent mode'}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                
                {/* Only show role options if user has multiple roles from DB */}
                {canSwitchRoles && !hasParentRole && (
                  <>
                    <DropdownMenuItem onClick={() => handleRoleChange('child')} disabled={!hasChildRole}>
                      👶 {t('role_child')} {role === 'child' && '✓'}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleRoleChange('parent')} disabled={!hasParentRole}>
                      👨‍👩‍👧 {t('role_parent')} {role === 'parent' && '✓'}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                {/* Show current role if only one role */}
                {!canSwitchRoles && userRoles.length > 0 && !hasParentRole && (
                  <>
                    <DropdownMenuItem disabled>
                      {role === 'parent' ? '👨‍👩‍👧' : '👶'} {role === 'parent' ? t('role_parent') : t('role_child')}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
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
            🇺🇸 English {language === 'en' && '✓'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Role Toggle - only show if user can switch roles OR for auth actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full">
            <User className="w-5 h-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          {/* Parent-only: Switch to child view */}
          {hasParentRole && role === 'parent' && (
            <>
              <DropdownMenuLabel className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                {language === 'ru' ? 'Просмотр как ребенок' : 'Preview as child'}
              </DropdownMenuLabel>
              
              {!familyLoaded ? (
                <DropdownMenuItem disabled className="text-muted-foreground">
                  {language === 'ru' ? 'Семья не настроена' : 'Family not set up'}
                </DropdownMenuItem>
              ) : childrenLoading ? (
                <DropdownMenuItem disabled className="text-muted-foreground">
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  {language === 'ru' ? 'Загрузка...' : 'Loading...'}
                </DropdownMenuItem>
              ) : childrenError ? (
                <DropdownMenuItem 
                  onClick={handleRetryLoadChildren}
                  className="text-destructive"
                >
                  <AlertCircle className="w-4 h-4 mr-2" />
                  {language === 'ru' ? 'Ошибка загрузки. Повторить?' : 'Load failed. Retry?'}
                </DropdownMenuItem>
              ) : children.length === 0 ? (
                <DropdownMenuItem disabled className="text-muted-foreground">
                  {language === 'ru' ? 'Дети не добавлены' : 'No children added'}
                </DropdownMenuItem>
              ) : (
                <>
                  {/* Family Overview option */}
                  <DropdownMenuItem onClick={() => handleSwitchToChildView()}>
                    <Trophy className="w-4 h-4 mr-2 text-primary" />
                    {language === 'ru' ? 'Обзор семьи' : 'Family overview'}
                  </DropdownMenuItem>
                  {/* Individual children */}
                  {children.map((child) => (
                    <DropdownMenuItem 
                      key={child.id}
                      onClick={() => handleSwitchToChildView(child)}
                    >
                      <ChildAvatar avatar={child.avatar_url || '🦁'} size="xs" />
                      <span className="ml-2">{child.name}</span>
                    </DropdownMenuItem>
                  ))}
                </>
              )}
              <DropdownMenuSeparator />
            </>
          )}

          {/* Show "Back to parent mode" when in child view as a parent */}
          {hasParentRole && role === 'child' && (
            <>
              <DropdownMenuItem onClick={() => handleRoleChange('parent')}>
                👨‍👩‍👧 {language === 'ru' ? 'Назад к родителю' : 'Back to parent mode'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          
          {/* Only show role options if user has multiple roles from DB */}
          {canSwitchRoles && !hasParentRole && (
            <>
              <DropdownMenuItem onClick={() => handleRoleChange('child')} disabled={!hasChildRole}>
                👶 {t('role_child')} {role === 'child' && '✓'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleRoleChange('parent')} disabled={!hasParentRole}>
                👨‍👩‍👧 {t('role_parent')} {role === 'parent' && '✓'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          {/* Show current role if only one role */}
          {!canSwitchRoles && userRoles.length > 0 && !hasParentRole && (
            <>
              <DropdownMenuItem disabled>
                {role === 'parent' ? '👨‍👩‍👧' : '👶'} {role === 'parent' ? t('role_parent') : t('role_child')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
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
