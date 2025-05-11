import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import './Auth.css';

export default function MultiStepSignup() {
  // State for form data
  const [formData, setFormData] = useState({
    email: '',
    title: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    receiveOffers: false
  });
  
  // State for current step
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  const { signup, checkEmailExists, resetPassword } = useAuth();
  const navigate = useNavigate();
  const authCardRef = useRef(null);

  // Regex for password validation
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  // Add a subtle parallax effect on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (authCardRef.current) {
        const scrollPos = window.scrollY;
        // Very subtle movement for the card
        if (scrollPos < window.innerHeight) {
          const scale = 1 + (scrollPos * 0.0002); // Very small scale change
          authCardRef.current.style.transform = `scale(${scale})`;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Handle phone number change separately since it's not from a standard input
  const handlePhoneChange = (value) => {
    setFormData({
      ...formData,
      phoneNumber: value || ''
    });
  };

  // Handle email check on step 1
  const handleEmailCheck = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.email) {
      return setError('Email is required');
    }
    
    try {
      setLoading(true);
      console.log("Checking if email exists:", formData.email);
      const exists = await checkEmailExists(formData.email);
      console.log("Email exists result:", exists);
      
      if (exists) {
        console.log("Email already exists, showing popup");
        setEmailExists(true);
        // Send password reset email
        await resetPassword(formData.email);
        // We don't navigate away, user needs to close the popup
      } else {
        console.log("Email doesn't exist, proceeding to step 2");
        setEmailExists(false);
        setCurrentStep(2);
      }
    } catch (error) {
      console.error("Error during email check:", error);
      setError('Error checking email: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle step 2 submission
  const handleStep2 = (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.firstName || !formData.lastName) {
      return setError('First name and last name are required');
    }
    
    // Validate phone number if provided
    if (formData.phoneNumber) {
      // Check if phone number appears to be formatted as an international number
      if (!formData.phoneNumber.startsWith('+')) {
        return setError('Please select a country code for your phone number');
      }
      
      // Check if phone number (with country code) is at most 15 digits
      const digitsOnly = formData.phoneNumber.replace(/\D/g, '');
      if (digitsOnly.length > 15) {
        return setError('Phone number (including country code) cannot exceed 15 digits');
      }
    }
    
    setCurrentStep(3);
  };

  // Handle final submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }
    
    if (!passwordRegex.test(formData.password)) {
      return setError('Password does not meet the requirements');
    }
    
    // Validate phone number if provided
    if (formData.phoneNumber) {
      // Check if phone number appears to be formatted as an international number
      if (!formData.phoneNumber.startsWith('+')) {
        return setError('Please include a country code for your phone number (starting with +)');
      }
      
      // Extract digits only from the phone number (including country code)
      const digitsOnly = formData.phoneNumber.replace(/\D/g, '');
      
      // International phone numbers including country code shouldn't exceed 15 digits
      // but we need to be a bit flexible due to different country formats
      if (digitsOnly.length > 15) {
        return setError('Phone number (including country code) cannot exceed 15 digits');
      }
      
      // Also check if the number has a reasonable minimum length
      if (digitsOnly.length < 7) {
        return setError('Phone number is too short to be valid');
      }
    }
    
    try {
      setLoading(true);
      await signup(
        formData.email,
        formData.password,
        `${formData.firstName} ${formData.lastName}`,
        {
          title: formData.title,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phoneNumber: formData.phoneNumber,
          receiveOffers: formData.receiveOffers
        }
      );
      
      // Navigate to login page after successful registration with success message
      navigate('/login', { 
        state: { 
          successMessage: 'Account successfully created, please login using your credentials.' 
        } 
      });
    } catch (error) {
      setError('Failed to create an account: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Close the email exists popup
  const handleClosePopup = () => {
    setEmailExists(false);
  };

  // Render step 1 - Email input
  const renderStep1 = () => (
    <>
      <h2>Register</h2>
      <p className="step-indicator">Step 1 of 3</p>
      
      <div className="already-member">
        Already a member? <Link to="/login">Sign in</Link>
      </div>
      
      <form onSubmit={handleEmailCheck}>
        <div className="form-group">
          <label htmlFor="email">Email address</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <p className="input-help-text">
            The address will be used for sign in & contact purposes
          </p>
        </div>
        
        <button 
          disabled={loading} 
          type="submit" 
          className="auth-button next-button"
        >
          NEXT
        </button>
      </form>
    </>
  );
  
  // Render step 2 - Personal information
  const renderStep2 = () => (
    <>
      <h2>Register</h2>
      <p className="step-indicator">Step 2 of 3</p>
      
      <form onSubmit={handleStep2}>
        <div className="form-group">
          <label htmlFor="title">Title</label>
          <select
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
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
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="lastName">Last name</label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
            />
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="phoneNumber">Primary phone number</label>
          <PhoneInput
            international
            defaultCountry="US"
            value={formData.phoneNumber}
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
              name="receiveOffers"
              checked={formData.receiveOffers}
              onChange={handleChange}
            />
            <span className="checkbox-text">
              Yes, send me exclusive golf travel offers and updates.
            </span>
          </label>
        </div>
        
        <div className="button-group">
          <button 
            type="button" 
            className="auth-button back-button"
            onClick={() => setCurrentStep(1)}
          >
            BACK
          </button>
          
          <button 
            type="submit" 
            className="auth-button next-button"
          >
            NEXT
          </button>
        </div>
      </form>
    </>
  );
  
  // Render step 3 - Password setup
  const renderStep3 = () => (
    <>
      <h2>Register</h2>
      <p className="step-indicator">Step 3 of 3</p>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
          <div className="password-requirements">
            <p>Password must contain:</p>
            <ul>
              <li className={formData.password.length >= 8 ? 'met' : ''}>
                At least 8 characters
              </li>
              <li className={/[A-Z]/.test(formData.password) ? 'met' : ''}>
                At least one uppercase letter
              </li>
              <li className={/[a-z]/.test(formData.password) ? 'met' : ''}>
                At least one lowercase letter
              </li>
              <li className={/\d/.test(formData.password) ? 'met' : ''}>
                At least one number
              </li>
              <li className={/[@$!%*?&]/.test(formData.password) ? 'met' : ''}>
                At least one special character (@$!%*?&)
              </li>
            </ul>
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="button-group">
          <button 
            type="button" 
            className="auth-button back-button"
            onClick={() => setCurrentStep(2)}
          >
            BACK
          </button>
          
          <button 
            disabled={loading} 
            type="submit" 
            className="auth-button next-button"
          >
            CREATE ACCOUNT
          </button>
        </div>
      </form>
    </>
  );
  
  // Render email exists popup
  const renderEmailExistsPopup = () => (
    <div className="popup-overlay">
      <div className="popup-content">
        <div className="popup-header">
          <h3>This email address exists in our system</h3>
          <button onClick={handleClosePopup} className="close-button">×</button>
        </div>
        <div className="popup-body">
          <p>
            An email has been sent to you with instructions on how to complete the registration process.
            Please check your junk folder if it's not in your inbox.
          </p>
          <button onClick={handleClosePopup} className="auth-button">
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="auth-container">
      <div className="auth-card" ref={authCardRef}>
        {error && <div className="auth-error">{error}</div>}
        
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        
        {emailExists && renderEmailExistsPopup()}
      </div>
    </div>
  );
} 