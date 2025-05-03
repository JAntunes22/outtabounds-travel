import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import './CourseMap.css';

// Fix for Leaflet default icon issue
let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Function to parse position string format "latitude,longitude" to [lat, lng] array
const parsePosition = (positionString) => {
  if (!positionString) return null;
  
  try {
    // Split by comma and convert to floating point numbers
    const [latitude, longitude] = positionString.split(',').map(coord => parseFloat(coord.trim()));
    return [latitude, longitude]; // Return as array for Leaflet
  } catch (error) {
    console.error("Error parsing position:", error);
    return null;
  }
};

const CourseMap = ({ courses = [], onCourseSelect }) => {
  // Default center - Portugal
  const center = [38.7223, -9.1393];
  
  return (
    <div className="course-map-container">
      <MapContainer 
        center={center} 
        zoom={6} 
        style={{ height: '100%', width: '100%', borderRadius: '12px' }}
        zoomControl={true} 
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {courses.map(course => {
          const position = parsePosition(course.position);
          
          // Only render marker if position is valid
          if (!position) return null;
          
          return (
            <Marker key={course.id} position={position}>
              <Popup>
                <div className="popup-content">
                  <h3>{course.name}</h3>
                  <p>{course.location}</p>
                  <button 
                    className="view-details-btn"
                    onClick={() => onCourseSelect && onCourseSelect(course)}
                  >
                    View Details
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
        
      </MapContainer>
    </div>
  );
};

export default CourseMap; 