import React, { useState } from 'react';
import ReactMapGL from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './CourseMap.css';

// Mapbox token - replace with your own from mapbox.com
const MAPBOX_TOKEN = 'pk.eyJ1IjoiZGVtb3VzZXIiLCJhIjoiY2pnemR1YjUwMGF6OTJ3bGI4b3l2bWpvYiJ9.DUrLTPS66-MoF9W-Nj3i9w';

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
    </div>
  );
};

export default CourseMap; 