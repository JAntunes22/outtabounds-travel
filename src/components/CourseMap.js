import React, { useState } from 'react';
import './CourseMap.css';

const CourseMap = () => {
  return (
    <div className="course-map-container">
      <div className="map-placeholder">
        <div className="placeholder-content">
          <h2>Golf Course Locations</h2>
          <p>Explore our beautiful golf courses across Portugal.</p>
          <div className="location-list">
            <div className="location-item">
              <h3>Algarve Golf Club</h3>
              <p>Faro, Portugal</p>
            </div>
            <div className="location-item">
              <h3>Lisbon Greens</h3>
              <p>Lisbon, Portugal</p>
            </div>
            <div className="location-item">
              <h3>Porto Links</h3>
              <p>Porto, Portugal</p>
            </div>
            <div className="location-item">
              <h3>Cascais Ocean Course</h3>
              <p>Cascais, Portugal</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseMap; 