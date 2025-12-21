import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useStore, type StoreItem } from '@/hooks/useStore';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

const STORE_ICONS = [
  '🎁', '🍦', '🍕', '🎮', '📱', '🎬', '🎪', '🎠',
  '🛍️', '🎈', '🍭', '🍩', '🎯', '🎨', '🎭', '🎪',
  '🚀', '🌟', '🎵', '📚', '⚽', '🏀', '🎾', '🎳',
  '🛹', '🎸', '🎺', '🎻', '🎤', '🎧', '🖥️', '💎',
];

const formSchema = z.object({
  name_en: z.string().trim().min(1, 'English name is required').max(100),
  name_ru: z.string().trim().min(1, 'Название на русском обязательно').max(100),
  price: z.number().min(1, 'Price must be at least 1').max(10000),
  icon: z.string().min(1, 'Icon is required'),
  active: z.boolean(),
});

type FormData = z.infer<typeof formSchema>;

interface EditStoreItemDialogProps {
  item: StoreItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditStoreItemDialog = ({ item, open, onOpenChange }: EditStoreItemDialogProps) => {
  const { updateItem } = useStore();
  const { language } = useLanguage();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name_en: '',
      name_ru: '',
      price: 10,
      icon: '🎁',
      active: true,
    },
  });

  useEffect(() => {
    if (item) {
      form.reset({
        name_en: item.name_en,
        name_ru: item.name_ru,
        price: item.price,
        icon: item.image_url || '🎁',
        active: item.active,
      });
    }
  }, [item, form]);

  const selectedIcon = form.watch('icon');

  const onSubmit = async (data: FormData) => {
    if (!item) return;
    
    try {
      await updateItem.mutateAsync({
        id: item.id,
        name_en: data.name_en,
        name_ru: data.name_ru,
        price: data.price,
        image_url: data.icon,
        active: data.active,
      });
      
      toast.success(language === 'ru' ? 'Товар обновлён!' : 'Item updated!');
      onOpenChange(false);
    } catch (error) {
      toast.error(language === 'ru' ? 'Ошибка при обновлении' : 'Failed to update item');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {language === 'ru' ? 'Редактировать товар' : 'Edit Store Item'}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Icon Selection */}
            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{language === 'ru' ? 'Иконка' : 'Icon'}</FormLabel>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="text-4xl bg-muted rounded-lg p-3">
                      {selectedIcon}
                    </div>
                  </div>
                  <div className="grid grid-cols-8 gap-1 p-2 bg-muted/50 rounded-lg max-h-32 overflow-y-auto">
                    {STORE_ICONS.map((icon) => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => field.onChange(icon)}
                        className={`text-xl p-1.5 rounded hover:bg-accent transition-colors ${
                          field.value === icon ? 'bg-primary/20 ring-2 ring-primary' : ''
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* English Name */}
            <FormField
              control={form.control}
              name="name_en"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>🇬🇧 {language === 'ru' ? 'Название (English)' : 'Name (English)'}</FormLabel>
                  <FormControl>
                    <Input placeholder="Ice cream" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Russian Name */}
            <FormField
              control={form.control}
              name="name_ru"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>🇷🇺 {language === 'ru' ? 'Название (Русский)' : 'Name (Russian)'}</FormLabel>
                  <FormControl>
                    <Input placeholder="Мороженое" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Price */}
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>💰 {language === 'ru' ? 'Цена (монет)' : 'Price (coins)'}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={10000}
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Active Status */}
            <FormField
              control={form.control}
              name="active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <FormLabel className="text-base">
                      {language === 'ru' ? 'Активен' : 'Active'}
                    </FormLabel>
                    <p className="text-sm text-muted-foreground">
                      {language === 'ru' ? 'Показывать в магазине детям' : 'Show to children in store'}
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                {language === 'ru' ? 'Отмена' : 'Cancel'}
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={updateItem.isPending}
              >
                {updateItem.isPending
                  ? (language === 'ru' ? 'Сохранение...' : 'Saving...')
                  : (language === 'ru' ? 'Сохранить' : 'Save')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
