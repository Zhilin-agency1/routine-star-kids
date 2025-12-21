import { useApp } from '@/contexts/AppContext';
import { FamilyTodayPage } from './child/FamilyTodayPage';
import { TodayBoard } from './child/TodayBoard';
import { ParentDashboard } from './parent/Dashboard';

const Index = () => {
  const { role, viewMode } = useApp();

  if (role === 'parent') {
    return <ParentDashboard />;
  }

  // For children: family view shows all children, personal view shows individual tasks
  if (viewMode === 'family') {
    return <FamilyTodayPage />;
  }

  return <TodayBoard />;
};

export default Index;
