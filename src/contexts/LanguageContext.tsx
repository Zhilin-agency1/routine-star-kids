import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { translations, Language, TranslationKey } from '@/i18n/translations';
import { supabase } from '@/integrations/supabase/client';

const LANGUAGE_STORAGE_KEY = 'app_lang';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
  syncLanguageFromProfile: () => Promise<void>;
}

// Default context value for safe fallback
const defaultContextValue: LanguageContextType = {
  language: 'en',
  setLanguage: () => {},
  t: (key: TranslationKey) => translations.en[key] || key,
  syncLanguageFromProfile: async () => {},
};

const LanguageContext = createContext<LanguageContextType>(defaultContextValue);

const getInitialLanguage = (): Language => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored === 'ru' || stored === 'en') {
      return stored;
    }
  }
  // Default to English on first visit
  return 'en';
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);
  const [userId, setUserId] = useState<string | null>(null);

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const newUserId = session?.user?.id ?? null;
        setUserId(newUserId);
        
        // On login, sync language from profile
        if (event === 'SIGNED_IN' && newUserId) {
          syncLanguageFromProfileInternal(newUserId);
        }
      }
    );

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const newUserId = session?.user?.id ?? null;
      setUserId(newUserId);
      if (newUserId) {
        syncLanguageFromProfileInternal(newUserId);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Internal function to sync language from profile
  const syncLanguageFromProfileInternal = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('language_preference')
        .eq('user_id', uid)
        .single();

      if (!error && data?.language_preference) {
        const profileLang = data.language_preference as Language;
        if (profileLang === 'en' || profileLang === 'ru') {
          setLanguageState(profileLang);
          localStorage.setItem(LANGUAGE_STORAGE_KEY, profileLang);
        }
      }
    } catch (err) {
      console.error('Error syncing language from profile:', err);
    }
  };

  // Public function to sync language from profile
  const syncLanguageFromProfile = useCallback(async () => {
    if (userId) {
      await syncLanguageFromProfileInternal(userId);
    }
  }, [userId]);

  // Set language - updates state, localStorage, and profile if logged in
  const setLanguage = useCallback(async (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);

    // If user is logged in, update their profile preference
    if (userId) {
      try {
        await supabase
          .from('profiles')
          .update({ language_preference: lang })
          .eq('user_id', userId);
      } catch (err) {
        console.error('Error updating language preference:', err);
      }
    }
  }, [userId]);

  // Initialize localStorage on first render if not set
  useEffect(() => {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    }
  }, [language]);

  const t = useCallback((key: TranslationKey): string => {
    return translations[language][key] || key;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, syncLanguageFromProfile }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  // Return the context directly - it always has a default value now
  return context;
};
