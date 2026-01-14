import React, { useState, useMemo, useEffect } from 'react';
import { ChevronDown, ChevronUp, Sun, Moon, Pencil, Copy, Trash2, MoreHorizontal } from 'lucide-react';
import { format } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTasks } from '@/hooks/useTasks';
import { useChildren } from '@/hooks/useChildren';
import { useTaskSteps } from '@/hooks/useTaskSteps';
import { ChildAvatar } from '@/components/ui/ChildAvatar';
import { CoinBadge } from '@/components/ui/CoinBadge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type ViewMode = 'day' | 'week' | 'month';

interface RoutineBlocksProps {
  selectedDate: Date;
  selectedChildId: string | null;
  viewMode?: ViewMode;
  className?: string;
  onEditRoutine?: (templateId: string) => void;
  onCopyRoutine?: (templateId: string) => void;
}

interface RoutineItem {
  id: string;
  icon: string;
  title: string;
  time: string;
  childId: string | null;
  childName?: string;
  childAvatar?: string;
  reward: number;
  routineType?: 'morning' | 'evening' | null;
}

export const RoutineBlocks = ({
  selectedDate,
  selectedChildId,
  viewMode = 'day',
  className,
  onEditRoutine,
  onCopyRoutine,
}: RoutineBlocksProps) => {
  const { language, t } = useLanguage();
  const { templates, createTemplate, deleteTemplate } = useTasks();
  const { children } = useChildren();
  
  // Synchronized expanded state for both blocks
  const [blocksExpanded, setBlocksExpanded] = useState(false);
  
  // State for delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [routineToDelete, setRoutineToDelete] = useState<string | null>(null);
  
  // Reset expansion state when viewMode changes
  useEffect(() => {
    // Always collapse for all views
    setBlocksExpanded(false);
  }, [viewMode]);

  // Get routines for the selected date and child
  const routines = useMemo(() => {
    const dayOfWeek = selectedDate.getDay();
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    
    // Filter only routine tasks (not activities)
    const routineTemplates = templates.filter(t => 
      t.status === 'active' && 
      t.task_category === 'routine'
    );
    
    // Filter by child if selected
    const filteredTemplates = selectedChildId 
      ? routineTemplates.filter(t => t.child_id === selectedChildId || t.child_id === null)
      : routineTemplates;
    
    // Filter by date/day
    const activeRoutines = filteredTemplates.filter(template => {
      // Check date range
      const startDate = new Date(template.start_date);
      const endDate = template.end_date ? new Date(template.end_date) : null;
      
      if (selectedDate < startDate) return false;
      if (endDate && selectedDate > endDate) return false;
      
      // Check recurring days or one-time
      if (template.task_type === 'recurring') {
        return template.recurring_days?.includes(dayOfWeek) ?? false;
      } else {
        return template.one_time_date === dateStr;
      }
    });
    
    // Map to routine items with child info and routine_type
    return activeRoutines.map(template => {
      const child = template.child_id ? children.find(c => c.id === template.child_id) : null;
      return {
        id: template.id,
        icon: template.icon || '✨',
        title: language === 'ru' ? template.title_ru : template.title_en,
        time: template.recurring_time || '09:00',
        childId: template.child_id,
        childName: child?.name,
        childAvatar: child?.avatar_url || undefined,
        reward: template.reward_amount,
        routineType: (template as any).routine_type as 'morning' | 'evening' | null,
      };
    });
  }, [templates, children, selectedDate, selectedChildId, language]);

  // Split into morning and evening using routine_type field (fall back to time-based logic)
  const morningRoutines = useMemo(() => 
    routines
      .filter(r => {
        // Use routine_type if available, otherwise fall back to time-based logic
        if (r.routineType) return r.routineType === 'morning';
        const hour = parseInt(r.time.split(':')[0], 10);
        return hour < 12;
      })
      .sort((a, b) => a.time.localeCompare(b.time)),
    [routines]
  );

  const eveningRoutines = useMemo(() => 
    routines
      .filter(r => {
        // Use routine_type if available, otherwise fall back to time-based logic
        if (r.routineType) return r.routineType === 'evening';
        const hour = parseInt(r.time.split(':')[0], 10);
        return hour >= 12;
      })
      .sort((a, b) => a.time.localeCompare(b.time)),
    [routines]
  );

  const PREVIEW_COUNT = 3;

  const handleCopyRoutine = async (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;
    
    try {
      const copiedTitle_ru = `${template.title_ru} (${language === 'ru' ? 'Копия' : 'Copy'})`;
      const copiedTitle_en = `${template.title_en} (Copy)`;
      
      const newTemplate = await createTemplate.mutateAsync({
        title_ru: copiedTitle_ru,
        title_en: copiedTitle_en,
        description_ru: template.description_ru,
        description_en: template.description_en,
        icon: template.icon,
        reward_amount: template.reward_amount,
        task_type: template.task_type,
        task_category: template.task_category,
        recurring_days: template.recurring_days,
        recurring_time: template.recurring_time,
        end_time: template.end_time,
        child_id: template.child_id,
        start_date: template.start_date,
        end_date: template.end_date,
        one_time_date: template.one_time_date,
      });
      
      toast.success(language === 'ru' ? 'Рутина скопирована!' : 'Routine copied!');
      
      // Open the copied routine in edit mode
      if (onCopyRoutine) {
        onCopyRoutine(newTemplate.id);
      } else if (onEditRoutine) {
        onEditRoutine(newTemplate.id);
      }
    } catch (error) {
      toast.error(language === 'ru' ? 'Ошибка при копировании' : 'Failed to copy');
    }
  };

  const handleDeleteRoutine = async () => {
    if (!routineToDelete) return;
    
    try {
      await deleteTemplate.mutateAsync(routineToDelete);
      toast.success(language === 'ru' ? 'Рутина удалена!' : 'Routine deleted!');
      setDeleteDialogOpen(false);
      setRoutineToDelete(null);
    } catch (error) {
      toast.error(language === 'ru' ? 'Ошибка при удалении' : 'Failed to delete');
    }
  };

  const renderRoutineItem = (item: RoutineItem, compact = false) => (
    <div 
      key={item.id}
      className={cn(
        "w-full flex items-center gap-2 p-2 rounded-lg bg-muted/50 border border-border text-left transition-colors group",
        compact && "py-1.5"
      )}
    >
      <span className="text-lg shrink-0">{item.icon}</span>
      <div className="flex-1 min-w-0">
        <p className={cn(
          "font-medium break-words line-clamp-1 leading-snug",
          compact ? "text-xs" : "text-sm"
        )}>
          {item.title}
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-mono">{item.time.slice(0, 5)}</span>
          {!selectedChildId && item.childName && (
            <div className="flex items-center gap-1">
              <ChildAvatar avatar={item.childAvatar || '🦁'} size="xs" />
              <span className="truncate max-w-[60px]">{item.childName}</span>
            </div>
          )}
        </div>
      </div>
      <CoinBadge amount={item.reward} size="xs" />
      
      {/* Actions dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEditRoutine?.(item.id)}>
            <Pencil className="w-4 h-4 mr-2" />
            {language === 'ru' ? 'Редактировать' : 'Edit'}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleCopyRoutine(item.id)}>
            <Copy className="w-4 h-4 mr-2" />
            {language === 'ru' ? 'Копировать' : 'Copy'}
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => {
              setRoutineToDelete(item.id);
              setDeleteDialogOpen(true);
            }}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {language === 'ru' ? 'Удалить' : 'Delete'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  const renderBlock = (
    title: string,
    icon: React.ReactNode,
    items: RoutineItem[],
    expanded: boolean,
    onToggle: () => void,
    accentClass: string
  ) => {
    if (items.length === 0) return null;
    
    // Always collapsed by default, expand to show all
    const shouldShowItems = expanded;
    const displayItems = shouldShowItems ? items : [];
    const hasExpandToggle = items.length > 0;
    
    return (
      <div className={cn(
        "flex-1 min-w-[280px] rounded-xl border-2 p-3 bg-white",
        accentClass
      )}>
        <div className={cn(
          "flex items-center justify-between",
          shouldShowItems && displayItems.length > 0 && "mb-2"
        )}>
          <div className="flex items-center gap-2">
            {icon}
            <h3 className="font-bold text-sm">{title}</h3>
            <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
              {items.length}
            </span>
          </div>
          {hasExpandToggle && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="h-7 px-2 text-xs gap-1"
            >
              {expanded ? (
                <>
                  {language === 'ru' ? 'Скрыть' : 'Collapse'}
                  <ChevronUp className="w-3 h-3" />
                </>
              ) : (
                <>
                  {language === 'ru' ? 'Развернуть' : 'Expand'}
                  <ChevronDown className="w-3 h-3" />
                </>
              )}
            </Button>
          )}
        </div>
        
        {shouldShowItems && displayItems.length > 0 && (
          <div className="space-y-1.5">
            {displayItems.map(item => renderRoutineItem(item, !expanded))}
          </div>
        )}
      </div>
    );
  };

  // Don't render if no routines and child is selected
  if (routines.length === 0) {
    if (selectedChildId) {
      return null; // No message needed when filtering by child
    }
    return (
      <div className={cn("text-center py-4 text-sm text-muted-foreground", className)}>
        {language === 'ru' ? 'Нет рутин на этот день' : 'No routines for this day'}
      </div>
    );
  }

  // Synchronized toggle for both blocks
  const handleToggleBlocks = () => setBlocksExpanded(!blocksExpanded);

  return (
    <>
      <div className={cn("flex flex-col md:flex-row gap-3", className)}>
        {renderBlock(
          language === 'ru' ? 'Утренняя рутина' : 'Morning Routine',
          <Sun className="w-5 h-5 text-amber-500" />,
          morningRoutines,
          blocksExpanded,
          handleToggleBlocks,
          'border-amber-300 bg-amber-50/50'
        )}
        
        {renderBlock(
          language === 'ru' ? 'Вечерняя рутина' : 'Evening Routine',
          <Moon className="w-5 h-5 text-indigo-500" />,
          eveningRoutines,
          blocksExpanded,
          handleToggleBlocks,
          'border-indigo-300 bg-indigo-50/50'
        )}
      </div>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === 'ru' ? 'Удалить рутину?' : 'Delete routine?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'ru' 
                ? 'Это действие нельзя отменить. Рутина будет удалена навсегда.'
                : 'This action cannot be undone. The routine will be permanently deleted.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {language === 'ru' ? 'Отмена' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRoutine} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {language === 'ru' ? 'Удалить' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
