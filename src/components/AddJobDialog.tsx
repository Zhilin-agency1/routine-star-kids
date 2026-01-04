import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Users } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useJobBoard } from '@/hooks/useJobBoard';
import { useChildren } from '@/hooks/useChildren';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { CoinBadge } from './ui/CoinBadge';

const JOB_ICONS = [
  '💼', '🧹', '🍳', '🛒', '🚗', '🐕', '🌱', '📦',
  '🔧', '🎨', '📚', '💻', '🧺', '🍽️', '🛠️', '🏠',
  '✨', '🧽', '🚿', '🛏️', '🪴', '🗑️', '📧', '☎️',
  '🎁', '💡', '🔑', '📝', '🎯', '🏆', '⭐', '🌟',
];

const formSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(100),
  description: z.string().max(500).optional(),
  reward_amount: z.number().min(1, 'Reward must be at least 1').max(1000),
  icon: z.string().min(1, 'Icon is required'),
  child_id: z.string().nullable(),
});

type FormData = z.infer<typeof formSchema>;

interface AddJobDialogProps {
  trigger?: React.ReactNode;
}

export const AddJobDialog = ({ trigger }: AddJobDialogProps) => {
  const [open, setOpen] = useState(false);
  const { createJob } = useJobBoard();
  const { children } = useChildren();
  const { language } = useLanguage();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      reward_amount: 10,
      icon: '💼',
      child_id: null,
    },
  });

  const selectedIcon = form.watch('icon');

  const onSubmit = async (data: FormData) => {
    try {
      await createJob.mutateAsync({
        title_en: data.title,
        title_ru: data.title,
        description_en: data.description || null,
        description_ru: data.description || null,
        reward_amount: data.reward_amount,
        icon: data.icon,
        active: true,
        child_id: data.child_id || null,
      });
      
      toast.success(language === 'ru' ? 'Работа добавлена!' : 'Job added!');
      form.reset();
      setOpen(false);
    } catch (error) {
      toast.error(language === 'ru' ? 'Ошибка при добавлении' : 'Failed to add job');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" className="gap-1">
            <Plus className="h-4 w-4" />
            {language === 'ru' ? 'Добавить работу' : 'Add Job'}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {language === 'ru' ? 'Новая работа' : 'New Job'}
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
                    {JOB_ICONS.map((icon) => (
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

            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{language === 'ru' ? 'Название' : 'Title'}</FormLabel>
                  <FormControl>
                    <Input placeholder={language === 'ru' ? 'Помыть машину' : 'Wash the car'} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {language === 'ru' ? 'Описание' : 'Description'} 
                    <span className="text-muted-foreground ml-1">({language === 'ru' ? 'опционально' : 'optional'})</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder={language === 'ru' ? 'Вымыть и высушить семейную машину' : 'Wash and dry the family car'}
                      className="resize-none"
                      rows={2}
                      {...field} 
                    />
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

            {/* Reward */}
            <FormField
              control={form.control}
              name="reward_amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{language === 'ru' ? 'Награда' : 'Reward'}</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={1}
                        max={1000}
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

            {/* Preview */}
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-2">
                {language === 'ru' ? 'Предпросмотр:' : 'Preview:'}
              </p>
              <div className="flex items-start gap-3">
                <span className="text-2xl">{selectedIcon}</span>
                <div className="flex-1">
                  <p className="font-medium">
                    {form.watch('title') || (language === 'ru' ? 'Название' : 'Title')}
                  </p>
                  {form.watch('description') && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {form.watch('description')}
                    </p>
                  )}
                  {form.watch('child_id') && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {children.find(c => c.id === form.watch('child_id'))?.name}
                    </p>
                  )}
                </div>
                <CoinBadge amount={form.watch('reward_amount')} size="sm" />
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
                disabled={createJob.isPending}
              >
                {createJob.isPending
                  ? (language === 'ru' ? 'Добавление...' : 'Adding...')
                  : (language === 'ru' ? 'Добавить' : 'Add Job')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
