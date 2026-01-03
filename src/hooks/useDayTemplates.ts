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
  {
    preset_key: 'school_morning',
    name_ru: 'Школьное утро',
    name_en: 'School Morning',
    tasks: [
      { title_ru: 'Проснуться и встать', title_en: 'Wake up', icon: '⏰', time: '07:00', reward_amount: 2 },
      { title_ru: 'Заправить кровать', title_en: 'Make bed', icon: '🛏️', time: '07:05', reward_amount: 3 },
      { title_ru: 'Умыться и почистить зубы', title_en: 'Wash up and brush teeth', icon: '🪥', time: '07:10', reward_amount: 3 },
      { title_ru: 'Одеться', title_en: 'Get dressed', icon: '👕', time: '07:20', reward_amount: 2 },
      { title_ru: 'Позавтракать', title_en: 'Eat breakfast', icon: '🥣', time: '07:30', reward_amount: 3 },
      { title_ru: 'Собрать рюкзак', title_en: 'Pack backpack', icon: '🎒', time: '07:50', reward_amount: 3 },
    ],
  },
  {
    preset_key: 'after_school',
    name_ru: 'После школы',
    name_en: 'After School Reset',
    tasks: [
      { title_ru: 'Разобрать рюкзак', title_en: 'Unpack backpack', icon: '🎒', time: '14:00', reward_amount: 3 },
      { title_ru: 'Переодеться в домашнее', title_en: 'Change clothes', icon: '👕', time: '14:10', reward_amount: 2 },
      { title_ru: 'Пообедать', title_en: 'Have lunch', icon: '🍽️', time: '14:20', reward_amount: 3 },
      { title_ru: 'Отдохнуть 30 минут', title_en: 'Rest for 30 min', icon: '😌', time: '14:45', reward_amount: 2 },
      { title_ru: 'Рассказать о дне в школе', title_en: 'Share about school day', icon: '💬', time: '15:15', reward_amount: 3 },
    ],
  },
  {
    preset_key: 'homework_reading',
    name_ru: 'Уроки и чтение',
    name_en: 'Homework + Reading',
    tasks: [
      { title_ru: 'Подготовить рабочее место', title_en: 'Set up workspace', icon: '📚', time: '16:00', reward_amount: 2 },
      { title_ru: 'Сделать математику', title_en: 'Do math homework', icon: '🔢', time: '16:05', reward_amount: 5 },
      { title_ru: 'Сделать русский/английский', title_en: 'Do language homework', icon: '✏️', time: '16:35', reward_amount: 5 },
      { title_ru: 'Читать 20 минут', title_en: 'Read for 20 min', icon: '📖', time: '17:05', reward_amount: 5 },
      { title_ru: 'Собрать всё в портфель', title_en: 'Pack everything', icon: '🎒', time: '17:30', reward_amount: 2 },
    ],
  },
  {
    preset_key: 'evening_routine',
    name_ru: 'Вечерняя рутина',
    name_en: 'Evening Routine',
    tasks: [
      { title_ru: 'Убрать игрушки', title_en: 'Clean up toys', icon: '🧸', time: '19:00', reward_amount: 3 },
      { title_ru: 'Поужинать', title_en: 'Have dinner', icon: '🍝', time: '19:30', reward_amount: 2 },
      { title_ru: 'Принять душ/ванну', title_en: 'Take shower/bath', icon: '🛁', time: '20:00', reward_amount: 3 },
      { title_ru: 'Почистить зубы', title_en: 'Brush teeth', icon: '🪥', time: '20:20', reward_amount: 2 },
      { title_ru: 'Надеть пижаму', title_en: 'Put on pajamas', icon: '👔', time: '20:25', reward_amount: 2 },
      { title_ru: 'Почитать книжку', title_en: 'Read a book', icon: '📚', time: '20:30', reward_amount: 3 },
      { title_ru: 'Лечь спать', title_en: 'Go to bed', icon: '😴', time: '21:00', reward_amount: 3 },
    ],
  },
  {
    preset_key: 'weekend_clean',
    name_ru: 'Выходные: уборка',
    name_en: 'Weekend Clean & Help',
    tasks: [
      { title_ru: 'Заправить кровать', title_en: 'Make bed', icon: '🛏️', time: '09:00', reward_amount: 3 },
      { title_ru: 'Убрать в комнате', title_en: 'Clean room', icon: '🧹', time: '10:00', reward_amount: 5 },
      { title_ru: 'Пропылесосить', title_en: 'Vacuum', icon: '🧹', time: '10:30', reward_amount: 5 },
      { title_ru: 'Помочь с посудой', title_en: 'Help with dishes', icon: '🍽️', time: '13:00', reward_amount: 4 },
      { title_ru: 'Вынести мусор', title_en: 'Take out trash', icon: '🗑️', time: '14:00', reward_amount: 3 },
      { title_ru: 'Полить цветы', title_en: 'Water plants', icon: '🌱', time: '15:00', reward_amount: 3 },
    ],
  },
  {
    preset_key: 'bored_rescue',
    name_ru: 'Мне скучно',
    name_en: '"I\'m Bored" Rescue Plan',
    tasks: [
      { title_ru: 'Порисовать 15 мин', title_en: 'Draw for 15 min', icon: '🎨', time: '10:00', reward_amount: 3 },
      { title_ru: 'Построить что-то из лего', title_en: 'Build with Lego', icon: '🧱', time: '10:30', reward_amount: 4 },
      { title_ru: 'Поиграть на улице', title_en: 'Play outside', icon: '⚽', time: '11:00', reward_amount: 5 },
      { title_ru: 'Сделать поделку', title_en: 'Do a craft', icon: '✂️', time: '14:00', reward_amount: 4 },
      { title_ru: 'Помочь приготовить еду', title_en: 'Help cook', icon: '👨‍🍳', time: '17:00', reward_amount: 5 },
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

      if (templateId) {
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

        // Create task templates and instances for each task
        for (const task of tasks) {
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
        }
      }

      return { success: true, tasksCreated: tasks.length * childIds.length };
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
  };
};
