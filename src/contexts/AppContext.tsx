import React, { createContext, useContext, useState } from 'react';

export type Role = 'parent' | 'child';

export interface Child {
  id: string;
  name: string;
  avatarUrl: string;
  balance: number;
  languagePreference: 'ru' | 'en';
}

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

export interface StoreItem {
  id: string;
  name: { ru: string; en: string };
  price: number;
  imageUrl: string;
  active: boolean;
}

export interface JobBoardItem {
  id: string;
  title: { ru: string; en: string };
  description: { ru: string; en: string };
  rewardAmount: number;
  active: boolean;
  icon?: string;
}

export interface ActivitySchedule {
  id: string;
  childId: string;
  title: { ru: string; en: string };
  location?: string;
  time: string;
  duration: number;
  days: number[];
}

interface AppContextType {
  role: Role;
  setRole: (role: Role) => void;
  currentChild: Child | null;
  setCurrentChild: (child: Child | null) => void;
  children: Child[];
  tasks: TaskInstance[];
  storeItems: StoreItem[];
  jobBoardItems: JobBoardItem[];
  activities: ActivitySchedule[];
  completeTask: (taskId: string) => void;
  moveTask: (taskId: string, state: TaskInstance['state']) => void;
  purchaseItem: (itemId: string) => void;
  takeJob: (jobId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Mock data
const mockChildren: Child[] = [
  { id: '1', name: 'Миша', avatarUrl: '🦁', balance: 45, languagePreference: 'ru' },
  { id: '2', name: 'Аня', avatarUrl: '🦄', balance: 72, languagePreference: 'ru' },
];

const mockTasks: TaskInstance[] = [
  {
    id: '1',
    templateId: 't1',
    childId: '1',
    title: { ru: 'Заправить кровать', en: 'Make the bed' },
    description: { ru: 'Аккуратно застелить одеялом', en: 'Neatly cover with blanket' },
    rewardAmount: 5,
    dueDateTime: new Date(),
    state: 'todo',
    rewardGranted: false,
    icon: '🛏️',
  },
  {
    id: '2',
    templateId: 't2',
    childId: '1',
    title: { ru: 'Почистить зубы (утро)', en: 'Brush teeth (morning)' },
    rewardAmount: 3,
    dueDateTime: new Date(),
    state: 'todo',
    rewardGranted: false,
    icon: '🪥',
  },
  {
    id: '3',
    templateId: 't3',
    childId: '1',
    title: { ru: 'Позавтракать', en: 'Have breakfast' },
    rewardAmount: 2,
    dueDateTime: new Date(),
    state: 'doing',
    rewardGranted: false,
    icon: '🍳',
  },
  {
    id: '4',
    templateId: 't4',
    childId: '1',
    title: { ru: 'Убрать игрушки', en: 'Tidy up toys' },
    rewardAmount: 10,
    dueDateTime: new Date(),
    state: 'done',
    completedAt: new Date(),
    rewardGranted: true,
    icon: '🧸',
  },
];

const mockStoreItems: StoreItem[] = [
  { id: '1', name: { ru: '30 минут мультиков', en: '30 min cartoons' }, price: 20, imageUrl: '📺', active: true },
  { id: '2', name: { ru: 'Мороженое', en: 'Ice cream' }, price: 30, imageUrl: '🍦', active: true },
  { id: '3', name: { ru: 'Поход в парк', en: 'Trip to park' }, price: 50, imageUrl: '🎢', active: true },
  { id: '4', name: { ru: 'Новая игрушка', en: 'New toy' }, price: 100, imageUrl: '🎁', active: true },
];

const mockJobBoardItems: JobBoardItem[] = [
  { id: '1', title: { ru: 'Помыть посуду', en: 'Wash dishes' }, description: { ru: 'Помочь маме с посудой', en: 'Help mom with dishes' }, rewardAmount: 15, active: true, icon: '🍽️' },
  { id: '2', title: { ru: 'Полить цветы', en: 'Water plants' }, description: { ru: 'Полить все цветы в доме', en: 'Water all plants in the house' }, rewardAmount: 10, active: true, icon: '🌱' },
  { id: '3', title: { ru: 'Помочь с уборкой', en: 'Help with cleaning' }, description: { ru: 'Пропылесосить комнату', en: 'Vacuum the room' }, rewardAmount: 20, active: true, icon: '🧹' },
];

const mockActivities: ActivitySchedule[] = [
  { id: '1', childId: '1', title: { ru: 'Футбол', en: 'Football' }, location: 'Спортзал', time: '16:00', duration: 60, days: [1, 3, 5] },
  { id: '2', childId: '1', title: { ru: 'Английский', en: 'English' }, location: 'Онлайн', time: '18:00', duration: 45, days: [2, 4] },
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<Role>('child');
  const [currentChild, setCurrentChild] = useState<Child | null>(mockChildren[0]);
  const [childrenList, setChildrenList] = useState<Child[]>(mockChildren);
  const [tasks, setTasks] = useState<TaskInstance[]>(mockTasks);
  const [storeItems] = useState<StoreItem[]>(mockStoreItems);
  const [jobBoardItems] = useState<JobBoardItem[]>(mockJobBoardItems);
  const [activities] = useState<ActivitySchedule[]>(mockActivities);

  const completeTask = (taskId: string) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId && !task.rewardGranted) {
        // Grant reward
        if (currentChild) {
          setChildrenList(children => children.map(c => 
            c.id === currentChild.id 
              ? { ...c, balance: c.balance + task.rewardAmount }
              : c
          ));
          setCurrentChild(prev => prev ? { ...prev, balance: prev.balance + task.rewardAmount } : null);
        }
        return { ...task, state: 'done' as const, completedAt: new Date(), rewardGranted: true };
      }
      return task;
    }));
  };

  const moveTask = (taskId: string, state: TaskInstance['state']) => {
    if (state === 'done') {
      completeTask(taskId);
    } else {
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, state } : task
      ));
    }
  };

  const purchaseItem = (itemId: string) => {
    const item = storeItems.find(i => i.id === itemId);
    if (item && currentChild && currentChild.balance >= item.price) {
      setChildrenList(children => children.map(c => 
        c.id === currentChild.id 
          ? { ...c, balance: c.balance - item.price }
          : c
      ));
      setCurrentChild(prev => prev ? { ...prev, balance: prev.balance - item.price } : null);
    }
  };

  const takeJob = (jobId: string) => {
    const job = jobBoardItems.find(j => j.id === jobId);
    if (job && currentChild) {
      const newTask: TaskInstance = {
        id: `job-${Date.now()}`,
        templateId: `job-template-${jobId}`,
        childId: currentChild.id,
        title: job.title,
        description: job.description,
        rewardAmount: job.rewardAmount,
        dueDateTime: new Date(),
        state: 'todo',
        rewardGranted: false,
        icon: job.icon,
      };
      setTasks(prev => [...prev, newTask]);
    }
  };

  return (
    <AppContext.Provider value={{
      role,
      setRole,
      currentChild,
      setCurrentChild,
      children: childrenList,
      tasks,
      storeItems,
      jobBoardItems,
      activities,
      completeTask,
      moveTask,
      purchaseItem,
      takeJob,
    }}>
      {children}
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
