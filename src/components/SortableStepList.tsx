import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { GripVertical, X, Gift, EyeOff, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

export interface SortableStep {
  id?: string;
  title_ru: string;
  title_en: string;
  due_date?: string | null;
  bonus_amount: number;
  bonus_hidden: boolean;
}

interface SortableStepItemProps {
  step: SortableStep;
  index: number;
  onRemove: () => void;
}

const SortableStepItem = ({ step, index, onRemove }: SortableStepItemProps) => {
  const { language } = useLanguage();
  const locale = language === 'ru' ? ru : undefined;
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: step.id || `step-${index}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "bg-muted/50 rounded-lg p-2 space-y-1 group",
        isDragging && "opacity-50 shadow-lg ring-2 ring-primary/30"
      )}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="touch-none cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-4 h-4" />
        </button>
        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-medium">
          {index + 1}
        </span>
        <span className="flex-1 text-sm truncate">
          {language === 'ru' ? step.title_ru : step.title_en}
        </span>
        {step.bonus_amount > 0 && (
          <span className={cn(
            "text-xs px-1.5 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0",
            step.bonus_hidden ? "bg-muted-foreground/20" : "bg-amber-500/20 text-amber-600"
          )}>
            {step.bonus_hidden ? <EyeOff className="w-3 h-3" /> : <Gift className="w-3 h-3" />}
            +{step.bonus_amount}
          </span>
        )}
        <button
          type="button"
          onClick={onRemove}
          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      {step.due_date && (
        <div className="ml-8 text-xs text-muted-foreground flex items-center gap-1">
          <CalendarIcon className="w-3 h-3" />
          {language === 'ru' ? 'До:' : 'Due:'} {format(new Date(step.due_date), 'dd.MM.yyyy', { locale })}
        </div>
      )}
    </div>
  );
};

interface SortableStepListProps {
  steps: SortableStep[];
  onReorder: (steps: SortableStep[]) => void;
  onRemove: (index: number) => void;
}

export const SortableStepList = ({ steps, onReorder, onRemove }: SortableStepListProps) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = steps.findIndex((s, i) => (s.id || `step-${i}`) === active.id);
      const newIndex = steps.findIndex((s, i) => (s.id || `step-${i}`) === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        onReorder(arrayMove(steps, oldIndex, newIndex));
      }
    }
  };

  if (steps.length === 0) {
    return null;
  }

  const stepIds = steps.map((s, i) => s.id || `step-${i}`);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={stepIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {steps.map((step, index) => (
            <SortableStepItem
              key={step.id || `step-${index}`}
              step={step}
              index={index}
              onRemove={() => onRemove(index)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};
