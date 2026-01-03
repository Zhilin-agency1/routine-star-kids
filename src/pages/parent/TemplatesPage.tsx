import { useState } from 'react';
import { Plus, Copy, Trash2, MoreVertical, Play, Clock, Loader2, Eye } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDayTemplates, DayTemplateWithTasks, PRESET_TEMPLATES } from '@/hooks/useDayTemplates';
import { PresetTemplate } from '@/components/TemplatePreviewDialog';
import { Button } from '@/components/ui/button';
import { ApplyTemplateDialog } from '@/components/ApplyTemplateDialog';
import { EditDayTemplateDialog } from '@/components/EditDayTemplateDialog';
import { TemplatePreviewDialog } from '@/components/TemplatePreviewDialog';
import { CoinBadge } from '@/components/ui/CoinBadge';
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

export const TemplatesPage = () => {
  const { language } = useLanguage();
  const { templates, presets, isLoading, createFromPreset, deleteTemplate } = useDayTemplates();
  
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<DayTemplateWithTasks | undefined>();
  const [selectedPresetKey, setSelectedPresetKey] = useState<string | undefined>();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [templateToEdit, setTemplateToEdit] = useState<DayTemplateWithTasks | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);
  const [isCopying, setIsCopying] = useState<string | null>(null);
  
  // Preview dialog state
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<DayTemplateWithTasks | undefined>();
  const [previewPreset, setPreviewPreset] = useState<PresetTemplate | undefined>();

  const handleOpenPreview = (template?: DayTemplateWithTasks, preset?: PresetTemplate) => {
    setPreviewTemplate(template);
    setPreviewPreset(preset);
    setPreviewDialogOpen(true);
  };

  const handlePreviewApply = () => {
    setPreviewDialogOpen(false);
    if (previewTemplate) {
      handleApplyTemplate(previewTemplate);
    } else if (previewPreset) {
      handleApplyPreset(previewPreset.preset_key);
    }
  };

  const handlePreviewDuplicate = async () => {
    if (previewPreset) {
      setPreviewDialogOpen(false);
      await handleCopyPreset(previewPreset.preset_key);
    }
  };

  const handlePreviewEdit = () => {
    if (previewTemplate) {
      setPreviewDialogOpen(false);
      handleEditTemplate(previewTemplate);
    }
  };

  const handleApplyTemplate = (template: DayTemplateWithTasks) => {
    setSelectedTemplate(template);
    setSelectedPresetKey(undefined);
    setApplyDialogOpen(true);
  };

  const handleApplyPreset = (presetKey: string) => {
    setSelectedTemplate(undefined);
    setSelectedPresetKey(presetKey);
    setApplyDialogOpen(true);
  };

  const handleCopyPreset = async (presetKey: string) => {
    setIsCopying(presetKey);
    try {
      await createFromPreset.mutateAsync(presetKey);
      toast.success(language === 'ru' ? 'Шаблон скопирован!' : 'Template copied!');
    } catch (error) {
      toast.error(language === 'ru' ? 'Ошибка копирования' : 'Copy error');
    } finally {
      setIsCopying(null);
    }
  };

  const handleEditTemplate = (template: DayTemplateWithTasks) => {
    setTemplateToEdit(template);
    setEditDialogOpen(true);
  };

  const handleDeleteTemplate = async () => {
    if (!templateToDelete) return;
    try {
      await deleteTemplate.mutateAsync(templateToDelete);
      toast.success(language === 'ru' ? 'Шаблон удалён' : 'Template deleted');
    } catch (error) {
      toast.error(language === 'ru' ? 'Ошибка удаления' : 'Delete error');
    } finally {
      setDeleteDialogOpen(false);
      setTemplateToDelete(null);
    }
  };

  const handleCreateNew = () => {
    setTemplateToEdit(undefined);
    setEditDialogOpen(true);
  };

  const getTotalReward = (tasks: Array<{ reward_amount: number }>) => {
    return tasks.reduce((sum, t) => sum + t.reward_amount, 0);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto pb-24 sm:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">
            {language === 'ru' ? 'Шаблоны дня' : 'Day Templates'}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {language === 'ru' 
              ? 'Готовые планы на день для быстрого применения'
              : 'Ready-made day plans for quick application'}
          </p>
        </div>
        <Button onClick={handleCreateNew} className="rounded-xl w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          {language === 'ru' ? 'Создать' : 'Create'}
        </Button>
      </div>

      {/* User Templates */}
      {templates.length > 0 && (
        <section>
          <h2 className="text-base sm:text-lg font-semibold mb-3">
            {language === 'ru' ? 'Мои шаблоны' : 'My Templates'}
          </h2>
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map(template => (
              <div
                key={template.id}
                className="bg-card rounded-2xl p-4 shadow-card border border-border cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => handleOpenPreview(template, undefined)}
              >
                <div className="flex items-start justify-between mb-3 gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm sm:text-base truncate">
                      {language === 'ru' ? template.name_ru : template.name_en}
                    </h3>
                    <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground mt-1 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {template.tasks.length} {language === 'ru' ? 'задач' : 'tasks'}
                      </span>
                      <CoinBadge amount={getTotalReward(template.tasks)} size="sm" />
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 flex-shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditTemplate(template)}>
                        {language === 'ru' ? 'Редактировать' : 'Edit'}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setTemplateToDelete(template.id);
                          setDeleteDialogOpen(true);
                        }}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        {language === 'ru' ? 'Удалить' : 'Delete'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Preview tasks */}
                <div className="space-y-1 mb-3">
                  {template.tasks.slice(0, 4).map((task, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs sm:text-sm">
                      <span>{task.icon}</span>
                      <span className="truncate">
                        {language === 'ru' ? task.title_ru : task.title_en}
                      </span>
                    </div>
                  ))}
                  {template.tasks.length > 4 && (
                    <button 
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenPreview(template, undefined);
                      }}
                    >
                      <Eye className="w-3 h-3" />
                      +{template.tasks.length - 4} {language === 'ru' ? 'ещё' : 'more'}
                    </button>
                  )}
                </div>

                <Button
                  className="w-full rounded-xl"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleApplyTemplate(template);
                  }}
                >
                  <Play className="w-4 h-4 mr-2" />
                  {language === 'ru' ? 'Применить' : 'Apply'}
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Preset Templates */}
      <section>
        <h2 className="text-base sm:text-lg font-semibold mb-3">
          {language === 'ru' ? 'Готовые шаблоны' : 'Preset Templates'}
        </h2>
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {presets.map(preset => (
            <div
              key={preset.preset_key}
              className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl p-4 border border-border cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => handleOpenPreview(undefined, preset)}
            >
              <div className="flex items-start justify-between mb-3 gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-sm sm:text-base truncate">
                    {language === 'ru' ? preset.name_ru : preset.name_en}
                  </h3>
                  <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground mt-1 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {preset.tasks.length} {language === 'ru' ? 'задач' : 'tasks'}
                    </span>
                    <CoinBadge amount={getTotalReward(preset.tasks)} size="sm" />
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopyPreset(preset.preset_key);
                  }}
                  disabled={isCopying === preset.preset_key}
                >
                  {isCopying === preset.preset_key ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>

              {/* Preview tasks */}
              <div className="space-y-1 mb-3">
                {preset.tasks.slice(0, 4).map((task, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs sm:text-sm">
                    <span>{task.icon}</span>
                    <span className="truncate">
                      {language === 'ru' ? task.title_ru : task.title_en}
                    </span>
                  </div>
                ))}
                {preset.tasks.length > 4 && (
                  <button 
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenPreview(undefined, preset);
                    }}
                  >
                    <Eye className="w-3 h-3" />
                    +{preset.tasks.length - 4} {language === 'ru' ? 'ещё' : 'more'}
                  </button>
                )}
              </div>

              <Button
                className="w-full rounded-xl"
                onClick={(e) => {
                  e.stopPropagation();
                  handleApplyPreset(preset.preset_key);
                }}
              >
                <Play className="w-4 h-4 mr-2" />
                {language === 'ru' ? 'Применить' : 'Apply'}
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* Apply Template Dialog */}
      <ApplyTemplateDialog
        open={applyDialogOpen}
        onOpenChange={setApplyDialogOpen}
        template={selectedTemplate}
        presetKey={selectedPresetKey}
      />

      {/* Edit Template Dialog */}
      <EditDayTemplateDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        template={templateToEdit}
      />

      {/* Template Preview Dialog */}
      <TemplatePreviewDialog
        open={previewDialogOpen}
        onOpenChange={setPreviewDialogOpen}
        template={previewTemplate}
        preset={previewPreset}
        onApply={handlePreviewApply}
        onDuplicate={handlePreviewDuplicate}
        onEdit={handlePreviewEdit}
        isUserTemplate={!!previewTemplate}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === 'ru' ? 'Удалить шаблон?' : 'Delete template?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'ru'
                ? 'Это действие нельзя отменить. Шаблон будет удалён навсегда.'
                : 'This action cannot be undone. The template will be permanently deleted.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">
              {language === 'ru' ? 'Отмена' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTemplate}
              className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {language === 'ru' ? 'Удалить' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
