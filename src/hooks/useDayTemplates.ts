import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useFamily } from './useFamily';
import type { Database } from '@/integrations/supabase/types';

type DayTemplate = Database['public']['Tables']['day_templates']['Row'];
type DayTemplateTask = Database['public']['Tables']['day_template_tasks']['Row'];

export interface DayTemplateWithTasks extends DayTemplate {
  tasks: DayTemplateTask[];
}

// Preset templates data
export const PRESET_TEMPLATES = [
  // School Day - main preset
  {
    preset_key: 'school_day',
    name_ru: 'Школьный день',
    name_en: 'School Day',
    default_mode: 'replace' as const,
    tasks: [
      { title_ru: 'Проснуться и заправить кровать', title_en: 'Wake up & make bed', icon: '🛏️', time: '07:00', reward_amount: 5, duration_minutes: 5 },
      { title_ru: 'Почистить зубы и одеться', title_en: 'Brush teeth & get dressed', icon: '🪥', time: '07:10', reward_amount: 5, duration_minutes: 10 },
      { title_ru: 'Завтрак', title_en: 'Breakfast', icon: '🍳', time: '07:20', reward_amount: 0, duration_minutes: 15 },
      { title_ru: 'Собрать рюкзак / проверить школьные вещи', title_en: 'Pack backpack / check school items', icon: '🎒', time: '07:35', reward_amount: 5, duration_minutes: 5 },
      { title_ru: 'Перекус и короткий отдых (без экранов)', title_en: 'Snack & short rest (no screens)', icon: '🍎', time: '15:00', reward_amount: 0, duration_minutes: 15 },
      { title_ru: 'Домашнее задание / школьная работа', title_en: 'Homework / school task', icon: '📚', time: '15:30', reward_amount: 10, duration_minutes: 40 },
      { title_ru: 'Помощь по дому', title_en: 'Help around the house', icon: '🧹', time: '16:30', reward_amount: 5, duration_minutes: 15 },
      { title_ru: 'Свободное время / хобби', title_en: 'Free play / hobby time', icon: '🎮', time: '17:00', reward_amount: 0, duration_minutes: 25 },
      { title_ru: 'Подготовить одежду на завтра', title_en: 'Prepare clothes for tomorrow', icon: '👕', time: '20:00', reward_amount: 5, duration_minutes: 5 },
      { title_ru: 'Почистить зубы и вечерняя рутина', title_en: 'Brush teeth & bedtime routine', icon: '🌙', time: '20:30', reward_amount: 5, duration_minutes: 10 },
    ],
  },
  // After School Reset
  {
    preset_key: 'after_school_reset',
    name_ru: 'После школы',
    name_en: 'After School Reset',
    default_mode: 'add' as const,
    tasks: [
      { title_ru: 'Перекус и вода', title_en: 'Snack & water', icon: '🍎', time: '14:30', reward_amount: 0, duration_minutes: 10 },
      { title_ru: '15 мин тишины (без экранов)', title_en: '15 min quiet reset (no screens)', icon: '😌', time: '14:45', reward_amount: 0, duration_minutes: 15 },
      { title_ru: 'Домашнее задание / школьная работа', title_en: 'Homework / school task', icon: '📚', time: '15:00', reward_amount: 10, duration_minutes: 35 },
      { title_ru: 'Быстрая уборка комнаты', title_en: 'Quick room reset', icon: '🧹', time: '15:45', reward_amount: 5, duration_minutes: 10 },
      { title_ru: 'Собрать / подготовить на завтра', title_en: 'Pack / prep for tomorrow', icon: '🎒', time: '16:00', reward_amount: 5, duration_minutes: 5 },
      { title_ru: 'Свободное время / хобби', title_en: 'Free play / hobby time', icon: '🎮', time: '16:10', reward_amount: 0, duration_minutes: 20 },
    ],
  },
  // Weekend Clean & Help
  {
    preset_key: 'weekend_clean_help',
    name_ru: 'Выходные: уборка и помощь',
    name_en: 'Weekend Clean & Help',
    default_mode: 'replace' as const,
    tasks: [
      { title_ru: 'Заправить кровать + убрать одежду', title_en: 'Make bed + quick clothes pick-up', icon: '🛏️', time: '09:00', reward_amount: 5, duration_minutes: 10 },
      { title_ru: 'Завтрак', title_en: 'Breakfast', icon: '🍳', time: '09:15', reward_amount: 0, duration_minutes: 15 },
      { title_ru: 'Уборка комнаты: пол свободен + игрушки на месте', title_en: 'Room tidy: floor clear + toys in place', icon: '🧸', time: '09:30', reward_amount: 10, duration_minutes: 15 },
      { title_ru: 'Помощь: посуда / мусор / протереть стол', title_en: 'Help task: dishes / trash / wipe table', icon: '🍽️', time: '09:50', reward_amount: 10, duration_minutes: 15 },
      { title_ru: 'Обучение: чтение или практика навыков', title_en: 'Learning block: reading or skill practice', icon: '📖', time: '10:10', reward_amount: 5, duration_minutes: 20 },
      { title_ru: 'Прогулка / движение на свежем воздухе', title_en: 'Outdoor time / movement', icon: '🚴', time: '10:35', reward_amount: 0, duration_minutes: 30 },
      { title_ru: 'Семейная уборка: всё на места', title_en: 'Family reset: put things back', icon: '🏠', time: '11:10', reward_amount: 5, duration_minutes: 5 },
      { title_ru: 'Свободное время', title_en: 'Free time', icon: '🎉', time: '11:20', reward_amount: 0, duration_minutes: 30 },
    ],
  },
];

