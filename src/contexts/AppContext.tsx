import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useChildren, Child } from '@/hooks/useChildren';
import { useTasks, TaskWithTemplate } from '@/hooks/useTasks';
import { useStore, StoreItem } from '@/hooks/useStore';
import { useJobBoard, JobBoardItem } from '@/hooks/useJobBoard';
import { useSchedule, ActivitySchedule } from '@/hooks/useSchedule';
import { useFamily } from '@/hooks/useFamily';
import { useTaskGeneration } from '@/hooks/useTaskGeneration';

export type Role = 'parent' | 'child';

// Re-export types for backwards compatibility
export type { Child } from '@/hooks/useChildren';
export type { StoreItem } from '@/hooks/useStore';
export type { JobBoardItem } from '@/hooks/useJobBoard';
export type { ActivitySchedule } from '@/hooks/useSchedule';

// Normalized task type for components
export interface TaskInstance {
  id: string;
  templateId: string;
  childId: string;
  title: { ru: string; en: string };
  description?: { ru: string; en: string };
  rewardAmount: number;
  dueDateTime: Date;
  state: 'todo' | 'doing' | 'done' | 'skipped' | 'cancelled';
  completedAt?: Date;
  rewardGranted: boolean;
  icon?: string;
}

export type ViewMode = 'personal' | 'family';

interface AppContextType {
  role: Role;
  setRole: (role: Role) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  currentChild: Child | null;
  setCurrentChild: (child: Child | null) => void;
  children: Child[];
  tasks: TaskInstance[];
  storeItems: StoreItem[];
  jobBoardItems: JobBoardItem[];
  activities: ActivitySchedule[];
  isLoading: boolean;
  completeTask: (taskId: string) => void;
  moveTask: (taskId: string, state: TaskInstance['state']) => void;
  purchaseItem: (itemId: string) => void;
  takeJob: (jobId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children: childrenProp }) => {
  const [role, setRole] = useState<Role>('child');
  const [viewMode, setViewMode] = useState<ViewMode>('personal');
  const [currentChild, setCurrentChild] = useState<Child | null>(null);
  
  // Use real hooks
  const { family, isLoading: familyLoading } = useFamily();
  const { children: childrenData, isLoading: childrenLoading } = useChildren();
  const { instances, completeTask: completeTaskMutation, updateInstanceState } = useTasks(currentChild?.id, new Date());
  const { items: storeItemsData, purchaseItem: purchaseItemMutation, isLoading: storeLoading } = useStore();
  const { jobs: jobBoardItemsData, claimJob, isLoading: jobsLoading } = useJobBoard();
  const { activities: activitiesData, isLoading: activitiesLoading } = useSchedule(currentChild?.id);
  
  // Auto-generate task instances for today
  useTaskGeneration();

  // Set current child when children are loaded
  useEffect(() => {
    if (childrenData.length > 0 && !currentChild) {
      setCurrentChild(childrenData[0]);
    }
  }, [childrenData, currentChild]);

  // Update currentChild when childrenData changes (e.g., balance updates)
  useEffect(() => {
    if (currentChild && childrenData.length > 0) {
      const updatedChild = childrenData.find(c => c.id === currentChild.id);
      if (updatedChild && updatedChild.balance !== currentChild.balance) {
        setCurrentChild(updatedChild);
      }
    }
  }, [childrenData, currentChild]);

  // Normalize task instances to TaskInstance format
  const tasks = useMemo((): TaskInstance[] => {
    return instances.map((instance: TaskWithTemplate) => ({
      id: instance.id,
      templateId: instance.template_id,
      childId: instance.child_id,
      title: {
        ru: instance.template?.title_ru || '',
        en: instance.template?.title_en || '',
      },
      description: instance.template?.description_ru || instance.template?.description_en ? {
        ru: instance.template?.description_ru || '',
        en: instance.template?.description_en || '',
      } : undefined,
      rewardAmount: instance.template?.reward_amount || 0,
      dueDateTime: new Date(instance.due_datetime),
      state: instance.state as TaskInstance['state'],
      completedAt: instance.completed_at ? new Date(instance.completed_at) : undefined,
      rewardGranted: instance.reward_granted,
      icon: instance.template?.icon || '✨',
    }));
  }, [instances]);

  const completeTask = (taskId: string) => {
    if (!currentChild) return;
    completeTaskMutation.mutate({ instanceId: taskId, childId: currentChild.id });
  };

  const moveTask = (taskId: string, state: TaskInstance['state']) => {
    if (state === 'done') {
      completeTask(taskId);
    } else {
      updateInstanceState.mutate({ instanceId: taskId, state });
    }
  };

  const purchaseItem = (itemId: string) => {
    if (!currentChild) return;
    purchaseItemMutation.mutate({ itemId, childId: currentChild.id });
  };

  const takeJob = (jobId: string) => {
    if (!currentChild) return;
    claimJob.mutate({ jobId, childId: currentChild.id, addToRoutine: true });
  };

  const isLoading = familyLoading || childrenLoading || storeLoading || jobsLoading || activitiesLoading;

  return (
    <AppContext.Provider value={{
      role,
      setRole,
      viewMode,
      setViewMode,
      currentChild,
      setCurrentChild,
      children: childrenData,
      tasks,
      storeItems: storeItemsData,
      jobBoardItems: jobBoardItemsData,
      activities: activitiesData,
      isLoading,
      completeTask,
      moveTask,
      purchaseItem,
      takeJob,
    }}>
      {childrenProp}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
