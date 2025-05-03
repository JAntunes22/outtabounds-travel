import React, { useEffect } from 'react';
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
        
        <div className="modal-content">
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
                <span className="value">{course.rating} 
                  <span className="stars">{'★'.repeat(Math.floor(course.rating))}{course.rating % 1 >= 0.5 ? '½' : ''}</span>
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
              {console.log("Rendering features:", course.features)}
              {Array.isArray(course.features) && course.features.length > 0 ? (
                <ul>
                  {course.features.map((feature, index) => {
                    console.log(`Rendering feature ${index}:`, feature);
                    return (
                      <li key={index}>{feature}</li>
                    );
                  })}
                </ul>
              ) : (
                <p>No features available for this course.</p>
              )}
            </div>
            
            <div className="modal-cta">
              <button className="book-now-btn">Book Now</button>
              <button className="learn-more-btn">Learn More</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseModal; 