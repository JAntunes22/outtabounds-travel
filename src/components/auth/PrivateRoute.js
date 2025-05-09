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

    async function verifyProfileCompletion() {
      if (requireProfileCompletion && currentUser && !hasSeenProfileReminder) {
        try {
          console.log("Checking profile completion for user:", currentUser.email);
          const profileStatus = await isProfileCompleted();
          console.log("Profile completion status:", profileStatus);
          
          // If profile is incomplete, show a reminder
          if (!profileStatus) {
            setShowProfileReminder(true);
          }
        } catch (error) {
          console.error("Error checking profile completion:", error);
        } finally {
          setCheckingProfile(false);
        }
      } else {
        setCheckingProfile(false);
      }
    }

    verifyAdminStatus();
    verifyProfileCompletion();
  }, [requireAdmin, requireProfileCompletion, currentUser, refreshAdminStatus, isProfileCompleted, hasSeenProfileReminder, markProfileReminderSeen]);

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
    console.log("Admin access denied. Auth state: currentUser=", !!currentUser, "isAdmin=", isAdmin, "adminVerified=", adminVerified);
    // Redirect to unauthorized page if user is not an admin
    return <Navigate to="/unauthorized" state={{ from: location }} replace />;
  }

  // If no user, redirect to login with the current location for redirect after login
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Show profile completion reminder if needed
  if (showProfileReminder) {
    return (
      <div className="auth-container with-outlet">
        <div className="popup-overlay">
          <div className="popup-content">
            <div className="popup-header">
              <h3>Complete Your Profile</h3>
              <button className="close-button" onClick={dismissReminder}>&times;</button>
            </div>
            <div className="popup-body">
              <p>
                Your profile is incomplete. We recommend completing your profile to 
                ensure you get the best experience with OuttaBounds.
              </p>
              <div className="button-group" style={{ marginTop: '20px' }}>
                <button className="back-button" onClick={dismissReminder}>Continue Anyway</button>
                <button className="auth-button" onClick={goToProfileCompletion}>Complete Now</button>
              </div>
            </div>
          </div>
        </div>
        <Outlet />
      </div>
    );
  }

  // If user is authenticated, admin verified if required, and profile complete or not required, render the child routes
  return <Outlet />;
} 