import React, { useState } from 'react';
import ReactMapGL from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './CourseMap.css';

// Use a valid Mapbox token - you should replace this with your own token from mapbox.com
const MAPBOX_TOKEN = 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4M29iazA2Z2gycXA4N2pmbDZmangifQ.-g_vE53SD2WrJ6tFX7QHmA';

const CourseMap = () => {
  const [viewport, setViewport] = useState({
    latitude: 38.7223, // Default center (Portugal)
    longitude: -9.1393,
    zoom: 6,
    width: '100%',
    height: '100%'
  });
  
  return (
    <div className="course-map-container">
      <ReactMapGL
        {...viewport}
        mapboxApiAccessToken={MAPBOX_TOKEN}
        mapStyle="mapbox://styles/mapbox/light-v10"
        onViewportChange={setViewport}
      />
      <div className="map-notice">
        <p>Interactive map of golf courses.</p>
        <p>Zoom and pan to explore locations.</p>
      </div>
    </div>
  );
};

export default CourseMap; 