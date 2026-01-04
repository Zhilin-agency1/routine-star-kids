-- Update default language_preference from 'ru' to 'en'
ALTER TABLE public.profiles 
ALTER COLUMN language_preference SET DEFAULT 'en';

-- Add constraint to ensure only valid language values
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_language_preference_check;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_language_preference_check
CHECK (language_preference IS NULL OR language_preference IN ('en', 'ru'));