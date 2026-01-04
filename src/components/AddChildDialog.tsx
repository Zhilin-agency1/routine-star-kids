import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Loader2, User } from 'lucide-react';
import { useChildren } from '@/hooks/useChildren';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const avatarEmojis = [
  '🦁', '🦊', '🐼', '🐨', '🐯', '🦄', '🐰', '🐸',
  '🦋', '🐙', '🦖', '🐳', '🦩', '🦜', '🐶', '🐱',
  '🧸', '🎈', '⭐', '🌈', '🚀', '🎸', '⚽', '🎨',
];

// Schema with dynamic messages based on language is not possible with zod
// We'll use generic messages and override display in the form
const childSchema = z.object({
  name: z.string()
    .trim()
    .min(1)
    .max(50),
  balance: z.number()
    .min(0)
    .max(10000),
  languagePreference: z.enum(['ru', 'en']),
});

type ChildFormData = z.infer<typeof childSchema>;

interface AddChildDialogProps {
  trigger?: React.ReactNode;
}

export const AddChildDialog = ({ trigger }: AddChildDialogProps) => {
  const { t, language } = useLanguage();
  const [open, setOpen] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(avatarEmojis[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createChild } = useChildren();

  const form = useForm<ChildFormData>({
    resolver: zodResolver(childSchema),
    defaultValues: {
      name: '',
      balance: 0,
      languagePreference: 'ru',
    },
  });

  const handleSubmit = async (data: ChildFormData) => {
    setIsSubmitting(true);
    try {
      await createChild.mutateAsync({
        name: data.name,
        avatar_url: selectedAvatar,
        balance: data.balance,
        language_preference: data.languagePreference,
      });
      toast.success(`${data.name} ${t('child_added')}`);
      setOpen(false);
      form.reset();
      setSelectedAvatar(avatarEmojis[0]);
    } catch (error: any) {
      toast.error(error.message || t('add_child_error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" className="rounded-xl">
            <Plus className="w-4 h-4 mr-1" />
            {t('add_child')}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            {t('add_child_title')}
          </DialogTitle>
          <DialogDescription>
            {t('child_info_desc')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Avatar Selection */}
          <div className="space-y-3">
            <Label>{t('select_avatar')}</Label>
            <div className="grid grid-cols-8 gap-2">
              {avatarEmojis.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setSelectedAvatar(emoji)}
                  className={cn(
                    "w-10 h-10 rounded-xl text-2xl flex items-center justify-center transition-all",
                    selectedAvatar === emoji
                      ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 scale-110"
                      : "bg-muted hover:bg-muted/80"
                  )}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Name Input */}
          <div className="space-y-2">
            <Label htmlFor="child-name">{t('name_label')}</Label>
            <Input
              id="child-name"
              placeholder={t('name_placeholder')}
              className="rounded-xl"
              {...form.register('name')}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{t('name_required')}</p>
            )}
          </div>

          {/* Initial Balance */}
          <div className="space-y-2">
            <Label htmlFor="child-balance">{t('initial_balance')}</Label>
            <div className="relative">
              <Input
                id="child-balance"
                type="number"
                min={0}
                max={10000}
                placeholder="0"
                className="rounded-xl pr-12"
                {...form.register('balance', { valueAsNumber: true })}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-lg">💰</span>
            </div>
            {form.formState.errors.balance && (
              <p className="text-sm text-destructive">{t('balance_negative')}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {t('balance_tip')}
            </p>
          </div>

          {/* Language Preference */}
          <div className="space-y-2">
            <Label>{t('interface_language')}</Label>
            <Select
              value={form.watch('languagePreference')}
              onValueChange={(value: 'ru' | 'en') => form.setValue('languagePreference', value)}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ru">🇷🇺 Русский</SelectItem>
                <SelectItem value="en">🇺🇸 English</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={() => setOpen(false)}
            >
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              className="flex-1 rounded-xl"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              {t('add')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};