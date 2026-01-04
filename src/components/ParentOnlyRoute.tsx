import { Navigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';

interface ParentOnlyRouteProps {
  children: React.ReactNode;
}

export const ParentOnlyRoute = ({ children }: ParentOnlyRouteProps) => {
  const { role, userRoles, isLoading } = useApp();

  // Wait for roles to load before making redirect decisions
  if (isLoading) {
    return null;
  }

  // Check if user actually has parent role in database (server-validated)
  // If userRoles is empty, they're not authenticated - redirect to home
  const hasParentRole = userRoles.includes('parent');
  
  // Redirect if user doesn't have parent role OR current role isn't parent
  if (!hasParentRole || role !== 'parent') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
