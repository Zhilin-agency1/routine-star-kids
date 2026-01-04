import { useCallback, useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useFamily } from './useFamily';
import { useChildren } from './useChildren';

export const useTaskGeneration = () => {
  const { family } = useFamily();
  const { children } = useChildren();
  const queryClient = useQueryClient();
  const hasGenerated = useRef(false);

  const generateTodayTasks = useMutation({
    mutationFn: async () => {
      if (!family || children.length === 0) return { created: 0 };

      const today = new Date();
      // Format date as YYYY-MM-DD in local timezone
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const todayStr = `${year}-${month}-${day}`;
      const dayOfWeek = (today.getDay() + 6) % 7; // Monday = 0, Sunday = 6

      // Get all active templates
      const { data: templates, error: templatesError } = await supabase
        .from('task_templates')
        .select('*')
        .eq('family_id', family.id)
        .eq('status', 'active');

      if (templatesError) throw templatesError;
      if (!templates || templates.length === 0) return { created: 0 };

      // Get existing instances for today (using local date string)
      const { data: existingInstances, error: instancesError } = await supabase
        .from('task_instances')
        .select('template_id, child_id')
        .gte('due_datetime', `${todayStr}T00:00:00`)
        .lte('due_datetime', `${todayStr}T23:59:59.999`);

      if (instancesError) throw instancesError;

      // Create a set of existing template+child combinations
      const existingSet = new Set(
        (existingInstances || []).map(i => `${i.template_id}_${i.child_id}`)
      );

      const instancesToCreate: Array<{
        template_id: string;
        child_id: string;
        due_datetime: string;
        state: string;
      }> = [];

      for (const template of templates) {
        // Check if template is valid for today
        const startDate = template.start_date ? new Date(template.start_date) : null;
        const endDate = template.end_date ? new Date(template.end_date) : null;

        // Check date range
        if (startDate && today < startDate) continue;
        if (endDate && today > endDate) continue;

        let shouldCreate = false;

        if (template.task_type === 'one_time') {
          // One-time task: check if one_time_date matches today
          if (template.one_time_date === todayStr) {
            shouldCreate = true;
          }
        } else if (template.task_type === 'recurring') {
          // Recurring task: check if today's day is in recurring_days
          const recurringDays = template.recurring_days || [];
          if (recurringDays.includes(dayOfWeek)) {
            shouldCreate = true;
          }
        }

        if (!shouldCreate) continue;

        // Determine which children should get this task
        const targetChildren = template.child_id 
          ? children.filter(c => c.id === template.child_id)
          : children;

        for (const child of targetChildren) {
          const key = `${template.id}_${child.id}`;
          if (!existingSet.has(key)) {
            // Calculate due_datetime using local date string to avoid UTC conversion
            let timeStr = '09:00:00'; // Default to 9:00 AM
            if (template.recurring_time) {
              const [hours, minutes] = template.recurring_time.split(':').map(Number);
              timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
            }

            instancesToCreate.push({
              template_id: template.id,
              child_id: child.id,
              due_datetime: `${todayStr}T${timeStr}`,
              state: 'todo',
            });
          }
        }
      }

      if (instancesToCreate.length === 0) return { created: 0 };

      // Insert all instances
      const { error: insertError } = await supabase
        .from('task_instances')
        .insert(instancesToCreate);

      if (insertError) throw insertError;

      return { created: instancesToCreate.length };
    },
    onSuccess: (result) => {
      if (result && result.created > 0) {
        queryClient.invalidateQueries({ queryKey: ['task_instances'] });
        queryClient.invalidateQueries({ queryKey: ['all_task_instances'] });
      }
    },
  });

  // Auto-generate on mount (once per session)
  useEffect(() => {
    if (family && children.length > 0 && !hasGenerated.current) {
      hasGenerated.current = true;
      generateTodayTasks.mutate();
    }
  }, [family, children.length]);

  const regenerate = useCallback(() => {
    hasGenerated.current = false;
    generateTodayTasks.mutate();
  }, [generateTodayTasks]);

  return {
    generateTodayTasks: regenerate,
    isGenerating: generateTodayTasks.isPending,
  };
};
