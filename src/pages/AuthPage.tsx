import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LogIn, UserPlus, Mail, Lock, Eye, EyeOff, Loader2, CheckCircle, RefreshCw } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { GroweeCharacter } from '@/components/ui/GroweeCharacter';

const loginSchema = z.object({
  email: z.string()
    .trim()
    .min(1, { message: 'Email обязателен' })
    .email({ message: 'Некорректный email адрес' })
    .max(255, { message: 'Email не должен превышать 255 символов' }),
  password: z.string()
    .min(1, { message: 'Пароль обязателен' })
    .min(6, { message: 'Пароль должен быть минимум 6 символов' })
    .max(72, { message: 'Пароль не должен превышать 72 символа' }),
});

const signupSchema = loginSchema.extend({
  fullName: z.string()
    .trim()
    .min(1, { message: 'Имя обязательно' })
    .max(100, { message: 'Имя не должно превышать 100 символов' }),
  confirmPassword: z.string()
    .min(1, { message: 'Подтверждение пароля обязательно' }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Пароли не совпадают',
  path: ['confirmPassword'],
});

type LoginFormData = z.infer<typeof loginSchema>;
type SignupFormData = z.infer<typeof signupSchema>;

type AuthView = 'login' | 'signup' | 'confirm-email';

export const AuthPage = () => {
  const { t, language } = useLanguage();
  const { user, signIn, signUp, loading } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [authView, setAuthView] = useState<AuthView>('login');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string>('');
  const [isResending, setIsResending] = useState(false);

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

  const handleLogin = async (data: LoginFormData) => {
    setIsSubmitting(true);
    try {
      const { error } = await signIn(data.email, data.password);
      if (error) {
        const errorMessage = error.message.toLowerCase();
        
        if (errorMessage.includes('invalid login credentials')) {
          toast.error(language === 'ru' ? 'Неверный email или пароль' : 'Invalid email or password');
        } else if (errorMessage.includes('email not confirmed')) {
          // Show confirmation screen
          setPendingEmail(data.email);
          setAuthView('confirm-email');
          toast.info(language === 'ru' 
            ? 'Email не подтверждён. Проверьте почту' 
            : 'Email not confirmed. Check your inbox');
        } else if (errorMessage.includes('email_not_confirmed') || errorMessage.includes('email not verified')) {
          setPendingEmail(data.email);
          setAuthView('confirm-email');
          toast.info(language === 'ru' 
            ? 'Email не подтверждён. Проверьте почту' 
            : 'Email not confirmed. Check your inbox');
        } else {
          toast.error(error.message || (language === 'ru' ? 'Ошибка входа' : 'Login error'));
        }
      } else {
        toast.success(language === 'ru' ? 'Вход выполнен успешно!' : 'Login successful!');
        navigate('/', { replace: true });
      }
    } catch (err) {
      toast.error(language === 'ru' ? 'Произошла ошибка при входе' : 'An error occurred during login');
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
          toast.error(language === 'ru' 
            ? 'Пользователь с таким email уже существует' 
            : 'User with this email already exists');
        } else if (error.message.includes('Password should be')) {
          toast.error(language === 'ru' ? 'Пароль слишком простой' : 'Password is too weak');
        } else {
          toast.error(error.message || (language === 'ru' ? 'Ошибка регистрации' : 'Registration error'));
        }
      } else {
        // Check if email confirmation is required
        // If identities is empty or session is null, email confirmation is required
        const needsConfirmation = !signUpData.session || 
          (signUpData.user && signUpData.user.identities && signUpData.user.identities.length === 0) ||
          (signUpData.user && !signUpData.user.email_confirmed_at);
        
        if (needsConfirmation && signUpData.user && !signUpData.session) {
          // Email confirmation required - show confirmation screen
          setPendingEmail(data.email);
          setAuthView('confirm-email');
          toast.success(language === 'ru' 
            ? 'Письмо отправлено! Проверьте почту' 
            : 'Email sent! Check your inbox');
        } else {
          // Auto-confirm enabled - can login immediately
          toast.success(language === 'ru' ? 'Регистрация успешна! Можете войти' : 'Registration successful! You can now login');
          setActiveTab('login');
          setAuthView('login');
          loginForm.setValue('email', data.email);
        }
      }
    } catch (err) {
      toast.error(language === 'ru' ? 'Произошла ошибка при регистрации' : 'An error occurred during registration');
    } finally {
      setIsSubmitting(false);
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
        toast.error(error.message || (language === 'ru' ? 'Ошибка отправки' : 'Send error'));
      } else {
        toast.success(language === 'ru' 
          ? 'Письмо отправлено повторно!' 
          : 'Email resent successfully!');
      }
    } catch (err) {
      toast.error(language === 'ru' ? 'Ошибка отправки письма' : 'Error sending email');
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
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
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
              {language === 'ru' ? 'Подтвердите email' : 'Confirm your email'}
            </h2>
            
            <p className="text-muted-foreground mb-6">
              {language === 'ru' 
                ? `Мы отправили письмо на ${pendingEmail}. Перейдите по ссылке в письме, чтобы подтвердить аккаунт.`
                : `We sent an email to ${pendingEmail}. Click the link in the email to confirm your account.`}
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
                {language === 'ru' ? 'Отправить повторно' : 'Resend email'}
              </Button>

              <Button
                onClick={handleBackToLogin}
                className="w-full rounded-xl h-12"
              >
                <LogIn className="w-5 h-5 mr-2" />
                {language === 'ru' ? 'Вернуться ко входу' : 'Back to login'}
              </Button>
            </div>

            <p className="text-sm text-muted-foreground mt-6">
              {language === 'ru' 
                ? 'Проверьте папку "Спам", если не видите письмо'
                : 'Check your spam folder if you don\'t see the email'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <GroweeCharacter size="lg" animate className="mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-foreground">Growee</h1>
          <p className="text-muted-foreground mt-2">
            {language === 'ru' 
              ? 'Расти каждый день'
              : 'Grow every day'}
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-card rounded-3xl p-6 border border-border">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'login' | 'signup')}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login" className="rounded-xl">
                <LogIn className="w-4 h-4 mr-2" />
                {language === 'ru' ? 'Вход' : 'Login'}
              </TabsTrigger>
              <TabsTrigger value="signup" className="rounded-xl">
                <UserPlus className="w-4 h-4 mr-2" />
                {language === 'ru' ? 'Регистрация' : 'Sign up'}
              </TabsTrigger>
            </TabsList>

            {/* Login Form */}
            <TabsContent value="login">
              <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
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
                  <Label htmlFor="login-password">{language === 'ru' ? 'Пароль' : 'Password'}</Label>
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
                  {language === 'ru' ? 'Войти' : 'Login'}
                </Button>
              </form>
            </TabsContent>

            {/* Signup Form */}
            <TabsContent value="signup">
              <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">{language === 'ru' ? 'Ваше имя' : 'Your name'}</Label>
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
                  <Label htmlFor="signup-email">Email</Label>
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
                  <Label htmlFor="signup-password">{language === 'ru' ? 'Пароль' : 'Password'}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="signup-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder={language === 'ru' ? 'Минимум 6 символов' : 'At least 6 characters'}
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
                  <Label htmlFor="signup-confirm">{language === 'ru' ? 'Подтвердите пароль' : 'Confirm password'}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="signup-confirm"
                      type={showPassword ? 'text' : 'password'}
                      placeholder={language === 'ru' ? 'Повторите пароль' : 'Repeat password'}
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
                  {language === 'ru' ? 'Зарегистрироваться' : 'Sign up'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          {language === 'ru' 
            ? 'Создавая аккаунт, вы соглашаетесь с условиями использования'
            : 'By creating an account, you agree to the terms of service'}
        </p>
      </div>
    </div>
  );
};
