import { useApp } from '@/contexts/AppContext';
import { FamilyTodayPage } from './child/FamilyTodayPage';
import { ParentDashboard } from './parent/Dashboard';

const Index = () => {
  const { role } = useApp();

  if (role === 'parent') {
    return <ParentDashboard />;
  }

  // Child users always see the Family Today page (unified KIDS mode)
  return <FamilyTodayPage />;
};

export default Index;
