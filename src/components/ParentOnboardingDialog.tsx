import { useState } from 'react';
import { Users, CheckCircle, Gift, Sparkles, ChevronRight, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogClose,
} from '@/components/ui/dialog';

interface ParentOnboardingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

interface OnboardingStep {
  icon: React.ReactNode;
  titleRu: string;
  titleEn: string;
  textRu: string;
  textEn: string;
  bullets?: { ru: string; en: string }[];
  ctaRu: string;
  ctaEn: string;
  action?: 'add_child' | 'go_today' | 'go_store' | 'complete';
}

const onboardingSteps: OnboardingStep[] = [
  {
    icon: <Users className="w-10 h-10 text-primary" />,
    titleRu: 'Добавьте детей',
    titleEn: 'Add Children',
    textRu: 'У каждого ребёнка — свои задачи и баланс.',
    textEn: 'Each child has their own tasks and balance.',
    ctaRu: 'Добавить ребёнка',
    ctaEn: 'Add Child',
    action: 'add_child',
  },
  {
    icon: <CheckCircle className="w-10 h-10 text-primary" />,
    titleRu: 'План → Выполнение → Монеты',
    titleEn: 'Plan → Complete → Coins',
    textRu: '',
    textEn: '',
    bullets: [
      { ru: 'Вы задаёте план дня', en: 'You set the daily plan' },
      { ru: 'Ребёнок выполняет задачи', en: 'Child completes tasks' },
      { ru: 'За выполнение начисляются монеты', en: 'Coins are awarded for completion' },
    ],
    ctaRu: 'Понятно',
    ctaEn: 'Got it',
  },
  {
    icon: <Gift className="w-10 h-10 text-primary" />,
    titleRu: 'Монеты → Награды',
    titleEn: 'Coins → Rewards',
    textRu: 'Настройте магазин, чтобы мотивировать детей.',
    textEn: 'Set up the store to motivate your children.',
    ctaRu: 'Открыть магазин',
    ctaEn: 'Open Store',
    action: 'go_store',
  },
  {
    icon: <Sparkles className="w-10 h-10 text-primary" />,
    titleRu: 'Готово!',
    titleEn: 'All Set!',
    textRu: 'Начните с сегодняшнего дня — примените план и проверьте прогресс.',
    textEn: 'Start with today — apply a plan and check progress.',
    ctaRu: 'Перейти к Сегодня',
    ctaEn: 'Go to Today',
    action: 'complete',
  },
];

export const ParentOnboardingDialog = ({
  open,
  onOpenChange,
  onComplete,
}: ParentOnboardingDialogProps) => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);

  const step = onboardingSteps[currentStep];
  const isLastStep = currentStep === onboardingSteps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
      onOpenChange(false);
      navigate('/parent');
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleSkip = () => {
    onComplete();
    onOpenChange(false);
  };

  const handleCtaAction = () => {
    switch (step.action) {
      case 'add_child':
        // Just move to next step - adding child is optional
        setCurrentStep(prev => prev + 1);
        break;
      case 'go_store':
        onComplete();
        onOpenChange(false);
        navigate('/parent/store');
        break;
      case 'complete':
        onComplete();
        onOpenChange(false);
        navigate('/parent');
        break;
      default:
        setCurrentStep(prev => prev + 1);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        handleSkip();
      }
    }}>
      <DialogContent className="max-w-sm sm:max-w-md p-0 gap-0 overflow-hidden [&>button:last-child]:hidden">
        {/* Custom close button - higher z-index, proper button element */}
        <button
          type="button"
          onClick={handleSkip}
          aria-label="Close"
          className="absolute right-4 top-4 p-2 text-muted-foreground hover:text-foreground transition-colors z-50 rounded-sm hover:bg-muted"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 space-y-6">
          {/* Progress dots */}
          <div className="flex justify-center gap-2">
            {onboardingSteps.map((_, idx) => (
              <div
                key={idx}
                className={`w-2 h-2 rounded-full transition-colors ${
                  idx === currentStep ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>

          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              {step.icon}
            </div>
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold text-center leading-snug break-words">
            {language === 'ru' ? step.titleRu : step.titleEn}
          </h2>

          {/* Text or bullets */}
          {step.bullets ? (
            <ul className="space-y-3">
              {step.bullets.map((bullet, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary">{i + 1}</span>
                  </div>
                  <span className="leading-snug break-words">
                    {language === 'ru' ? bullet.ru : bullet.en}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-muted-foreground text-sm leading-snug break-words">
              {language === 'ru' ? step.textRu : step.textEn}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 pt-0 space-y-3">
          <Button
            onClick={handleCtaAction}
            className="w-full min-h-[48px] text-base font-semibold"
          >
            {language === 'ru' ? step.ctaRu : step.ctaEn}
            <ChevronRight className="w-5 h-5 ml-1" />
          </Button>
          
          {!isLastStep && (
            <Button
              variant="ghost"
              onClick={handleSkip}
              className="w-full text-sm text-muted-foreground"
            >
              {language === 'ru' ? 'Пропустить' : 'Skip'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};