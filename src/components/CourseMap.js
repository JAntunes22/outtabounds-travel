import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import './CourseMap.css';

// Sample golf courses with their locations
const sampleCourses = [
  { id: 1, name: 'Algarve Golf Club', location: 'Faro, Portugal', position: [37.0193, -7.9304] },
  { id: 2, name: 'Lisbon Greens', location: 'Lisbon, Portugal', position: [38.7223, -9.1393] },
  { id: 3, name: 'Porto Links', location: 'Porto, Portugal', position: [41.1579, -8.6291] },
  { id: 4, name: 'Cascais Ocean Course', location: 'Cascais, Portugal', position: [38.6967, -9.4207] }
];

// Fix for Leaflet default icon issue
let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const CourseMap = () => {
  return (
    <div className="course-map-container">
      <MapContainer 
        center={[38.7223, -9.1393]} 
        zoom={6} 
        style={{ height: '100%', width: '100%', borderRadius: '12px' }}
        zoomControl={true} 
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {sampleCourses.map(course => (
          <Marker key={course.id} position={course.position}>
            <Popup>
              <div className="popup-content">
                <h3>{course.name}</h3>
                <p>{course.location}</p>
                <button className="view-details-btn">View Details</button>
              </div>
            </Popup>
          </Marker>
        ))}
        
      </MapContainer>
      <div className="map-notice">
        <p>Interactive map of golf courses.</p>
        <p>Click markers to see course details.</p>
      </div>
    </div>
  );
};

export default CourseMap; 