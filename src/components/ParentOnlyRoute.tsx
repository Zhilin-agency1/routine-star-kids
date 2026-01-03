import { Navigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';

interface ParentOnlyRouteProps {
  children: React.ReactNode;
}

export const ParentOnlyRoute = ({ children }: ParentOnlyRouteProps) => {
  const { role } = useApp();

  // Redirect children to home page when trying to access parent-only routes
  if (role === 'child') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
