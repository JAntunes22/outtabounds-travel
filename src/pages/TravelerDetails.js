import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePack } from '../contexts/PackContext';
import { useAuth } from '../contexts/AuthContext';
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
  const { packItems, bookingDetails, updateTraveler, addTraveler, removeTraveler } = usePack();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Make sure the number of travelers matches the number set in booking details
  useEffect(() => {
    if (packItems.length === 0) {
      navigate('/your-pack');
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
  }, [packItems, bookingDetails.numberOfPeople, navigate, addTraveler, removeTraveler, bookingDetails.travelers.length]);
  
  // Fill in current user's info if available
  useEffect(() => {
    if (currentUser && bookingDetails.travelers.length > 0) {
      // Only autofill if the first traveler's fields are empty
      const firstTraveler = bookingDetails.travelers[0];
      if (!firstTraveler.email && !firstTraveler.firstName) {
        updateTraveler(0, {
          email: currentUser.email || '',
          firstName: currentUser.displayName ? currentUser.displayName.split(' ')[0] : '',
          lastName: currentUser.displayName ? currentUser.displayName.split(' ').slice(1).join(' ') : ''
        });
      }
    }
  }, [currentUser, bookingDetails.travelers, updateTraveler]);

  const handleChange = (index, field, value) => {
    updateTraveler(index, { [field]: value });
    
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
    bookingDetails.travelers.forEach((traveler, index) => {
      if (!traveler.email) {
        newErrors[`traveler${index}-email`] = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(traveler.email)) {
        newErrors[`traveler${index}-email`] = 'Invalid email format';
      }
      
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
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      navigate('/review-inquiry');
    }
  };

  return (
    <div className="pack-page">
      <div className="pack-container traveler-details-container">
        <div className="traveler-details-header">
          <h1>Traveler Information</h1>
          <p>Please provide details for each traveler in your group</p>
        </div>

        <div className="traveler-details-content">
          <form onSubmit={handleSubmit} className="traveler-form">
            {bookingDetails.travelers.map((traveler, index) => (
              <div key={index} className="traveler-section">
                <h2>Traveler {index + 1}</h2>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor={`email-${index}`}>Email Address</label>
                    <div className="email-lookup-container">
                      <input 
                        type="email" 
                        id={`email-${index}`} 
                        value={traveler.email}
                        onChange={(e) => handleChange(index, 'email', e.target.value)}
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
                    <label htmlFor={`firstName-${index}`}>First Name</label>
                    <input 
                      type="text" 
                      id={`firstName-${index}`} 
                      value={traveler.firstName}
                      onChange={(e) => handleChange(index, 'firstName', e.target.value)}
                      className={errors[`traveler${index}-firstName`] ? 'error' : ''}
                    />
                    {errors[`traveler${index}-firstName`] && 
                      <span className="error-message">{errors[`traveler${index}-firstName`]}</span>}
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor={`lastName-${index}`}>Last Name</label>
                    <input 
                      type="text" 
                      id={`lastName-${index}`} 
                      value={traveler.lastName}
                      onChange={(e) => handleChange(index, 'lastName', e.target.value)}
                      className={errors[`traveler${index}-lastName`] ? 'error' : ''}
                    />
                    {errors[`traveler${index}-lastName`] && 
                      <span className="error-message">{errors[`traveler${index}-lastName`]}</span>}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor={`age-${index}`}>Age</label>
                    <input 
                      type="number" 
                      id={`age-${index}`} 
                      value={traveler.age}
                      onChange={(e) => handleChange(index, 'age', e.target.value)}
                      min="1"
                      max="120"
                      className={errors[`traveler${index}-age`] ? 'error' : ''}
                    />
                    {errors[`traveler${index}-age`] && 
                      <span className="error-message">{errors[`traveler${index}-age`]}</span>}
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor={`gender-${index}`}>Gender</label>
                    <select 
                      id={`gender-${index}`} 
                      value={traveler.gender}
                      onChange={(e) => handleChange(index, 'gender', e.target.value)}
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

                <div className="form-row golf-options">
                  <div className="form-group checkbox-group">
                    <label className="checkbox-label">
                      <input 
                        type="checkbox" 
                        checked={traveler.playingGolf}
                        onChange={(e) => handleChange(index, 'playingGolf', e.target.checked)}
                      />
                      Will play golf
                    </label>
                  </div>
                  
                  {traveler.playingGolf && (
                    <div className="form-group checkbox-group">
                      <label className="checkbox-label">
                        <input 
                          type="checkbox" 
                          checked={traveler.requiresEquipment}
                          onChange={(e) => handleChange(index, 'requiresEquipment', e.target.checked)}
                          disabled={!traveler.playingGolf}
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
                onClick={() => navigate('/booking-details')}
              >
                Back to Travel Details
              </button>
              <button type="submit" className="next-button">
                Review Inquiry
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 