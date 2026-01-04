import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Users } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useStore, type StoreItem } from '@/hooks/useStore';
import { useChildren } from '@/hooks/useChildren';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { CoinBadge } from './ui/CoinBadge';

const STORE_ICONS = [
  '🎁', '🍦', '🍕', '🎮', '📱', '🎬', '🎪', '🎠',
  '🛍️', '🎈', '🍭', '🍩', '🎯', '🎨', '🎭', '🎪',
  '🚀', '🌟', '🎵', '📚', '⚽', '🏀', '🎾', '🎳',
  '🛹', '🎸', '🎺', '🎻', '🎤', '🎧', '🖥️', '💎',
];

const formSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  price: z.number().min(1, 'Price must be at least 1').max(10000),
  icon: z.string().min(1, 'Icon is required'),
  active: z.boolean(),
  child_id: z.string().nullable(),
});

type FormData = z.infer<typeof formSchema>;

interface EditStoreItemDialogProps {
  item: StoreItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditStoreItemDialog = ({ item, open, onOpenChange }: EditStoreItemDialogProps) => {
  const { updateItem } = useStore();
  const { children } = useChildren();
  const { language } = useLanguage();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      price: 10,
      icon: '🎁',
      active: true,
      child_id: null,
    },
  });

  useEffect(() => {
    if (item) {
      // Use name_en or name_ru as the name (they should be the same now)
      const name = item.name_en || item.name_ru;
      form.reset({
        name,
        price: item.price,
        icon: item.image_url || '🎁',
        active: item.active,
        child_id: (item as any).child_id || null,
      });
    }
  }, [item, form]);

  const selectedIcon = form.watch('icon');

  const onSubmit = async (data: FormData) => {
    if (!item) return;
    
    try {
      await updateItem.mutateAsync({
        id: item.id,
        name_en: data.name,
        name_ru: data.name,
        price: data.price,
        image_url: data.icon,
        active: data.active,
        child_id: data.child_id || null,
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

            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{language === 'ru' ? 'Название' : 'Name'}</FormLabel>
                  <FormControl>
                    <Input placeholder={language === 'ru' ? 'Мороженое' : 'Ice cream'} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Child Selector */}
            <FormField
              control={form.control}
              name="child_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{language === 'ru' ? 'Для кого' : 'For who'}</FormLabel>
                  <Select
                    value={field.value || 'all'}
                    onValueChange={(value) => field.onChange(value === 'all' ? null : value)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={language === 'ru' ? 'Выберите ребёнка' : 'Select child'} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="all">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          {language === 'ru' ? 'Все дети' : 'All children'}
                        </div>
                      </SelectItem>
                      {children.map((child) => (
                        <SelectItem key={child.id} value={child.id}>
                          <div className="flex items-center gap-2">
                            <span>{child.avatar_url || '🦁'}</span>
                            {child.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  <FormLabel>{language === 'ru' ? 'Цена' : 'Price'}</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={1}
                        max={10000}
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                      <CoinBadge amount={field.value} size="sm" />
                    </div>
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
