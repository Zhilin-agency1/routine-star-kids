import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Pencil, Loader2, User } from 'lucide-react';
import { useChildren, type Child } from '@/hooks/useChildren';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

const avatarEmojis = [
  '🦁', '🦊', '🐼', '🐨', '🐯', '🦄', '🐰', '🐸',
  '🦋', '🐙', '🦖', '🐳', '🦩', '🦜', '🐶', '🐱',
  '🧸', '🎈', '⭐', '🌈', '🚀', '🎸', '⚽', '🎨',
];

const childSchema = z.object({
  name: z.string()
    .trim()
    .min(1)
    .max(50),
});

type ChildFormData = z.infer<typeof childSchema>;

interface EditChildProfileDialogProps {
  child: Child;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (updatedChild: Child) => void;
}

export const EditChildProfileDialog = ({ 
  child, 
  open, 
  onOpenChange,
  onSuccess 
}: EditChildProfileDialogProps) => {
  const { language, t } = useLanguage();
  const [selectedAvatar, setSelectedAvatar] = useState(child.avatar_url || avatarEmojis[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { updateChild } = useChildren();

  const form = useForm<ChildFormData>({
    resolver: zodResolver(childSchema),
    defaultValues: {
      name: child.name,
    },
  });

  // Reset form when child changes or dialog opens
  useEffect(() => {
    if (open) {
      form.reset({ name: child.name });
      setSelectedAvatar(child.avatar_url || avatarEmojis[0]);
    }
  }, [open, child, form]);

  const handleSubmit = async (data: ChildFormData) => {
    setIsSubmitting(true);
    try {
      const result = await updateChild.mutateAsync({
        id: child.id,
        name: data.name,
        avatar_url: selectedAvatar,
      });
      
      toast.success(t('profile_updated'));
      onOpenChange(false);
      onSuccess?.(result);
    } catch (error: any) {
      toast.error(error.message || t('update_failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            {t('edit_profile')}
          </DialogTitle>
          <DialogDescription>
            {t('change_name_avatar')}
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
            <Label htmlFor="edit-child-name">{t('name_label')}</Label>
            <Input
              id="edit-child-name"
              placeholder={t('name_placeholder')}
              className="rounded-xl"
              {...form.register('name')}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{t('name_required')}</p>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={() => onOpenChange(false)}
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
                <Pencil className="w-4 h-4 mr-2" />
              )}
              {t('save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};