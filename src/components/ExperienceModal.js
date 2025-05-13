import React, { useEffect } from 'react';
import AddToPack from './AddToPack';
import './ExperienceModal.css';

const ExperienceModal = ({ experience, onClose }) => {
  // Prevent scrolling when modal is open - more robust approach
  useEffect(() => {
    // Store the current scroll position
    const scrollY = window.scrollY;
    
    // Add the modal-open class to body
    document.body.classList.add('modal-open');
    
    // Set the body position to maintain scroll position
    document.body.style.top = `-${scrollY}px`;
    
    // Cleanup function to restore scrolling when modal is closed
    return () => {
      // Remove the modal-open class
      document.body.classList.remove('modal-open');
      
      // Restore the scroll position
      document.body.style.top = '';
      window.scrollTo(0, scrollY);
    };
  }, []);

  // Handle click outside modal to close it
  const handleOverlayClick = (e) => {
    if (e.target.classList.contains('modal-overlay')) {
      onClose();
    }
  };

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.keyCode === 27) onClose();
    };
    window.addEventListener('keydown', handleEsc);
    
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  if (!experience) return null;

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="experience-modal">
        <button className="modal-close-btn" onClick={onClose}>×</button>
        
        <div className="experience-modal-content">
          <div className="modal-image-container">
            <img 
              src={experience.url} 
              alt={experience.name} 
              className="modal-image"
            />
          </div>
          
          <div className="modal-details">
            <h2 className="modal-title">{experience.name}</h2>
            
            <div className="modal-location">
              <span className="label">Location:</span>
              <span className="value">{experience.location}</span>
            </div>
            
            {experience.rating && (
              <div className="modal-rating">
                <span className="label">Rating:</span>
                <span className="value">
                  {parseFloat(experience.rating).toFixed(1)}
                  <span className="modal-rating-stars">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={i < Math.round(parseFloat(experience.rating)) ? "modal-star filled" : "modal-star"}>
                        ★
                      </span>
                    ))}
                  </span>
                </span>
              </div>
            )}
            
            {typeof experience.popularity !== 'undefined' && (
              <div className="modal-popularity">
                <span className="label">Popularity:</span>
                <div className="popularity-bar">
                  <div 
                    className="popularity-fill" 
                    style={{ width: `${experience.popularity}%` }}
                  ></div>
                </div>
                <span className="popularity-percentage">{experience.popularity}%</span>
              </div>
            )}
            
            <div className="modal-description">
              <h3>Description</h3>
              <p>{experience.description}</p>
            </div>
            
            <div className="modal-features">
              <h3>Highlights</h3>
              {Array.isArray(experience.features) && experience.features.length > 0 ? (
                <ul>
                  {experience.features.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
              ) : (
                <p>No highlights available for this experience.</p>
              )}
            </div>
          </div>
        </div>

        <div className="modal-cta">
          <AddToPack 
            item={{
              id: experience.id,
              name: experience.name,
              location: experience.location,
              description: experience.description || 'Explore this amazing experience.',
              imageUrl: experience.url,
              rating: experience.rating
            }} 
            type="experience"
            buttonStyle="primary"
          />
          <button className="learn-more-btn">Learn More</button>
        </div>
      </div>
    </div>
  );
};

export default ExperienceModal; 