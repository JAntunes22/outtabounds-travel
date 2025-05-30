import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePack } from '../contexts/PackContext';
import { useLocale } from '../contexts/LocaleContext';
import './PackCommon.css';
import './SpecialRequests.css';

export default function SpecialRequests() {
  const { packItems, bookingDetails, updateSpecialRequests } = usePack();
  const { getLocalizedPath } = useLocale();
  const navigate = useNavigate();
  
  // Calculate default golf rounds based on selected courses
  const totalGolfCourses = packItems.filter(item => item.type === 'course').length;
  
  const [formData, setFormData] = useState({
    golfRounds: bookingDetails.specialRequests.golfRounds || totalGolfCourses,
    notes: bookingDetails.specialRequests.notes || '',
    budgetMin: bookingDetails.specialRequests.budgetMin || 0,
    budgetMax: bookingDetails.specialRequests.budgetMax || 5000
  });

  // Redirect if pack is empty
  useEffect(() => {
    if (packItems.length === 0) {
      navigate(getLocalizedPath('/your-pack'));
    }
  }, [packItems, navigate, getLocalizedPath]);

  // Update golf rounds when course selection changes
  useEffect(() => {
    if (!bookingDetails.specialRequests.golfRounds || bookingDetails.specialRequests.golfRounds === 0) {
      setFormData(prev => ({ ...prev, golfRounds: totalGolfCourses }));
    }
  }, [totalGolfCourses, bookingDetails.specialRequests.golfRounds]);

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSliderChange = (field, value) => {
    const numValue = parseInt(value, 10);
    setFormData(prev => {
      const newData = { ...prev, [field]: numValue };
      
      // Ensure min doesn't exceed max and vice versa
      if (field === 'budgetMin' && numValue > prev.budgetMax) {
        newData.budgetMax = numValue;
      } else if (field === 'budgetMax' && numValue < prev.budgetMin) {
        newData.budgetMin = numValue;
      }
      
      return newData;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Update special requests in context
    updateSpecialRequests(formData);
    
    // Navigate to review page
    navigate(getLocalizedPath('/review-inquiry'));
  };

  const handleBack = () => {
    navigate(getLocalizedPath('/traveler-details'));
  };

  return (
    <div className="pack-page">
      <div className="pack-container special-requests-container">
        <div className="special-requests-header">
          <h1>Special Requests</h1>
          <p>Tell us more about your preferences for this trip</p>
        </div>

        <div className="special-requests-content">
          <form onSubmit={handleSubmit} className="special-requests-form">
            
            <div className="form-section">
              <h2>Golf Preferences</h2>
              <div className="form-group">
                <label htmlFor="golfRounds">Number of Golf Rounds Desired</label>
                <div className="golf-rounds-input">
                  <button 
                    type="button" 
                    className="rounds-button rounds-down"
                    onClick={() => handleChange('golfRounds', Math.max(0, formData.golfRounds - 1))}
                    disabled={formData.golfRounds <= 0}
                  >
                    −
                  </button>
                  <div className="rounds-display">
                    {formData.golfRounds}
                  </div>
                  <button 
                    type="button" 
                    className="rounds-button rounds-up"
                    onClick={() => handleChange('golfRounds', Math.min(20, formData.golfRounds + 1))}
                    disabled={formData.golfRounds >= 20}
                  >
                    +
                  </button>
                </div>
                <p className="help-text">
                  Based on your selected courses: {totalGolfCourses} course{totalGolfCourses !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            <div className="form-section">
              <h2>Budget Range</h2>
              <div className="budget-slider-section">
                <div className="budget-display">
                  <span className="budget-value">€{formData.budgetMin.toLocaleString()}</span>
                  <span className="budget-separator">-</span>
                  <span className="budget-value">€{formData.budgetMax.toLocaleString()}</span>
                </div>
                
                <div className="dual-range-container">
                  <div className="dual-range-wrapper">
                    <input 
                      type="range" 
                      id="budgetMin"
                      min="0" 
                      max="10000" 
                      step="100"
                      value={formData.budgetMin}
                      onChange={(e) => handleSliderChange('budgetMin', e.target.value)}
                      className="range-slider range-min"
                    />
                    <input 
                      type="range" 
                      id="budgetMax"
                      min="0" 
                      max="10000" 
                      step="100"
                      value={formData.budgetMax}
                      onChange={(e) => handleSliderChange('budgetMax', e.target.value)}
                      className="range-slider range-max"
                    />
                    <div className="range-track">
                      <div 
                        className="range-fill"
                        style={{
                          left: `${(formData.budgetMin / 10000) * 100}%`,
                          width: `${((formData.budgetMax - formData.budgetMin) / 10000) * 100}%`
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
                
                <div className="budget-range-labels">
                  <span>€0</span>
                  <span>€10,000</span>
                </div>
              </div>
            </div>

            <div className="form-section">
              <h2>Additional Notes</h2>
              <div className="form-group">
                <label htmlFor="notes">Any special requests or preferences?</label>
                <textarea 
                  id="notes" 
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  rows="5"
                  placeholder="Tell us about any dietary requirements, accessibility needs, special celebrations, or other preferences..."
                />
              </div>
            </div>

            <div className="booking-navigation">
              <button 
                type="button" 
                className="back-button"
                onClick={handleBack}
              >
                Back to Traveler Details
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