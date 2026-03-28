import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { wasSessionExpired, clearSessionExpiredFlag } from '../../services/apiClient';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)]" />
      </div>
    );
  }

  if (!isAuthenticated) {
    const expired = wasSessionExpired();
    if (expired) {
      clearSessionExpiredFlag();
    }
    const target = expired ? '/login?sessionExpired=true' : '/login';
    return <Navigate to={target} state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
