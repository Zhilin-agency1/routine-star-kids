import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Loader2, CheckCircle, XCircle, LogIn } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { GroweeCharacter } from '@/components/ui/GroweeCharacter';
import { toast } from 'sonner';

type InviteState = 'loading' | 'needs-auth' | 'accepting' | 'success' | 'error';

export const InviteAcceptPage = () => {
  const { token } = useParams<{ token: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { language } = useLanguage();

  const [state, setState] = useState<InviteState>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const t = {
    en: {
      loading: 'Validating invite...',
      needs_auth_title: 'Sign in to accept invite',
      needs_auth_desc: 'You need to sign in or create an account to join this family.',
      sign_in: 'Sign In',
      accepting: 'Joining family...',
      success_title: 'Welcome to the family!',
      success_desc: 'You have successfully joined.',
      go_home: 'Go to Dashboard',
      error_title: 'Invalid Invite',
      error_invalid: 'This invite link is invalid or has expired.',
      error_generic: 'Something went wrong. Please try again.',
      try_again: 'Try Again',
    },
    ru: {
      loading: 'Проверка приглашения...',
      needs_auth_title: 'Войдите, чтобы принять приглашение',
      needs_auth_desc: 'Вам нужно войти или создать аккаунт, чтобы присоединиться к семье.',
      sign_in: 'Войти',
      accepting: 'Присоединение к семье...',
      success_title: 'Добро пожаловать в семью!',
      success_desc: 'Вы успешно присоединились.',
      go_home: 'Перейти на главную',
      error_title: 'Недействительное приглашение',
      error_invalid: 'Эта ссылка недействительна или истекла.',
      error_generic: 'Что-то пошло не так. Попробуйте снова.',
      try_again: 'Попробовать снова',
    },
  }[language];

  // Once auth is ready
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setState('needs-auth');
      return;
    }

    if (!token) {
      setState('error');
      setErrorMessage(t.error_invalid);
      return;
    }

    // Accept invite
    const accept = async () => {
      setState('accepting');
      try {
        const { data, error } = await supabase.rpc('accept_family_invite', {
          p_token: token,
        });

        if (error) throw error;

        if (!data || data.length === 0) {
          throw new Error('No data returned');
        }

        toast.success(t.success_title);
        setState('success');
      } catch (err: any) {
        console.error('Accept invite error:', err);
        setState('error');
        if (err.message?.includes('Invalid') || err.message?.includes('expired')) {
          setErrorMessage(t.error_invalid);
        } else {
          setErrorMessage(t.error_generic);
        }
      }
    };

    accept();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, token]);

  // UI helper
  const renderContent = () => {
    switch (state) {
      case 'loading':
      case 'accepting':
        return (
          <div className="text-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">
              {state === 'loading' ? t.loading : t.accepting}
            </p>
          </div>
        );

      case 'needs-auth':
        return (
          <div className="text-center space-y-4">
            <GroweeCharacter size="lg" className="mx-auto" />
            <h2 className="text-xl font-bold">{t.needs_auth_title}</h2>
            <p className="text-muted-foreground">{t.needs_auth_desc}</p>
            <Button asChild className="w-full rounded-xl h-12 mt-4">
              <Link to={`/auth?redirect=/invite/${token}`}>
                <LogIn className="w-5 h-5 mr-2" />
                {t.sign_in}
              </Link>
            </Button>
          </div>
        );

      case 'success':
        return (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/20 mx-auto flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold">{t.success_title}</h2>
            <p className="text-muted-foreground">{t.success_desc}</p>
            <Button onClick={() => navigate('/', { replace: true })} className="w-full rounded-xl h-12 mt-4">
              {t.go_home}
            </Button>
          </div>
        );

      case 'error':
        return (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-destructive/20 mx-auto flex items-center justify-center">
              <XCircle className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-xl font-bold">{t.error_title}</h2>
            <p className="text-muted-foreground">{errorMessage}</p>
            <Button variant="outline" onClick={() => navigate('/auth', { replace: true })} className="w-full rounded-xl h-12 mt-4">
              {t.try_again}
            </Button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md bg-card rounded-3xl p-6 border border-border">
        {renderContent()}
      </div>
    </div>
  );
};
