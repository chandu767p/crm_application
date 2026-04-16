import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

export default function PrivateRoute({ children, screen }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const userRole = user.role;
  let userPermissions = [];
  
  if (userRole && userRole.permissions) {
    userPermissions = userRole.permissions;
    if (userPermissions.includes('activities')) {
      userPermissions = Array.from(new Set([...userPermissions, 'calls', 'emails', 'meetings']));
    }
    if (userPermissions.includes('users')) {
      userPermissions = Array.from(new Set([...userPermissions, 'projects', 'calendar', 'email-templates']));
    }
  }

  if (screen && !userPermissions.includes(screen)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
