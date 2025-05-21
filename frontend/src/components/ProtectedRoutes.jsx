import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../authentication/AuthContext';
import PreLoader from './PreLoader';

export const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    // Check for a flag indicating we need to refresh
    const needsRefresh = sessionStorage.getItem('needsFullRefresh');
    if (needsRefresh) {
      // Clear the flag
      sessionStorage.removeItem('needsFullRefresh');
      // Force a full browser refresh
      window.location.reload();
      return;
    }

    if (!loading && !isAuthenticated) {
      sessionStorage.setItem('redirectAfterLogin', location.pathname);
    }
  }, [isAuthenticated, loading, location]);

  if (loading) {
    return <PreLoader message="Checking authentication..." />;
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" state={{ from: location }} replace />;
};

export const AdminRoute = () => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const location = useLocation();

  // Debug logs
  console.log('Auth state:', { isAuthenticated, isAdmin, loading });

  if (loading) {
    return <PreLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};