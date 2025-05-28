import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLocale } from '../../contexts/LocaleContext';
import Logger from '../../utils/logger';
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
  const { getLocalizedPath } = useLocale();

  // When component loads, force check admin status if required
  useEffect(() => {
    async function verifyAdminStatus() {
      if (requireAdmin && currentUser) {
        try {
          Logger.debug("Verifying admin access for user:", currentUser.email);
          Logger.debug("Current admin state before verification:", isAdmin);
          
          const adminStatus = await refreshAdminStatus();
          Logger.debug("Admin verification result:", adminStatus);
          setAdminVerified(adminStatus);
          
          if (!adminStatus) {
            Logger.error("Admin access denied - user not an admin.");
          }
        } catch (error) {
          Logger.error("Error verifying admin status:", error);
          setAdminVerified(false);
        } finally {
          setCheckingAdmin(false);
        }
      } else {
        Logger.debug("Admin verification not required or no current user");
        setCheckingAdmin(false);
      }
    }

    async function verifyProfileCompletion() {
      if (requireProfileCompletion && currentUser && !hasSeenProfileReminder) {
        try {
          Logger.debug("Checking profile completion for user:", currentUser.email);
          const profileStatus = await isProfileCompleted();
          Logger.debug("Profile completion status:", profileStatus);
          
          if (!profileStatus) {
            setShowProfileReminder(true);
          }
        } catch (error) {
          Logger.error("Error checking profile completion:", error);
        } finally {
          setCheckingProfile(false);
        }
      } else {
        setCheckingProfile(false);
      }
    }

    verifyAdminStatus();
    verifyProfileCompletion();
  }, [requireAdmin, requireProfileCompletion, currentUser, refreshAdminStatus, isProfileCompleted, hasSeenProfileReminder, isAdmin]);

  // Function to dismiss the reminder and continue
  const dismissReminder = () => {
    setShowProfileReminder(false);
    markProfileReminderSeen();
  };

  // Function to go to profile completion
  const goToProfileCompletion = () => {
    setShowProfileReminder(false);
    markProfileReminderSeen();
    navigate(getLocalizedPath('/profile-completion'), { 
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
    Logger.debug("Admin access denied. Auth state: currentUser=", !!currentUser, 
      "isAdmin=", isAdmin, "adminVerified=", adminVerified);
    
    // Let's show more details to help diagnose the issue
    if (currentUser) {
      Logger.debug("User email:", currentUser.email);
      Logger.debug("User ID:", currentUser.uid);
      Logger.debug("Provider data:", currentUser.providerData);
    }
    
    // Return 403 Forbidden for unauthorized admin access
    return <Navigate to={getLocalizedPath('/unauthorized')} state={{ from: location, status: 403 }} replace />;
  }

  // If no user, redirect to login with the current location for redirect after login
  if (!currentUser) {
    // Return 401 Unauthorized for unauthenticated access
    return <Navigate to={getLocalizedPath('/login')} state={{ from: location, status: 401 }} replace />;
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