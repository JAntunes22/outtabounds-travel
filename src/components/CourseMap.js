import React from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import './CourseMap.css';

// Container style
const containerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '12px'
};

// Default center - Portugal
const center = {
  lat: 38.7223,
  lng: -9.1393
};

// Map options for styling
const options = {
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: true,
  streetViewControl: false,
  fullscreenControl: true,
  styles: [
    {
      featureType: 'poi.business',
      stylers: [{ visibility: 'off' }]
    },
    {
      featureType: 'transit',
      elementType: 'labels.icon',
      stylers: [{ visibility: 'off' }]
    }
  ]
};

const CourseMap = () => {
  // Load the Google Maps JavaScript API
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: "AIzaSyB41DRUbKWJHPxaFjMAwdrzWzbVKartNGg" // This is a public example key for development
  });

  return (
    <div className="course-map-container">
      {isLoaded ? (
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={6}
          options={options}
        />
      ) : (
        <div className="map-loading">Loading map...</div>
      )}
      <div className="map-notice">
        <p>Interactive map of golf courses.</p>
        <p>Zoom and pan to explore locations.</p>
      </div>
    </div>
  );
};

export default CourseMap; 