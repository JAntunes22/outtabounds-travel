import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import "./Auth.css";

// Higher-order component to protect routes that require authentication
export default function PrivateRoute({ requireAdmin }) {
  const { currentUser, isAdmin, refreshAdminStatus } = useAuth();
  const location = useLocation();
  const [checkingAdmin, setCheckingAdmin] = useState(requireAdmin);
  const [adminVerified, setAdminVerified] = useState(isAdmin);

  // When component loads, force check admin status if required
  useEffect(() => {
    async function verifyAdminStatus() {
      if (requireAdmin && currentUser) {
        try {
          console.log("Verifying admin access for user:", currentUser.email);
          const adminStatus = await refreshAdminStatus();
          console.log("Admin verification result:", adminStatus);
          setAdminVerified(adminStatus);
        } catch (error) {
          console.error("Error verifying admin status:", error);
          setAdminVerified(false);
        } finally {
          setCheckingAdmin(false);
        }
      } else {
        setCheckingAdmin(false);
      }
    }

    verifyAdminStatus();
  }, [requireAdmin, currentUser, refreshAdminStatus]);

  // Show loading indicator while checking admin status
  if (checkingAdmin) {
    return <div className="loading-container">
      <div className="loading-spinner"></div>
      <p>Verifying admin access...</p>
    </div>;
  }

  // If requireAdmin flag is true, check if user is admin
  if (requireAdmin && !adminVerified) {
    console.log("Admin access denied. Auth state: currentUser=", !!currentUser, "isAdmin=", isAdmin, "adminVerified=", adminVerified);
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