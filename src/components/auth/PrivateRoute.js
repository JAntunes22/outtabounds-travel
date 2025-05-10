import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import "./Auth.css";

// Higher-order component to protect routes that require authentication
export default function PrivateRoute({ requireAdmin, requireProfileCompletion = false }) {
  const { 
    currentUser, 
    isAdmin, 
    refreshAdminStatus, 
    isProfileCompleted, 
    hasSeenProfileReminder, 
    markProfileReminderSeen 
  } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [checkingAdmin, setCheckingAdmin] = useState(requireAdmin);
  const [adminVerified, setAdminVerified] = useState(isAdmin);
  const [checkingProfile, setCheckingProfile] = useState(requireProfileCompletion);
  const [showProfileReminder, setShowProfileReminder] = useState(false);
  const [error, setError] = useState(null);

  // When component loads, force check admin status if required
  useEffect(() => {
    async function verifyAdminStatus() {
      if (requireAdmin && currentUser) {
        try {
          console.log("Verifying admin access for user:", currentUser.email);
          console.log("Current admin state before verification:", isAdmin);
          
          const adminStatus = await refreshAdminStatus();
          console.log("Admin verification result:", adminStatus);
          setAdminVerified(adminStatus);
          
          if (!adminStatus) {
            console.error("Admin access denied - user not an admin.");
            setError('403'); // Set 403 Forbidden for unauthorized admin access
          }
        } catch (error) {
          console.error("Error verifying admin status:", error);
          setAdminVerified(false);
          setError('500'); // Set 500 Internal Server Error for verification failures
        } finally {
          setCheckingAdmin(false);
        }
      } else {
        console.log("Admin verification not required or no current user");
        setCheckingAdmin(false);
      }
    }

    async function verifyProfileCompletion() {
      if (requireProfileCompletion && currentUser && !hasSeenProfileReminder) {
        try {
          console.log("Checking profile completion for user:", currentUser.email);
          const profileStatus = await isProfileCompleted();
          console.log("Profile completion status:", profileStatus);
          
          if (!profileStatus) {
            setShowProfileReminder(true);
          }
        } catch (error) {
          console.error("Error checking profile completion:", error);
          setError('500'); // Set 500 Internal Server Error for verification failures
        } finally {
          setCheckingProfile(false);
        }
      } else {
        setCheckingProfile(false);
      }
    }

    verifyAdminStatus();
    verifyProfileCompletion();
  }, [requireAdmin, requireProfileCompletion, currentUser, refreshAdminStatus, isProfileCompleted, hasSeenProfileReminder]);

  // Function to dismiss the reminder and continue
  const dismissReminder = () => {
    setShowProfileReminder(false);
    markProfileReminderSeen();
  };

  // Function to go to profile completion
  const goToProfileCompletion = () => {
    setShowProfileReminder(false);
    markProfileReminderSeen();
    navigate('/profile-completion', { 
      state: { 
        from: location,
        fromSocialLogin: true
      } 
    });
  };

  // Show loading indicator while checking status
  if (checkingAdmin || checkingProfile) {
    return <div className="loading-container">
      <div className="loading-spinner"></div>
      <p>Verifying access...</p>
    </div>;
  }

  // If requireAdmin flag is true, check if user is admin
  if (requireAdmin && !adminVerified) {
    console.log("Admin access denied. Auth state: currentUser=", !!currentUser, 
      "isAdmin=", isAdmin, "adminVerified=", adminVerified);
    
    // Let's show more details to help diagnose the issue
    if (currentUser) {
      console.log("User email:", currentUser.email);
      console.log("User ID:", currentUser.uid);
      console.log("Provider data:", currentUser.providerData);
    }
    
    // Return 403 Forbidden for unauthorized admin access
    return <Navigate to="/unauthorized" state={{ from: location, status: 403 }} replace />;
  }

  // If no user, redirect to login with the current location for redirect after login
  if (!currentUser) {
    // Return 401 Unauthorized for unauthenticated access
    return <Navigate to="/login" state={{ from: location, status: 401 }} replace />;
  }

  // If profile completion is required and not completed, show reminder
  if (requireProfileCompletion && showProfileReminder) {
    return (
      <div className="profile-reminder">
        <h2>Complete Your Profile</h2>
        <p>Please complete your profile to access this page.</p>
        <div className="button-group">
          <button onClick={goToProfileCompletion}>Complete Profile</button>
          <button onClick={dismissReminder}>Not Now</button>
        </div>
      </div>
    );
  }

  // If all checks pass, render the protected content
  return <Outlet />;
} 