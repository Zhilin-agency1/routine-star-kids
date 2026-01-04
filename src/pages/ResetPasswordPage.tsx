import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, Eye, EyeOff, Loader2, KeyRound, AlertCircle, CheckCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { GroweeCharacter } from '@/components/ui/GroweeCharacter';

type ResetFormData = {
  password: string;
  confirmPassword: string;
};

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

export const ResetPasswordPage = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Check for valid session on mount
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setHasSession(!!session);
    };
    checkSession();

    // Listen for auth state changes (recovery link will trigger this)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setHasSession(true);
      } else if (session) {
        setHasSession(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Create schema with translated messages
  const resetSchema = useMemo(() => z.object({
    password: z.string()
      .min(1, { message: t('password_required') })
      .min(8, { message: t('password_min_8_chars') })
      .max(72, { message: t('password_too_long') }),
    confirmPassword: z.string()
      .min(1, { message: t('confirm_password_required') }),
  }).refine((data) => data.password === data.confirmPassword, {
    message: t('passwords_dont_match'),
    path: ['confirmPassword'],
  }), [t]);

  const form = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  // Reset form validation when language changes
  useEffect(() => {
    form.clearErrors();
  }, [language, form]);

  const handleReset = async (data: ResetFormData) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (error) {
        toast.error(error.message || t('reset_error'));
      } else {
        setIsSuccess(true);
        toast.success(t('password_updated'));
        // Sign out and redirect to login after a short delay
        setTimeout(async () => {
          await supabase.auth.signOut();
          navigate('/auth', { replace: true });
        }, 2000);
      }
    } catch (err) {
      toast.error(t('reset_occurred_error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (hasSession === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4 relative">
        <LanguageToggle />
        
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <GroweeCharacter size="lg" className="mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-foreground">Growee</h1>
          </div>

          <div className="bg-card rounded-3xl p-6 border border-border text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/20 mx-auto mb-4 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            
            <h2 className="text-xl font-bold mb-2">
              {t('password_updated')}
            </h2>
            
            <p className="text-muted-foreground">
              {t('redirecting_to_login')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // No session - show error
  if (!hasSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4 relative">
        <LanguageToggle />
        
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <GroweeCharacter size="lg" className="mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-foreground">Growee</h1>
          </div>

          <div className="bg-card rounded-3xl p-6 border border-border text-center">
            <div className="w-16 h-16 rounded-full bg-destructive/20 mx-auto mb-4 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            
            <h2 className="text-xl font-bold mb-2">
              {t('reset_link_expired')}
            </h2>
            
            <p className="text-muted-foreground mb-6">
              {t('open_from_email_link')}
            </p>

            <Button
              onClick={() => navigate('/auth')}
              className="w-full rounded-xl h-12"
            >
              {t('back_to_login')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Has session - show reset form
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative">
      <LanguageToggle />
      
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <GroweeCharacter size="lg" className="mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-foreground">Growee</h1>
        </div>

        <div className="bg-card rounded-3xl p-6 border border-border">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-full bg-primary/20 mx-auto mb-3 flex items-center justify-center">
              <KeyRound className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-xl font-bold">{t('reset_password_title')}</h2>
            <p className="text-muted-foreground text-sm mt-1">
              {t('reset_password_desc')}
            </p>
          </div>

          <form onSubmit={form.handleSubmit(handleReset)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">{t('new_password')}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('min_8_chars')}
                  className="pl-10 pr-10 rounded-xl"
                  {...form.register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {form.formState.errors.password && (
                <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-new-password">{t('confirm_password')}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="confirm-new-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('repeat_password')}
                  className="pl-10 rounded-xl"
                  {...form.register('confirmPassword')}
                />
              </div>
              {form.formState.errors.confirmPassword && (
                <p className="text-sm text-destructive">{form.formState.errors.confirmPassword.message}</p>
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
                <KeyRound className="w-5 h-5 mr-2" />
              )}
              {t('update_password')}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
