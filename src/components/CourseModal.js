import React, { useEffect } from 'react';
import './CourseModal.css';

const CourseModal = ({ course, onClose }) => {
  // Prevent scrolling when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    
    // Cleanup function to restore scrolling when modal is closed
    return () => {
      document.body.style.overflow = 'auto';
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
              <ul>
                <li>Professional golf lessons available</li>
                <li>Club rentals and golf carts</li>
                <li>Restaurant and bar on premises</li>
                <li>18-hole championship course</li>
                <li>Practice facilities</li>
              </ul>
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