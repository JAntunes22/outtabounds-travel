import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLocale } from '../../contexts/LocaleContext';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import './Auth.css';

export default function ProfileCompletion() {
  const [title, setTitle] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [receiveOffers, setReceiveOffers] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const { currentUser, updateUserProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { getLocalizedPath } = useLocale();
  
  useEffect(() => {
    console.log("ProfileCompletion component mounted, current user:", !!currentUser);
    console.log("Location state:", location.state);
    
    if (!currentUser) {
      console.log("No user logged in, redirecting to login");
      // Redirect to login if no user is logged in
      navigate(getLocalizedPath('/login'));
      return;
    }
    
    // If this page was not accessed via social login, check if profile needs completion
    if (!location.state?.fromSocialLogin) {
      console.log("Page accessed directly, not from social login flow");
      // Check if profile is already completed
      const checkProfileStatus = async () => {
        try {
          // We could check Firestore directly here to determine if profile needs completion
          // For now, just allow normal flow if they somehow got here directly
          console.log("User accessed profile completion page directly");
        } catch (error) {
          console.error("Error checking profile status:", error);
        }
      };
      
      checkProfileStatus();
    } else {
      console.log("Page accessed from social login flow");
    }
    
    // Populate name fields if available from the social provider
    if (currentUser?.displayName) {
      console.log("Using displayName from auth profile:", currentUser.displayName);
      const nameParts = currentUser.displayName.split(' ');
      if (nameParts.length >= 1) {
        setFirstName(nameParts[0]);
      }
      if (nameParts.length >= 2) {
        setLastName(nameParts.slice(1).join(' '));
      }
    }

    // No cleanup function that logs out user - we want to stay logged in
  }, [currentUser, navigate, location.state, getLocalizedPath]);

  // Remove the handleBeforeUnload effect that warns users they'll be logged out
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (!formSubmitted) {
        // Just show a generic message about incomplete profile
        const message = "Your profile is incomplete. You can complete it later from your profile page.";
        e.returnValue = message;
        return message;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [formSubmitted]);

  // Handle phone number change
  const handlePhoneChange = (value) => {
    setPhoneNumber(value || '');
  };

  async function handleSubmit(e) {
    e.preventDefault();

    // Validation
    if (!firstName.trim() || !lastName.trim()) {
      return setError('First name and last name are required');
    }

    // Validate phone number if provided
    if (phoneNumber) {
      // Check if phone number appears to be formatted as an international number
      if (!phoneNumber.startsWith('+')) {
        return setError('Please include a country code for your phone number (starting with +)');
      }
      
      // Extract digits only from the phone number (including country code)
      const digitsOnly = phoneNumber.replace(/\D/g, '');
      
      // International phone numbers including country code shouldn't exceed 15 digits
      if (digitsOnly.length > 15) {
        return setError('Phone number (including country code) cannot exceed 15 digits');
      }
      
      // Also check if the number has a reasonable minimum length
      if (digitsOnly.length < 7) {
        return setError('Phone number is too short to be valid');
      }
    } else {
      return setError('Phone number is required');
    }

    try {
      setError('');
      setLoading(true);

      // Prepare user data for update
      const userData = {
        title,
        firstName,
        lastName,
        fullname: `${firstName} ${lastName}`,
        phoneNumber,
        receiveOffers,
        profileCompleted: true
      };

      console.log("Updating user profile with data:", userData);

      // Update user profile in Firebase
      await updateUserProfile(userData);
      
      console.log("Profile updated successfully");
      
      // Mark form as submitted to prevent logout on unmount
      setFormSubmitted(true);
      
      // Redirect to homepage
      navigate(getLocalizedPath('/'));
    } catch (error) {
      console.error("Profile completion error:", error);
      setError('Failed to complete profile: ' + (error.message || 'Unknown error occurred'));
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    try {
      setLoading(true);
      // Don't log out, just navigate away
      console.log("User canceled profile completion");
      
      // Redirect to homepage or the "from" location if available
      const destination = location.state?.from?.pathname || getLocalizedPath('/');
      console.log("Redirecting to:", destination);
      navigate(destination);
    } catch (error) {
      console.error("Error canceling profile completion:", error);
      setError('Failed to cancel: ' + (error.message || 'Unknown error occurred'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Complete Your Profile</h2>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Title</label>
            <select 
              id="title"
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              className="form-select"
            >
              <option value="">Select</option>
              <option value="Mr">Mr</option>
              <option value="Mrs">Mrs</option>
              <option value="Ms">Ms</option>
              <option value="Dr">Dr</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">First name</label>
              <input 
                type="text"
                id="firstName" 
                value={firstName} 
                onChange={(e) => setFirstName(e.target.value)} 
                required 
              />
            </div>
            <div className="form-group">
              <label htmlFor="lastName">Last name</label>
              <input 
                type="text"
                id="lastName" 
                value={lastName} 
                onChange={(e) => setLastName(e.target.value)} 
                required 
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="phoneNumber">Primary phone number</label>
            <PhoneInput
              international
              defaultCountry="US"
              value={phoneNumber}
              onChange={handlePhoneChange}
              className="phone-input-with-flags"
              containerClass="phone-input-container"
              inputClass="phone-input"
              placeholder="Enter phone number with country code"
              countrySelectProps={{ unicodeFlags: true }}
            />
            <p className="input-help-text">This can be a mobile or landline (with country code)</p>
          </div>

          <div className="form-group checkbox-group">
            <label className="checkbox-container">
              <input 
                type="checkbox" 
                checked={receiveOffers} 
                onChange={(e) => setReceiveOffers(e.target.checked)}
              />
              <span className="checkbox-text">
                Yes, send me exclusive golf travel offers and updates.
              </span>
            </label>
          </div>

          <div className="button-group">
            <button 
              type="button" 
              disabled={loading} 
              className="auth-button back-button"
              onClick={handleCancel}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading} 
              className="auth-button next-button"
            >
              {loading ? "Processing..." : "Complete Profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 