import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children, requiredPermissions = [], requiredRoles = [] }) => {
  const { isAuthenticated, permissions, roles } = useSelector((state) => state.auth);
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirect to login page with return url
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // Check permissions
  if (requiredPermissions.length > 0) {
    const hasPermission = requiredPermissions.some(permission => 
      permissions.includes(permission)
    );
    
    if (!hasPermission) {
      return <Navigate to="/admin/unauthorized" replace />;
    }
  }

  // Check roles
  if (requiredRoles.length > 0) {
    const hasRole = requiredRoles.some(role => 
      roles.includes(role)
    );
    
    if (!hasRole) {
      return <Navigate to="/admin/unauthorized" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
