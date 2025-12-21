import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { useStore } from '@/hooks/useStore';
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
});

type FormData = z.infer<typeof formSchema>;

interface AddStoreItemDialogProps {
  trigger?: React.ReactNode;
}

export const AddStoreItemDialog = ({ trigger }: AddStoreItemDialogProps) => {
  const [open, setOpen] = useState(false);
  const { createItem } = useStore();
  const { t, language } = useLanguage();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name_en: '',
      name_ru: '',
      price: 10,
      icon: '🎁',
    },
  });

  const selectedIcon = form.watch('icon');

  const onSubmit = async (data: FormData) => {
    try {
      await createItem.mutateAsync({
        name_en: data.name_en,
        name_ru: data.name_ru,
        price: data.price,
        image_url: data.icon,
        active: true,
      });
      
      toast.success(language === 'ru' ? 'Товар добавлен!' : 'Item added!');
      form.reset();
      setOpen(false);
    } catch (error) {
      toast.error(language === 'ru' ? 'Ошибка при добавлении товара' : 'Failed to add item');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" className="gap-1">
            <Plus className="h-4 w-4" />
            {language === 'ru' ? 'Добавить товар' : 'Add Item'}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {language === 'ru' ? 'Новый товар' : 'New Store Item'}
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
                    <span className="text-sm text-muted-foreground">
                      {language === 'ru' ? 'Выберите иконку ниже' : 'Select icon below'}
                    </span>
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

            {/* Preview */}
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-2">
                {language === 'ru' ? 'Предпросмотр:' : 'Preview:'}
              </p>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{selectedIcon}</span>
                <div>
                  <p className="font-medium">
                    {form.watch('name_en') || (language === 'ru' ? 'Название' : 'Name')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {form.watch('name_ru') || (language === 'ru' ? 'Name' : 'Название')}
                  </p>
                </div>
                <span className="ml-auto font-bold text-primary">
                  {form.watch('price')} 🪙
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="flex-1"
              >
                {language === 'ru' ? 'Отмена' : 'Cancel'}
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={createItem.isPending}
              >
                {createItem.isPending
                  ? (language === 'ru' ? 'Добавление...' : 'Adding...')
                  : (language === 'ru' ? 'Добавить' : 'Add Item')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
