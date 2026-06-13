import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated } from '../utils/auth';

/**
 * ProtectedRoute: Redirects to /login if user is not authenticated
 */
export const ProtectedRoute = ({ children }) => {
  const isAuth = isAuthenticated();
  const location = useLocation();

  if (!isAuth) {
    // Redirect to login but save the current location they were trying to access
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

/**
 * PublicRoute: Redirects to /dashboard if user is already authenticated
 */
export const PublicRoute = ({ children }) => {
  const isAuth = isAuthenticated();

  if (isAuth) {
    // Already logged in, go to dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};
