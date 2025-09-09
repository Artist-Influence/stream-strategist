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
  const { user, loading, userRole } = useAuth();
  const location = useLocation();

  console.log('ProtectedRoute - user:', user?.email, 'userRole:', userRole, 'requiredRoles:', requiredRoles, 'loading:', loading);

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

  if (requiredRoles && (!userRole || !requiredRoles.includes(userRole as any))) {
    console.log('Access denied - userRole:', userRole, 'required:', requiredRoles);
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to access this page.</p>
          <p className="text-xs text-muted-foreground mt-2">
            Your role: {userRole || 'none'} | Required: {requiredRoles?.join(', ')}
          </p>
        </div>
      </div>
    );
  }

  console.log('Access granted');
  return <>{children}</>;
}