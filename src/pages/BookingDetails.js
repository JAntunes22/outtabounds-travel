import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePack } from '../contexts/PackContext';
import Footer from '../components/Footer';
import './PackCommon.css';
import './BookingDetails.css';

export default function BookingDetails() {
  const { packItems, bookingDetails, updateBookingDetails } = usePack();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    startDate: bookingDetails.travelDates.startDate || '',
    endDate: bookingDetails.travelDates.endDate || '',
    numberOfPeople: bookingDetails.numberOfPeople || 1
  });
  const [errors, setErrors] = useState({});

  // Redirect if pack is empty
  useEffect(() => {
    if (packItems.length === 0) {
      navigate('/your-pack');
    }
  }, [packItems, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.startDate) newErrors.startDate = 'Start date is required';
    if (!formData.endDate) newErrors.endDate = 'End date is required';
    if (formData.startDate && formData.endDate && new Date(formData.startDate) > new Date(formData.endDate)) {
      newErrors.endDate = 'End date must be after start date';
    }
    if (!formData.numberOfPeople || formData.numberOfPeople < 1) {
      newErrors.numberOfPeople = 'Number of people must be at least 1';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      // Update the booking details in context
      updateBookingDetails({
        travelDates: {
          startDate: formData.startDate,
          endDate: formData.endDate
        },
        numberOfPeople: parseInt(formData.numberOfPeople, 10)
      });
      navigate('/traveler-details');
    }
  };

  const calculateMinimumEndDate = () => {
    if (!formData.startDate) return '';
    const startDate = new Date(formData.startDate);
    const nextDay = new Date(startDate);
    nextDay.setDate(startDate.getDate() + 1);
    return nextDay.toISOString().split('T')[0];
  };

  const calculateMinimumStartDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  return (
    <div className="pack-page">
      <div className="pack-container booking-details-container">
        <div className="booking-details-header">
          <h1>Travel Details</h1>
          <p>Let us know when you'd like to travel and how many people will be joining you</p>
        </div>

        <div className="booking-details-content">
          <form onSubmit={handleSubmit} className="booking-form">
            <div className="form-section">
              <h2>Travel Dates</h2>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="startDate">Start Date</label>
                  <input 
                    type="date" 
                    id="startDate" 
                    name="startDate" 
                    value={formData.startDate}
                    onChange={handleChange}
                    min={calculateMinimumStartDate()}
                    className={errors.startDate ? 'error' : ''}
                  />
                  {errors.startDate && <span className="error-message">{errors.startDate}</span>}
                </div>
                
                <div className="form-group">
                  <label htmlFor="endDate">End Date</label>
                  <input 
                    type="date" 
                    id="endDate" 
                    name="endDate" 
                    value={formData.endDate}
                    onChange={handleChange}
                    min={calculateMinimumEndDate()}
                    className={errors.endDate ? 'error' : ''}
                  />
                  {errors.endDate && <span className="error-message">{errors.endDate}</span>}
                </div>
              </div>
            </div>

            <div className="form-section">
              <h2>Number of Travelers</h2>
              <div className="form-group">
                <label htmlFor="numberOfPeople">How many people will be traveling?</label>
                <input 
                  type="number" 
                  id="numberOfPeople" 
                  name="numberOfPeople" 
                  value={formData.numberOfPeople}
                  onChange={handleChange}
                  min="1"
                  max="20"
                  className={errors.numberOfPeople ? 'error' : ''}
                />
                {errors.numberOfPeople && <span className="error-message">{errors.numberOfPeople}</span>}
              </div>
            </div>

            <div className="booking-navigation">
              <button 
                type="button" 
                className="back-button"
                onClick={() => navigate('/your-pack')}
              >
                Back to Pack
              </button>
              <button type="submit" className="next-button">
                Next: Traveler Details
              </button>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
} 