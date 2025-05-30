import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePack } from '../contexts/PackContext';
import { useAuth } from '../contexts/AuthContext';
import { useLocale } from '../contexts/LocaleContext';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import './PackCommon.css';
import './TravelerDetails.css';

// Mock function for user lookup - in a real app, this would query a database
const lookupUserByEmail = async (email) => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // This is just a mock, in a real application this would check your user database
  const mockUsers = {
    'john@example.com': { firstName: 'John', lastName: 'Doe', birthdate: '1985-06-15' },
    'jane@example.com': { firstName: 'Jane', lastName: 'Smith', birthdate: '1990-03-22' },
  };
  
  return mockUsers[email] || null;
};

export default function TravelerDetails() {
  const { packItems, bookingDetails, updateTraveler, addTraveler, removeTraveler, updateReservationHolder } = usePack();
  const { currentUser } = useAuth();
  const { getLocalizedPath } = useLocale();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Make sure the number of travelers matches the number set in booking details
  useEffect(() => {
    if (packItems.length === 0) {
      navigate(getLocalizedPath('/your-pack'));
      return;
    }
    
    const numPeople = bookingDetails.numberOfPeople;
    const currentTravelers = bookingDetails.travelers.length;
    
    if (numPeople > currentTravelers) {
      // Add more travelers
      for (let i = currentTravelers; i < numPeople; i++) {
        addTraveler();
      }
    } else if (numPeople < currentTravelers) {
      // Remove excess travelers
      for (let i = currentTravelers - 1; i >= numPeople; i--) {
        removeTraveler(i);
      }
    }
  }, [packItems, bookingDetails.numberOfPeople, navigate, getLocalizedPath, addTraveler, removeTraveler, bookingDetails.travelers.length]);
  
  // Fill in current user's info if available
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    // Ensure reservationHolder exists with default values
    if (!bookingDetails.reservationHolder) {
      updateReservationHolder({
        email: '',
        firstName: '',
        lastName: '',
        age: '',
        gender: '',
        mobile: '+1',
        countryCode: '+1'
      });
      return; // Exit early to prevent further updates in this cycle
    }
    
    // Only auto-fill if currentUser exists and reservoir holder data is empty (first time load)
    if (currentUser && 
        (!bookingDetails.reservationHolder?.email || !bookingDetails.reservationHolder?.firstName) &&
        currentUser.email && // Ensure user has an email
        bookingDetails.reservationHolder?.email !== currentUser.email) { // Prevent duplicate updates
      
      // Extract gender from title if available
      let gender = currentUser.gender || '';
      if (!gender && currentUser.title) {
        const title = currentUser.title.toLowerCase();
        if (title === 'mr') gender = 'male';
        else if (title === 'mrs' || title === 'ms' || title === 'miss') gender = 'female';
      }

      // Extract names from displayName or use individual fields
      let firstName = currentUser.firstName || '';
      let lastName = currentUser.lastName || '';
      
      if (!firstName && currentUser.displayName) {
        const nameParts = currentUser.displayName.split(' ');
        firstName = nameParts[0] || '';
        lastName = nameParts.slice(1).join(' ') || '';
      }
      
      // Autofill reservation holder with current user info
      updateReservationHolder({
        email: currentUser.email || '',
        firstName: firstName,
        lastName: lastName,
        mobile: currentUser.phoneNumber || '+1',
        age: currentUser.age || '',
        gender: gender
      });
    }
  }, [currentUser?.uid, currentUser?.email, currentUser?.displayName, currentUser?.phoneNumber, currentUser?.title, currentUser?.firstName, currentUser?.lastName, currentUser?.gender, updateReservationHolder]);

  const handleReservationHolderChange = (field, value) => {
    updateReservationHolder({ [field]: value });
    
    // Clear error when field is changed
    if (errors[`reservationHolder-${field}`]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`reservationHolder-${field}`];
        return newErrors;
      });
    }
  };

  const handleTravelerChange = (index, field, value) => {
    // If changing sameAsReservationHolder, copy data or clear it
    if (field === 'sameAsReservationHolder') {
      if (value) {
        // Copy data from reservation holder (except mobile) - ensure holder exists
        const holder = bookingDetails.reservationHolder || {};
        updateTraveler(index, {
          sameAsReservationHolder: true,
          email: '', // Email is optional for travelers
          firstName: holder.firstName || '',
          lastName: holder.lastName || '',
          age: holder.age || '',
          gender: holder.gender || ''
        });
      } else {
        // Clear the data and allow manual entry
        updateTraveler(index, {
          sameAsReservationHolder: false,
          firstName: '',
          lastName: '',
          age: '',
          gender: ''
        });
      }
    } else {
      updateTraveler(index, { [field]: value });
      
      // Special logic for golf-related fields
      if (field === 'playingGolf' && !value) {
        // If "Will not play golf" is selected, hide and uncheck equipment rental
        updateTraveler(index, { requiresEquipment: false });
      }
    }
    
    // Clear error when field is changed
    if (errors[`traveler${index}-${field}`]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`traveler${index}-${field}`];
        return newErrors;
      });
    }
  };

  const handleEmailLookup = async (index) => {
    const email = bookingDetails.travelers[index].email;
    if (!email) return;
    
    setIsLoading(true);
    try {
      const userData = await lookupUserByEmail(email);
      if (userData) {
        const age = userData.birthdate ? calculateAge(userData.birthdate) : '';
        updateTraveler(index, {
          firstName: userData.firstName,
          lastName: userData.lastName,
          age: age.toString()
        });
      }
    } catch (error) {
      console.error('Error looking up user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateAge = (birthdate) => {
    const today = new Date();
    const birthDate = new Date(birthdate);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Validate reservation holder - ensure it exists
    const holder = bookingDetails.reservationHolder || {};
    if (!holder.email) {
      newErrors['reservationHolder-email'] = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(holder.email)) {
      newErrors['reservationHolder-email'] = 'Invalid email format';
    }
    
    if (!holder.firstName) {
      newErrors['reservationHolder-firstName'] = 'First name is required';
    }
    
    if (!holder.lastName) {
      newErrors['reservationHolder-lastName'] = 'Last name is required';
    }
    
    if (!holder.age) {
      newErrors['reservationHolder-age'] = 'Age is required';
    } else if (isNaN(holder.age) || parseInt(holder.age) < 1) {
      newErrors['reservationHolder-age'] = 'Please enter a valid age';
    }
    
    if (!holder.gender) {
      newErrors['reservationHolder-gender'] = 'Gender is required';
    }
    
    if (!holder.mobile) {
      newErrors['reservationHolder-mobile'] = 'Mobile number is required';
    } else if (!holder.mobile.startsWith('+')) {
      newErrors['reservationHolder-mobile'] = 'Please select a country code for your phone number';
    } else {
      const digitsOnly = holder.mobile.replace(/\D/g, '');
      if (digitsOnly.length < 7) {
        newErrors['reservationHolder-mobile'] = 'Phone number is too short';
      } else if (digitsOnly.length > 15) {
        newErrors['reservationHolder-mobile'] = 'Phone number is too long';
      }
    }
    
    // Validate travelers
    bookingDetails.travelers.forEach((traveler, index) => {
      // Email is optional for travelers
      if (traveler.email && !/\S+@\S+\.\S+/.test(traveler.email)) {
        newErrors[`traveler${index}-email`] = 'Invalid email format';
      }
      
      if (!traveler.sameAsReservationHolder) {
        if (!traveler.firstName) {
          newErrors[`traveler${index}-firstName`] = 'First name is required';
        }
        
        if (!traveler.lastName) {
          newErrors[`traveler${index}-lastName`] = 'Last name is required';
        }
        
        if (!traveler.age) {
          newErrors[`traveler${index}-age`] = 'Age is required';
        } else if (isNaN(traveler.age) || parseInt(traveler.age) < 1) {
          newErrors[`traveler${index}-age`] = 'Please enter a valid age';
        }
        
        if (!traveler.gender) {
          newErrors[`traveler${index}-gender`] = 'Gender is required';
        }
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      navigate(getLocalizedPath('/special-requests'));
    }
  };

  return (
    <div className="pack-page">
      <div className="pack-container traveler-details-container">
        <div className="traveler-details-header">
          <h1>Traveler Information</h1>
          <p>Please provide details for the reservation holder and each traveler in your group</p>
        </div>

        <div className="traveler-details-content">
          <form onSubmit={handleSubmit} className="traveler-form">
            
            {/* Reservation Holder Section */}
            <div className="reservation-holder-section">
              <h2>Reservation Holder</h2>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="holder-email">Email Address *</label>
                  <input 
                    type="email" 
                    id="holder-email" 
                    value={bookingDetails.reservationHolder?.email || ''}
                    onChange={(e) => handleReservationHolderChange('email', e.target.value)}
                    className={errors['reservationHolder-email'] ? 'error' : ''}
                  />
                  {errors['reservationHolder-email'] && 
                    <span className="error-message">{errors['reservationHolder-email']}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="holder-firstName">First Name *</label>
                  <input 
                    type="text" 
                    id="holder-firstName" 
                    value={bookingDetails.reservationHolder?.firstName || ''}
                    onChange={(e) => handleReservationHolderChange('firstName', e.target.value)}
                    className={errors['reservationHolder-firstName'] ? 'error' : ''}
                  />
                  {errors['reservationHolder-firstName'] && 
                    <span className="error-message">{errors['reservationHolder-firstName']}</span>}
                </div>
                
                <div className="form-group">
                  <label htmlFor="holder-lastName">Last Name *</label>
                  <input 
                    type="text" 
                    id="holder-lastName" 
                    value={bookingDetails.reservationHolder?.lastName || ''}
                    onChange={(e) => handleReservationHolderChange('lastName', e.target.value)}
                    className={errors['reservationHolder-lastName'] ? 'error' : ''}
                  />
                  {errors['reservationHolder-lastName'] && 
                    <span className="error-message">{errors['reservationHolder-lastName']}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="holder-age">Age *</label>
                  <input 
                    type="number" 
                    id="holder-age" 
                    value={bookingDetails.reservationHolder?.age || ''}
                    onChange={(e) => handleReservationHolderChange('age', e.target.value)}
                    min="1"
                    max="120"
                    className={errors['reservationHolder-age'] ? 'error' : ''}
                  />
                  {errors['reservationHolder-age'] && 
                    <span className="error-message">{errors['reservationHolder-age']}</span>}
                </div>
                
                <div className="form-group">
                  <label htmlFor="holder-gender">Gender *</label>
                  <select 
                    id="holder-gender" 
                    value={bookingDetails.reservationHolder?.gender || ''}
                    onChange={(e) => handleReservationHolderChange('gender', e.target.value)}
                    className={errors['reservationHolder-gender'] ? 'error' : ''}
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer-not-to-say">Prefer not to say</option>
                  </select>
                  {errors['reservationHolder-gender'] && 
                    <span className="error-message">{errors['reservationHolder-gender']}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="holder-mobile">Mobile Number *</label>
                  <div className="mobile-input-container">
                    <PhoneInput 
                      international
                      defaultCountry="US"
                      value={bookingDetails.reservationHolder?.mobile || '+1'}
                      onChange={(value) => handleReservationHolderChange('mobile', value || '+1')}
                      className={`phone-input-with-flags ${errors['reservationHolder-mobile'] ? 'error' : ''}`}
                      placeholder="Enter phone number with country code"
                      countrySelectProps={{ unicodeFlags: true }}
                    />
                  </div>
                  {errors['reservationHolder-mobile'] && 
                    <span className="error-message">{errors['reservationHolder-mobile']}</span>}
                </div>
              </div>
            </div>

            {/* Travelers Section */}
            {bookingDetails.travelers.map((traveler, index) => (
              <div key={index} className="traveler-section">
                <h2>Traveler {index + 1}</h2>
                
                {/* Same as Reservation Holder Option - only for first traveler */}
                {index === 0 && (
                  <div className="form-row same-as-holder-row">
                    <div className="form-group checkbox-group">
                      <label className="checkbox-label">
                        <input 
                          type="checkbox" 
                          checked={traveler.sameAsReservationHolder}
                          onChange={(e) => handleTravelerChange(index, 'sameAsReservationHolder', e.target.checked)}
                        />
                        Same as Reservation Holder
                      </label>
                    </div>
                  </div>
                )}

                {!traveler.sameAsReservationHolder && (
                  <>
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor={`email-${index}`}>Email Address</label>
                        <div className="email-lookup-container">
                          <input 
                            type="email" 
                            id={`email-${index}`} 
                            value={traveler.email}
                            onChange={(e) => handleTravelerChange(index, 'email', e.target.value)}
                            onBlur={() => handleEmailLookup(index)}
                            className={errors[`traveler${index}-email`] ? 'error' : ''}
                          />
                          {isLoading && <div className="loading-spinner"></div>}
                        </div>
                        {errors[`traveler${index}-email`] && 
                          <span className="error-message">{errors[`traveler${index}-email`]}</span>}
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor={`firstName-${index}`}>First Name *</label>
                        <input 
                          type="text" 
                          id={`firstName-${index}`} 
                          value={traveler.firstName}
                          onChange={(e) => handleTravelerChange(index, 'firstName', e.target.value)}
                          className={errors[`traveler${index}-firstName`] ? 'error' : ''}
                        />
                        {errors[`traveler${index}-firstName`] && 
                          <span className="error-message">{errors[`traveler${index}-firstName`]}</span>}
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor={`lastName-${index}`}>Last Name *</label>
                        <input 
                          type="text" 
                          id={`lastName-${index}`} 
                          value={traveler.lastName}
                          onChange={(e) => handleTravelerChange(index, 'lastName', e.target.value)}
                          className={errors[`traveler${index}-lastName`] ? 'error' : ''}
                        />
                        {errors[`traveler${index}-lastName`] && 
                          <span className="error-message">{errors[`traveler${index}-lastName`]}</span>}
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor={`age-${index}`}>Age *</label>
                        <input 
                          type="number" 
                          id={`age-${index}`} 
                          value={traveler.age}
                          onChange={(e) => handleTravelerChange(index, 'age', e.target.value)}
                          min="1"
                          max="120"
                          className={errors[`traveler${index}-age`] ? 'error' : ''}
                        />
                        {errors[`traveler${index}-age`] && 
                          <span className="error-message">{errors[`traveler${index}-age`]}</span>}
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor={`gender-${index}`}>Gender *</label>
                        <select 
                          id={`gender-${index}`} 
                          value={traveler.gender}
                          onChange={(e) => handleTravelerChange(index, 'gender', e.target.value)}
                          className={errors[`traveler${index}-gender`] ? 'error' : ''}
                        >
                          <option value="">Select Gender</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                          <option value="prefer-not-to-say">Prefer not to say</option>
                        </select>
                        {errors[`traveler${index}-gender`] && 
                          <span className="error-message">{errors[`traveler${index}-gender`]}</span>}
                      </div>
                    </div>
                  </>
                )}

                <div className="form-row golf-options">
                  <div className="form-group checkbox-group">
                    <label className="checkbox-label">
                      <input 
                        type="checkbox" 
                        checked={!traveler.playingGolf}
                        onChange={(e) => handleTravelerChange(index, 'playingGolf', !e.target.checked)}
                      />
                      Will not play golf
                    </label>
                  </div>
                  
                  {traveler.playingGolf && (
                    <div className="form-group checkbox-group">
                      <label className="checkbox-label">
                        <input 
                          type="checkbox" 
                          checked={traveler.requiresEquipment}
                          onChange={(e) => handleTravelerChange(index, 'requiresEquipment', e.target.checked)}
                        />
                        Requires equipment rental
                      </label>
                    </div>
                  )}
                </div>
              </div>
            ))}

            <div className="booking-navigation">
              <button 
                type="button" 
                className="back-button"
                onClick={() => navigate(getLocalizedPath('/booking-details'))}
              >
                Back to Travel Details
              </button>
              <button type="submit" className="next-button">
                Next: Special Requests
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}