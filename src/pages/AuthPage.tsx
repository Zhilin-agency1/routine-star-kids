import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LogIn, UserPlus, Mail, Lock, Eye, EyeOff, Loader2, CheckCircle, RefreshCw, KeyRound } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { GroweeCharacter } from '@/components/ui/GroweeCharacter';

type LoginFormData = {
  email: string;
  password: string;
};

type SignupFormData = {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
};

type ForgotPasswordFormData = {
  email: string;
};

type AuthView = 'login' | 'signup' | 'confirm-email';

// Language toggle component
const LanguageToggle = () => {
  const { language, setLanguage } = useLanguage();
  
  return (
    <div className="absolute top-4 right-4 flex gap-1 bg-muted/50 rounded-lg p-1">
      <button
        onClick={() => setLanguage('en')}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
          language === 'en' 
            ? 'bg-primary text-primary-foreground' 
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        EN
      </button>
      <button
        onClick={() => setLanguage('ru')}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
          language === 'ru' 
            ? 'bg-primary text-primary-foreground' 
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        RU
      </button>
    </div>
  );
};

export const AuthPage = () => {
  const { t, language } = useLanguage();
  const { user, signIn, loading } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [authView, setAuthView] = useState<AuthView>('login');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string>('');
  const [isResending, setIsResending] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);

  // Create schemas with translated messages
  const loginSchema = useMemo(() => z.object({
    email: z.string()
      .trim()
      .min(1, { message: t('email_required') })
      .email({ message: t('invalid_email') })
      .max(255, { message: t('email_too_long') }),
    password: z.string()
      .min(1, { message: t('password_required') })
      .min(6, { message: t('password_min_length') })
      .max(72, { message: t('password_too_long') }),
  }), [t]);

  const signupSchema = useMemo(() => z.object({
    email: z.string()
      .trim()
      .min(1, { message: t('email_required') })
      .email({ message: t('invalid_email') })
      .max(255, { message: t('email_too_long') }),
    password: z.string()
      .min(1, { message: t('password_required') })
      .min(6, { message: t('password_min_length') })
      .max(72, { message: t('password_too_long') }),
    fullName: z.string()
      .trim()
      .min(1, { message: t('name_required') })
      .max(100, { message: t('name_too_long') }),
    confirmPassword: z.string()
      .min(1, { message: t('confirm_password_required') }),
  }).refine((data) => data.password === data.confirmPassword, {
    message: t('passwords_dont_match'),
    path: ['confirmPassword'],
  }), [t]);

  const forgotPasswordSchema = useMemo(() => z.object({
    email: z.string()
      .trim()
      .min(1, { message: t('email_required') })
      .email({ message: t('invalid_email') })
      .max(255, { message: t('email_too_long') }),
  }), [t]);

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const signupForm = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      fullName: '',
    },
  });

  const forgotPasswordForm = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  // Reset form validation when language changes
  useEffect(() => {
    loginForm.clearErrors();
    signupForm.clearErrors();
    forgotPasswordForm.clearErrors();
  }, [language, loginForm, signupForm, forgotPasswordForm]);

  // Reset form validation when language changes
  useEffect(() => {
    loginForm.clearErrors();
    signupForm.clearErrors();
  }, [language, loginForm, signupForm]);

  const handleLogin = async (data: LoginFormData) => {
    setIsSubmitting(true);
    try {
      const { error } = await signIn(data.email, data.password);
      if (error) {
        const errorMessage = error.message.toLowerCase();
        
        if (errorMessage.includes('invalid login credentials')) {
          toast.error(t('invalid_credentials'));
        } else if (errorMessage.includes('email not confirmed') || errorMessage.includes('email_not_confirmed') || errorMessage.includes('email not verified')) {
          setPendingEmail(data.email);
          setAuthView('confirm-email');
          toast.info(t('email_not_confirmed'));
        } else {
          toast.error(error.message || t('login_error'));
        }
      } else {
        toast.success(t('login_success'));
        navigate('/', { replace: true });
      }
    } catch (err) {
      toast.error(t('login_occurred_error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignup = async (data: SignupFormData) => {
    setIsSubmitting(true);
    try {
      const { error, data: signUpData } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: data.fullName,
          },
        },
      });

      if (error) {
        if (error.message.includes('User already registered')) {
          toast.error(t('user_exists'));
        } else if (error.message.includes('Password should be')) {
          toast.error(t('password_too_weak'));
        } else {
          toast.error(error.message || t('registration_error'));
        }
      } else {
        // Update profile with current language preference
        if (signUpData.user) {
          try {
            await supabase
              .from('profiles')
              .update({ language_preference: language })
              .eq('user_id', signUpData.user.id);
          } catch (err) {
            console.error('Error saving language preference:', err);
          }
        }

        const needsConfirmation = !signUpData.session || 
          (signUpData.user && signUpData.user.identities && signUpData.user.identities.length === 0) ||
          (signUpData.user && !signUpData.user.email_confirmed_at);
        
        if (needsConfirmation && signUpData.user && !signUpData.session) {
          setPendingEmail(data.email);
          setAuthView('confirm-email');
          toast.success(t('email_sent'));
        } else {
          toast.success(t('registration_success'));
          setActiveTab('login');
          setAuthView('login');
          loginForm.setValue('email', data.email);
        }
      }
    } catch (err) {
      toast.error(t('registration_occurred_error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async (data: ForgotPasswordFormData) => {
    setIsSendingReset(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: 'https://login.growee.app/auth/reset',
      });

      if (error) {
        toast.error(error.message || t('reset_link_error'));
      } else {
        toast.success(t('reset_link_sent'));
        setShowForgotPassword(false);
        forgotPasswordForm.reset();
      }
    } catch (err) {
      toast.error(t('reset_link_error'));
    } finally {
      setIsSendingReset(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!pendingEmail) return;
    
    setIsResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: pendingEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        toast.error(error.message || t('send_error'));
      } else {
        toast.success(t('email_resent'));
      }
    } catch (err) {
      toast.error(t('send_email_error'));
    } finally {
      setIsResending(false);
    }
  };

  const handleBackToLogin = () => {
    setAuthView('login');
    setActiveTab('login');
    if (pendingEmail) {
      loginForm.setValue('email', pendingEmail);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Email confirmation screen
  if (authView === 'confirm-email') {
    const confirmEmailDesc = t('confirm_email_desc').replace('{email}', pendingEmail);
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4 relative">
        <LanguageToggle />
        
        <div className="w-full max-w-md">
          {/* Logo/Header */}
          <div className="text-center mb-8">
            <GroweeCharacter size="lg" className="mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-foreground">Growee</h1>
          </div>

          {/* Confirmation Card */}
          <div className="bg-card rounded-3xl p-6 border border-border text-center">
            <div className="w-16 h-16 rounded-full bg-primary/30 mx-auto mb-4 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-secondary" />
            </div>
            
            <h2 className="text-xl font-bold mb-2">
              {t('confirm_email_title')}
            </h2>
            
            <p className="text-muted-foreground mb-6">
              {confirmEmailDesc}
            </p>

            <div className="space-y-3">
              <Button
                onClick={handleResendConfirmation}
                variant="outline"
                className="w-full rounded-xl h-12"
                disabled={isResending}
              >
                {isResending ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="w-5 h-5 mr-2" />
                )}
                {t('resend_email')}
              </Button>

              <Button
                onClick={handleBackToLogin}
                className="w-full rounded-xl h-12"
              >
                <LogIn className="w-5 h-5 mr-2" />
                {t('back_to_login')}
              </Button>
            </div>

            <p className="text-sm text-muted-foreground mt-6">
              {t('check_spam')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative">
      <LanguageToggle />
      
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <GroweeCharacter size="lg" animate className="mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-foreground">Growee</h1>
          <p className="text-muted-foreground mt-2">
            {t('app_tagline')}
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-card rounded-3xl p-6 border border-border">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'login' | 'signup')}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login" className="rounded-xl">
                <LogIn className="w-4 h-4 mr-2" />
                {t('login')}
              </TabsTrigger>
              <TabsTrigger value="signup" className="rounded-xl">
                <UserPlus className="w-4 h-4 mr-2" />
                {t('signup')}
              </TabsTrigger>
            </TabsList>

            {/* Login Form */}
            <TabsContent value="login">
              <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">{t('email')}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="email@example.com"
                      className="pl-10 rounded-xl"
                      {...loginForm.register('email')}
                    />
                  </div>
                  {loginForm.formState.errors.email && (
                    <p className="text-sm text-destructive">{loginForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password">{t('password')}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="pl-10 pr-10 rounded-xl"
                      {...loginForm.register('password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {loginForm.formState.errors.password && (
                    <p className="text-sm text-destructive">{loginForm.formState.errors.password.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full rounded-xl h-12 text-lg font-semibold"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  ) : (
                    <LogIn className="w-5 h-5 mr-2" />
                  )}
                  {t('login_btn')}
                </Button>

                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="w-full text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {t('forgot_password')}
                </button>
              </form>
            </TabsContent>

            {/* Signup Form */}
            <TabsContent value="signup">
              <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">{t('your_name')}</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder={language === 'ru' ? 'Иван Иванов' : 'John Doe'}
                    className="rounded-xl"
                    {...signupForm.register('fullName')}
                  />
                  {signupForm.formState.errors.fullName && (
                    <p className="text-sm text-destructive">{signupForm.formState.errors.fullName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email">{t('email')}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="email@example.com"
                      className="pl-10 rounded-xl"
                      {...signupForm.register('email')}
                    />
                  </div>
                  {signupForm.formState.errors.email && (
                    <p className="text-sm text-destructive">{signupForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">{t('password')}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="signup-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder={t('min_6_chars')}
                      className="pl-10 pr-10 rounded-xl"
                      {...signupForm.register('password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {signupForm.formState.errors.password && (
                    <p className="text-sm text-destructive">{signupForm.formState.errors.password.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-confirm">{t('confirm_password')}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="signup-confirm"
                      type={showPassword ? 'text' : 'password'}
                      placeholder={t('repeat_password')}
                      className="pl-10 rounded-xl"
                      {...signupForm.register('confirmPassword')}
                    />
                  </div>
                  {signupForm.formState.errors.confirmPassword && (
                    <p className="text-sm text-destructive">{signupForm.formState.errors.confirmPassword.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full rounded-xl h-12 text-lg font-semibold"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  ) : (
                    <UserPlus className="w-5 h-5 mr-2" />
                  )}
                  {t('signup_btn')}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  {t('terms_agreement')}
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Forgot Password Dialog */}
      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="w-5 h-5" />
              {t('forgot_password_title')}
            </DialogTitle>
            <DialogDescription>
              {t('forgot_password_desc')}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={forgotPasswordForm.handleSubmit(handleForgotPassword)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="forgot-email">{t('email')}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder="email@example.com"
                  className="pl-10 rounded-xl"
                  {...forgotPasswordForm.register('email')}
                />
              </div>
              {forgotPasswordForm.formState.errors.email && (
                <p className="text-sm text-destructive">{forgotPasswordForm.formState.errors.email.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full rounded-xl h-12"
              disabled={isSendingReset}
            >
              {isSendingReset ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <Mail className="w-5 h-5 mr-2" />
              )}
              {t('send_reset_link')}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AuthPage;