export const useDayTemplates = () => {
  const { family } = useFamily();
  const queryClient = useQueryClient();

  // Fetch all templates for the family
  const { data: templates = [], isLoading, refetch } = useQuery({
    queryKey: ['day_templates', family?.id],
    queryFn: async () => {
      if (!family) return [];

      const { data: templatesData, error: templatesError } = await supabase
        .from('day_templates')
        .select('*')
        .eq('family_id', family.id)
        .order('created_at', { ascending: false });

      if (templatesError) throw templatesError;

      // Fetch tasks for each template
      const templateIds = templatesData.map(t => t.id);
      const { data: tasksData, error: tasksError } = await supabase
        .from('day_template_tasks')
        .select('*')
        .in('day_template_id', templateIds)
        .order('order_index', { ascending: true });

      if (tasksError) throw tasksError;

      // Combine templates with their tasks
      return templatesData.map(template => ({
        ...template,
        tasks: tasksData.filter(task => task.day_template_id === template.id),
      })) as DayTemplateWithTasks[];
    },
    enabled: !!family,
  });

  // Create template from preset
  const createFromPreset = useMutation({
    mutationFn: async (presetKey: string) => {
      if (!family) throw new Error('Family not found');

      const preset = PRESET_TEMPLATES.find(p => p.preset_key === presetKey);
      if (!preset) throw new Error('Preset not found');

      // Create template
      const { data: template, error: templateError } = await supabase
        .from('day_templates')
        .insert({
          family_id: family.id,
          name_ru: preset.name_ru,
          name_en: preset.name_en,
          is_preset: false, // User copy is not a preset
          preset_key: preset.preset_key,
        })
        .select()
        .single();

      if (templateError) throw templateError;

      // Create tasks
      const tasksToInsert = preset.tasks.map((task, index) => ({
        day_template_id: template.id,
        title_ru: task.title_ru,
        title_en: task.title_en,
        icon: task.icon,
        time: task.time,
        reward_amount: task.reward_amount,
        order_index: index,
      }));

      const { error: tasksError } = await supabase
        .from('day_template_tasks')
        .insert(tasksToInsert);

      if (tasksError) throw tasksError;

      return template;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['day_templates'] });
    },
  });

  // Create custom template
  const createTemplate = useMutation({
    mutationFn: async ({
      name_ru,
      name_en,
      tasks,
    }: {
      name_ru: string;
      name_en: string;
      tasks: Array<{
        title_ru: string;
        title_en: string;
        icon?: string;
        time?: string;
        reward_amount?: number;
      }>;
    }) => {
      if (!family) throw new Error('Family not found');

      // Create template
      const { data: template, error: templateError } = await supabase
        .from('day_templates')
        .insert({
          family_id: family.id,
          name_ru,
          name_en,
          is_preset: false,
        })
        .select()
        .single();

      if (templateError) throw templateError;

      // Create tasks
      if (tasks.length > 0) {
        const tasksToInsert = tasks.map((task, index) => ({
          day_template_id: template.id,
          title_ru: task.title_ru,
          title_en: task.title_en,
          icon: task.icon || '✨',
          time: task.time,
          reward_amount: task.reward_amount || 5,
          order_index: index,
        }));

        const { error: tasksError } = await supabase
          .from('day_template_tasks')
          .insert(tasksToInsert);

        if (tasksError) throw tasksError;
      }

      return template;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['day_templates'] });
    },
  });

  // Update template
  const updateTemplate = useMutation({
    mutationFn: async ({
      id,
      name_ru,
      name_en,
      tasks,
    }: {
      id: string;
      name_ru: string;
      name_en: string;
      tasks: Array<{
        title_ru: string;
        title_en: string;
        icon?: string;
        time?: string;
        reward_amount?: number;
      }>;
    }) => {
      // Update template name
      const { error: templateError } = await supabase
        .from('day_templates')
        .update({ name_ru, name_en })
        .eq('id', id);

      if (templateError) throw templateError;

      // Delete existing tasks and recreate
      const { error: deleteError } = await supabase
        .from('day_template_tasks')
        .delete()
        .eq('day_template_id', id);

      if (deleteError) throw deleteError;

      // Create new tasks
      if (tasks.length > 0) {
        const tasksToInsert = tasks.map((task, index) => ({
          day_template_id: id,
          title_ru: task.title_ru,
          title_en: task.title_en,
          icon: task.icon || '✨',
          time: task.time,
          reward_amount: task.reward_amount || 5,
          order_index: index,
        }));

        const { error: tasksError } = await supabase
          .from('day_template_tasks')
          .insert(tasksToInsert);

        if (tasksError) throw tasksError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['day_templates'] });
    },
  });

  // Delete template
  const deleteTemplate = useMutation({
    mutationFn: async (templateId: string) => {
      const { error } = await supabase
        .from('day_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['day_templates'] });
    },
  });

  // Apply template to children for a specific date
  const applyTemplate = useMutation({
    mutationFn: async ({
      templateId,
      presetKey,
      childIds,
      date,
      mode,
    }: {
      templateId?: string;
      presetKey?: string;
      childIds: string[];
      date: Date;
      mode: 'replace' | 'add';
    }) => {
      if (!family) throw new Error('Family not found');

      // Get template tasks - either from DB or preset
      let tasks: Array<{
        title_ru: string;
        title_en: string;
        description_ru?: string;
        description_en?: string;
        icon: string;
        time?: string;
        reward_amount: number;
      }> = [];
      let templateName = '';

      if (templateId) {
        // Get template info
        const { data: templateData } = await supabase
          .from('day_templates')
          .select('name_ru, name_en')
          .eq('id', templateId)
          .single();
        templateName = templateData?.name_en || templateData?.name_ru || 'Custom Template';

        // Get tasks from database template
        const { data: dbTasks, error: tasksError } = await supabase
          .from('day_template_tasks')
          .select('*')
          .eq('day_template_id', templateId)
          .order('order_index', { ascending: true });

        if (tasksError) throw tasksError;
        tasks = dbTasks.map(t => ({
          title_ru: t.title_ru,
          title_en: t.title_en,
          description_ru: t.description_ru || undefined,
          description_en: t.description_en || undefined,
          icon: t.icon || '✨',
          time: t.time || undefined,
          reward_amount: t.reward_amount,
        }));
      } else if (presetKey) {
        // Get tasks from preset
        const preset = PRESET_TEMPLATES.find(p => p.preset_key === presetKey);
        if (!preset) throw new Error('Preset not found');
        templateName = preset.name_en;
        tasks = preset.tasks.map(t => ({
          title_ru: t.title_ru,
          title_en: t.title_en,
          icon: t.icon,
          time: t.time,
          reward_amount: t.reward_amount,
        }));
      } else {
        throw new Error('Either templateId or presetKey required');
      }

      // Format date
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      // For each child
      let totalTasksCreated = 0;
      let totalTasksSkipped = 0;
      
      for (const childId of childIds) {
        // If replace mode, delete existing tasks for that date
        if (mode === 'replace') {
          // Get existing instances for this child and date
          const { data: existingInstances } = await supabase
            .from('task_instances')
            .select('id, template_id')
            .eq('child_id', childId)
            .gte('due_datetime', `${dateStr}T00:00:00`)
            .lte('due_datetime', `${dateStr}T23:59:59.999`)
            .neq('state', 'done'); // Don't delete completed tasks

          if (existingInstances && existingInstances.length > 0) {
            const instanceIds = existingInstances.map(i => i.id);
            await supabase
              .from('task_instances')
              .delete()
              .in('id', instanceIds);
          }
        }

        // For 'add' mode, get existing task titles for deduplication
        let existingTitles: Set<string> = new Set();
        if (mode === 'add') {
          const { data: existingInstances } = await supabase
            .from('task_instances')
            .select('template_id, task_templates!inner(title_ru, title_en)')
            .eq('child_id', childId)
            .gte('due_datetime', `${dateStr}T00:00:00`)
            .lte('due_datetime', `${dateStr}T23:59:59.999`);

          if (existingInstances) {
            existingInstances.forEach((i: any) => {
              if (i.task_templates) {
                existingTitles.add(i.task_templates.title_ru?.toLowerCase());
                existingTitles.add(i.task_templates.title_en?.toLowerCase());
              }
            });
          }
        }

        // Create task templates and instances for each task
        for (const task of tasks) {
          // Skip duplicates in add mode (by title)
          if (mode === 'add') {
            if (existingTitles.has(task.title_ru.toLowerCase()) || 
                existingTitles.has(task.title_en.toLowerCase())) {
              totalTasksSkipped++;
              continue;
            }
          }

          // Calculate due datetime
          let timeStr = '09:00:00';
          if (task.time) {
            timeStr = `${task.time}:00`;
          }

          // Create a one-time task template
          const { data: template, error: templateError } = await supabase
            .from('task_templates')
            .insert({
              family_id: family.id,
              child_id: childId,
              title_ru: task.title_ru,
              title_en: task.title_en,
              description_ru: task.description_ru,
              description_en: task.description_en,
              icon: task.icon,
              reward_amount: task.reward_amount,
              task_type: 'one_time',
              one_time_date: dateStr,
              recurring_time: task.time ? `${task.time}:00` : '09:00:00',
              start_date: dateStr,
              end_date: dateStr,
            })
            .select()
            .single();

          if (templateError) throw templateError;

          // Create task instance
          const { error: instanceError } = await supabase
            .from('task_instances')
            .insert({
              template_id: template.id,
              child_id: childId,
              due_datetime: `${dateStr}T${timeStr}`,
              state: 'todo',
            });

          if (instanceError) throw instanceError;
          
          totalTasksCreated++;
        }
      }

      // Log template_applied event
      await supabase.from('template_events').insert({
        family_id: family.id,
        template_id: templateId || null,
        preset_key: presetKey || null,
        template_name: templateName,
        apply_mode: mode,
        apply_scope: 'one_time',
        target_date: dateStr,
        children_count: childIds.length,
        tasks_created_count: totalTasksCreated,
        tasks_skipped_duplicates_count: totalTasksSkipped,
      });

      return { success: true, tasksCreated: totalTasksCreated, tasksSkipped: totalTasksSkipped };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task_instances'] });
      queryClient.invalidateQueries({ queryKey: ['task_templates'] });
      queryClient.invalidateQueries({ queryKey: ['all_today_tasks'] });
    },
  });

  // Apply recurring template - creates weekly recurring tasks
  const applyRecurringTemplate = useMutation({
    mutationFn: async ({
      templateId,
      presetKey,
      childIds,
      startDate,
      recurringDays,
      mode,
    }: {
      templateId?: string;
      presetKey?: string;
      childIds: string[];
      startDate: Date;
      recurringDays: number[];
      mode: 'replace' | 'add';
    }) => {
      if (!family) throw new Error('Family not found');

      // Get template tasks - either from DB or preset
      let tasks: Array<{
        title_ru: string;
        title_en: string;
        description_ru?: string;
        description_en?: string;
        icon: string;
        time?: string;
        reward_amount: number;
      }> = [];
      let templateName = '';

      if (templateId) {
        // Get template info
        const { data: templateData } = await supabase
          .from('day_templates')
          .select('name_ru, name_en')
          .eq('id', templateId)
          .single();
        templateName = templateData?.name_en || templateData?.name_ru || 'Custom Template';

        const { data: dbTasks, error: tasksError } = await supabase
          .from('day_template_tasks')
          .select('*')
          .eq('day_template_id', templateId)
          .order('order_index', { ascending: true });

        if (tasksError) throw tasksError;
        tasks = dbTasks.map(t => ({
          title_ru: t.title_ru,
          title_en: t.title_en,
          description_ru: t.description_ru || undefined,
          description_en: t.description_en || undefined,
          icon: t.icon || '✨',
          time: t.time || undefined,
          reward_amount: t.reward_amount,
        }));
      } else if (presetKey) {
        const preset = PRESET_TEMPLATES.find(p => p.preset_key === presetKey);
        if (!preset) throw new Error('Preset not found');
        templateName = preset.name_en;
        tasks = preset.tasks.map(t => ({
          title_ru: t.title_ru,
          title_en: t.title_en,
          icon: t.icon,
          time: t.time,
          reward_amount: t.reward_amount,
        }));
      } else {
        throw new Error('Either templateId or presetKey required');
      }

      // Format start date
      const year = startDate.getFullYear();
      const month = String(startDate.getMonth() + 1).padStart(2, '0');
      const day = String(startDate.getDate()).padStart(2, '0');
      const startDateStr = `${year}-${month}-${day}`;

      let totalTasksCreated = 0;
      let totalTasksSkipped = 0;

      // For each child, create recurring task templates
      for (const childId of childIds) {
        // Get existing task titles for deduplication in 'add' mode
        let existingTitles: Set<string> = new Set();
        if (mode === 'add') {
          const { data: existingTemplates } = await supabase
            .from('task_templates')
            .select('title_ru, title_en')
            .eq('family_id', family.id)
            .eq('child_id', childId)
            .eq('task_type', 'recurring')
            .eq('status', 'active');
          
          if (existingTemplates) {
            existingTemplates.forEach(t => {
              existingTitles.add(t.title_ru);
              existingTitles.add(t.title_en);
            });
          }
        }

        // Create recurring task templates for each task
        for (const task of tasks) {
          // Skip duplicates in add mode
          if (mode === 'add' && (existingTitles.has(task.title_ru) || existingTitles.has(task.title_en))) {
            totalTasksSkipped++;
            continue;
          }

          const { error: templateError } = await supabase
            .from('task_templates')
            .insert({
              family_id: family.id,
              child_id: childId,
              title_ru: task.title_ru,
              title_en: task.title_en,
              description_ru: task.description_ru,
              description_en: task.description_en,
              icon: task.icon,
              reward_amount: task.reward_amount,
              task_type: 'recurring',
              recurring_days: recurringDays,
              recurring_time: task.time ? `${task.time}:00` : '09:00:00',
              start_date: startDateStr,
              task_category: 'routine',
            });

          if (templateError) throw templateError;
          totalTasksCreated++;
        }
      }

      // Log template_applied event
      await supabase.from('template_events').insert({
        family_id: family.id,
        template_id: templateId || null,
        preset_key: presetKey || null,
        template_name: templateName,
        apply_mode: mode,
        apply_scope: 'recurring',
        target_date: startDateStr,
        children_count: childIds.length,
        tasks_created_count: totalTasksCreated,
        tasks_skipped_duplicates_count: totalTasksSkipped,
      });

      return { success: true, tasksCreated: totalTasksCreated, tasksSkipped: totalTasksSkipped };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task_instances'] });
      queryClient.invalidateQueries({ queryKey: ['task_templates'] });
      queryClient.invalidateQueries({ queryKey: ['all_today_tasks'] });
    },
  });

  return {
    templates,
    presets: PRESET_TEMPLATES,
    isLoading,
    refetch,
    createFromPreset,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    applyTemplate,
    applyRecurringTemplate,
  };
};
