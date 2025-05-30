import React, { useEffect } from 'react';
import AddToPack from './AddToPack';
import './CourseModal.css';

const CourseModal = ({ course, onClose }) => {
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

  if (!course) return null;

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="course-modal">
        <button className="modal-close-btn" onClick={onClose}>×</button>
        
        <div className="course-modal-content">
          <div className="modal-image-container">
            <img 
              src={course.url} 
              alt={course.name} 
              className="modal-image"
            />
          </div>
          
          <div className="modal-details">
            <h2 className="modal-title">{course.name}</h2>
            
            <div className="modal-location">
              <span className="label">Location:</span>
              <span className="value">{course.location}</span>
            </div>
            
            {course.rating && (
              <div className="modal-rating">
                <span className="label">Rating:</span>
                <span className="value">
                  {parseFloat(course.rating).toFixed(1)}
                  <span className="modal-rating-stars">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={i < Math.round(parseFloat(course.rating)) ? "modal-star filled" : "modal-star"}>
                        ★
                      </span>
                    ))}
                  </span>
                </span>
              </div>
            )}
            
            {typeof course.popularity !== 'undefined' && (
              <div className="modal-popularity">
                <span className="label">Popularity:</span>
                <div className="popularity-bar">
                  <div 
                    className="popularity-fill" 
                    style={{ width: `${course.popularity}%` }}
                  ></div>
                </div>
                <span className="popularity-percentage">{course.popularity}%</span>
              </div>
            )}
            
            <div className="modal-description">
              <h3>Description</h3>
              <p>{course.description}</p>
            </div>
            
            <div className="modal-features">
              <h3>Features</h3>
              {Array.isArray(course.features) && course.features.length > 0 ? (
                <ul>
                  {course.features.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
              ) : (
                <p>No features available for this course.</p>
              )}
            </div>
            
            <div className="modal-cta">
              <AddToPack 
                item={{
                  id: course.id,
                  name: course.name,
                  location: course.location,
                  description: course.description || 'Explore this amazing golf course.',
                  imageUrl: course.url,
                  rating: course.rating
                }} 
                type="course"
                buttonStyle="primary"
              />
              <button className="learn-more-btn">Learn More</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseModal; 