import { Check, ListChecks } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTaskSteps } from '@/hooks/useTaskSteps';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface TemplateStepsPreviewProps {
  templateId: string;
  compact?: boolean;
}

export const TemplateStepsPreview = ({ templateId, compact = false }: TemplateStepsPreviewProps) => {
  const { language } = useLanguage();
  const { steps, isLoading } = useTaskSteps(templateId);

  if (isLoading || steps.length === 0) {
    return null;
  }

  if (compact) {
    return (
      <span className="text-xs px-1.5 py-0.5 bg-muted rounded-full flex items-center gap-1">
        <ListChecks className="w-3 h-3" />
        {steps.length} {language === 'ru' ? 'шагов' : 'steps'}
      </span>
    );
  }

  return (
    <div className="mt-2 pt-2 border-t border-border/30">
      <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
        <ListChecks className="w-3 h-3" />
        {language === 'ru' ? 'Шаги:' : 'Steps:'}
      </p>
      <div className="space-y-1">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className="flex items-center gap-2 text-xs"
          >
            <div className="w-4 h-4 rounded-full border border-muted-foreground/30 flex items-center justify-center flex-shrink-0">
              <span className="text-[10px] text-muted-foreground">{index + 1}</span>
            </div>
            <span className="text-muted-foreground">
              {language === 'ru' ? step.title_ru : step.title_en}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
