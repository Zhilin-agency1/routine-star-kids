import { Lock, Check } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from '@/components/ui/drawer';

interface PaywallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PaywallDialog = ({ open, onOpenChange }: PaywallDialogProps) => {
  const { language } = useLanguage();
  const isMobile = useIsMobile();

  const title = language === 'ru' 
    ? 'Превратите рутину в систему для вашей семьи'
    : "Turn routines into your family's system";

  const body = language === 'ru'
    ? 'Применять шаблоны можно бесплатно.\nРедактирование и настройка помогут вашим детям следовать распорядку, который подходит именно вашей семье.'
    : 'You can apply templates for free.\nEditing and customizing them helps your kids follow routines that actually fit your family.';

  const bullets = language === 'ru'
    ? [
        'Редактируйте задачи и награды',
        'Меняйте время и порядок',
        'Создавайте шаблоны для своих детей',
      ]
    : [
        'Edit tasks and rewards',
        'Adjust time and order',
        'Create templates for your kids',
      ];

  const ctaText = language === 'ru' ? 'Разблокировать Family Plan' : 'Unlock Family Plan';
  const cancelText = language === 'ru' ? 'Отменить можно в любое время.' : 'Cancel anytime.';

  const content = (
    <div className="space-y-4 py-4 px-1">
      <p className="text-muted-foreground text-center text-sm whitespace-pre-line leading-relaxed">
        {body}
      </p>

      <ul className="space-y-3">
        {bullets.map((bullet, i) => (
          <li key={i} className="flex items-center gap-3 text-sm">
            <div className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
              <Check className="w-3.5 h-3.5 text-success" />
            </div>
            <span>{bullet}</span>
          </li>
        ))}
      </ul>
    </div>
  );

  const footer = (
    <div className="flex flex-col gap-2 w-full pb-safe">
      <Button className="w-full" size="lg">
        {ctaText}
      </Button>
      <p className="text-xs text-muted-foreground text-center">
        {cancelText}
      </p>
    </div>
  );

  const header = (
    <>
      <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <Lock className="w-8 h-8 text-primary" />
      </div>
      <div className="text-center text-xl font-semibold">
        {title}
      </div>
    </>
  );

  // Use Drawer (bottom sheet) on mobile, Dialog on desktop
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="px-4">
          <DrawerHeader className="text-center pt-6">
            {header}
          </DrawerHeader>
          {content}
          <DrawerFooter className="px-0">
            {footer}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm sm:max-w-md">
        <DialogHeader className="space-y-4">
          {header}
        </DialogHeader>
        {content}
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          {footer}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
