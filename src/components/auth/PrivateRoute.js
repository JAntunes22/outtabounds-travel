import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// Higher-order component to protect routes that require authentication
export default function PrivateRoute({ requireAdmin }) {
  const { currentUser, isAdmin } = useAuth();
  const location = useLocation();

  // If requireAdmin flag is true, check if user is admin
  if (requireAdmin && !isAdmin) {
    // Redirect to unauthorized page if user is not an admin
    return <Navigate to="/unauthorized" state={{ from: location }} replace />;
  }

  // If no user, redirect to login with the current location for redirect after login
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If user is authenticated (and is admin if required), render the child routes
  return <Outlet />;
} 