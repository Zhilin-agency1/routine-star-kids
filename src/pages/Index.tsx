import { useApp } from '@/contexts/AppContext';
import { TodayBoard } from './child/TodayBoard';
import { ParentDashboard } from './parent/Dashboard';

const Index = () => {
  const { role } = useApp();

  if (role === 'parent') {
    return <ParentDashboard />;
  }

  return <TodayBoard />;
};

export default Index;
