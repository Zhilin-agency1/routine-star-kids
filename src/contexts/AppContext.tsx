import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useChildren, Child } from '@/hooks/useChildren';
import { useTasks, TaskWithTemplate } from '@/hooks/useTasks';
import { useStore, StoreItem } from '@/hooks/useStore';
import { useJobBoard, JobBoardItem } from '@/hooks/useJobBoard';
import { useSchedule, ActivitySchedule } from '@/hooks/useSchedule';
import { useFamily } from '@/hooks/useFamily';
import { useTaskGeneration } from '@/hooks/useTaskGeneration';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

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
  userRoles: Role[]; // Available roles from database
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  currentChild: Child | null;
  setCurrentChild: (child: Child | null) => void;
  children: Child[];
  childrenLoading: boolean;
  childrenError: Error | null;
  refetchChildren: () => void;
  familyLoaded: boolean;
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

// Helper to get localStorage keys scoped by user ID
const getStorageKey = (userId: string, key: string) => `growee:${key}:${userId}`;

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children: childrenProp }) => {
  const { user } = useAuth();
  const [role, setRoleState] = useState<Role>('child');
  const [userRoles, setUserRoles] = useState<Role[]>([]);
  const [rolesLoaded, setRolesLoaded] = useState(false);
  const [viewMode, setViewModeState] = useState<ViewMode>('personal');
  const [currentChild, setCurrentChildState] = useState<Child | null>(null);
  
  // Use real hooks
  const { family, isLoading: familyLoading } = useFamily();
  const { children: childrenData, isLoading: childrenLoading, error: childrenError, refetch: refetchChildren } = useChildren();
  const { instances, completeTask: completeTaskMutation, updateInstanceState } = useTasks(currentChild?.id, new Date());
  const { items: storeItemsData, purchaseItem: purchaseItemMutation, isLoading: storeLoading } = useStore();
  const { jobs: jobBoardItemsData, claimJob, isLoading: jobsLoading } = useJobBoard();
  const { activities: activitiesData, isLoading: activitiesLoading } = useSchedule(currentChild?.id);
  
  // Auto-generate task instances for today
  useTaskGeneration();

  // Fetch user roles from database when user changes
  useEffect(() => {
    const fetchUserRoles = async () => {
      if (!user) {
        setUserRoles([]);
        setRolesLoaded(true);
        setRoleState('child'); // Default to child when logged out
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        if (error) {
          console.error('Error fetching user roles:', error);
          setUserRoles(['child']); // Default fallback
        } else {
          const roles = data?.map(r => r.role as Role) || [];
          setUserRoles(roles);
          
          // Set initial role based on what user has
          if (roles.includes('parent')) {
            setRoleState('parent');
          } else if (roles.includes('child')) {
            setRoleState('child');
          } else {
            setRoleState('child'); // Default fallback
          }
        }
      } catch (err) {
        console.error('Error fetching user roles:', err);
        setUserRoles(['child']);
      }
      
      setRolesLoaded(true);
    };

    fetchUserRoles();
  }, [user]);

  // Role setter that validates against available roles
  const setRole = (newRole: Role) => {
    // Only allow switching if user has this role in database
    if (userRoles.includes(newRole)) {
      setRoleState(newRole);
    } else {
      console.warn(`User does not have role: ${newRole}`);
    }
  };

  // Wrapper for setViewMode with localStorage persistence
  const setViewMode = (mode: ViewMode) => {
    setViewModeState(mode);
    if (user) {
      localStorage.setItem(getStorageKey(user.id, 'viewMode'), mode);
    }
  };

  // Wrapper for setCurrentChild with localStorage persistence
  const setCurrentChild = (child: Child | null) => {
    setCurrentChildState(child);
    if (user) {
      if (child) {
        localStorage.setItem(getStorageKey(user.id, 'currentChildId'), child.id);
      } else {
        localStorage.removeItem(getStorageKey(user.id, 'currentChildId'));
      }
    }
  };

  // Restore viewMode and currentChild from localStorage on user change
  useEffect(() => {
    if (user && childrenData.length > 0) {
      // Restore viewMode
      const savedViewMode = localStorage.getItem(getStorageKey(user.id, 'viewMode'));
      if (savedViewMode === 'personal' || savedViewMode === 'family') {
        setViewModeState(savedViewMode);
      }
      
      // Restore currentChild - validate it belongs to this family's children
      const savedChildId = localStorage.getItem(getStorageKey(user.id, 'currentChildId'));
      if (savedChildId) {
        const foundChild = childrenData.find(c => c.id === savedChildId);
        if (foundChild) {
          setCurrentChildState(foundChild);
        } else {
          // Saved child not found, default to first child
          setCurrentChildState(childrenData[0]);
        }
      } else if (!currentChild) {
        // No saved child, default to first
        setCurrentChildState(childrenData[0]);
      }
    }
  }, [user, childrenData]);

  // Update currentChild when childrenData changes (e.g., balance updates)
  useEffect(() => {
    if (currentChild && childrenData.length > 0) {
      const updatedChild = childrenData.find(c => c.id === currentChild.id);
      if (updatedChild && updatedChild.balance !== currentChild.balance) {
        setCurrentChildState(updatedChild);
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

  const isLoading = familyLoading || childrenLoading || storeLoading || jobsLoading || activitiesLoading || !rolesLoaded;

  return (
    <AppContext.Provider value={{
      role,
      setRole,
      userRoles,
      viewMode,
      setViewMode,
      currentChild,
      setCurrentChild,
      children: childrenData,
      childrenLoading,
      childrenError: childrenError as Error | null,
      refetchChildren,
      familyLoaded: !!family,
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
