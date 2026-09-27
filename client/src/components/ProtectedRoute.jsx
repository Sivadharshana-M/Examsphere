import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return <LoadingSpinner fullScreen text="Verifying authentication credentials..." />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  const userRole = user.role ? user.role.toLowerCase().trim() : '';

  if (allowedRoles) {
    const allowed = allowedRoles.map((r) => r.toLowerCase().trim());
    if (!allowed.includes(userRole)) {
      let target = '/student/dashboard';
      if (userRole === 'college_admin') target = '/admin/dashboard';
      else if (userRole === 'teacher') target = '/teacher/dashboard';
      else if (userRole === 'invigilator') target = '/invigilator/dashboard';

      return <Navigate to={target} replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
