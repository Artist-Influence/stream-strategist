import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: ('admin' | 'manager' | 'salesperson' | 'vendor')[];
  fallbackPath?: string;
}

export function ProtectedRoute({ 
  children, 
  requiredRoles, 
  fallbackPath = '/auth' 
}: ProtectedRouteProps) {
  const { user, loading, currentRole, hasRole } = useAuth();
  const location = useLocation();

  console.log('ProtectedRoute - user:', user?.email, 'currentRole:', currentRole, 'requiredRoles:', requiredRoles, 'loading:', loading);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    console.log('No user found, redirecting to auth');
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  if (requiredRoles && requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.some(role => hasRole(role));
    
    if (!hasRequiredRole) {
      console.log('Access denied - currentRole:', currentRole, 'required:', requiredRoles);
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
            <p className="text-muted-foreground">You don't have permission to access this page.</p>
            <p className="text-xs text-muted-foreground mt-2">
              Current role: {currentRole || 'none'} | Required: {requiredRoles?.join(', ')}
            </p>
          </div>
        </div>
      );
    }
  }

  console.log('Access granted');
  return <>{children}</>;
}