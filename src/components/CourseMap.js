import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import Supercluster from 'supercluster';
import 'mapbox-gl/dist/mapbox-gl.css';
import './CourseMap.css';

// Set the Mapbox access token
mapboxgl.accessToken = 'pk.eyJ1Ijoiam9hb2FudHVuZXMiLCJhIjoiY21hOG1wMTQxMTc2cjJtczg4ZjV0MHh3YiJ9.at1W4xUfM8x-c51nNZFyUw';

// Function to parse position string format "latitude,longitude" to [lng, lat] array
const parsePosition = (positionString) => {
  if (!positionString) return null;
  
  try {
    // Split by comma and convert to floating point numbers
    const [latitude, longitude] = positionString.split(',').map(coord => parseFloat(coord.trim()));
    return [longitude, latitude]; // Return as array for Mapbox (note: Mapbox uses [lng, lat] order)
  } catch (error) {
    console.error("Error parsing position:", error);
    return null;
  }
};

// Create a cluster marker element
const createClusterMarker = (count) => {
  const el = document.createElement('div');
  el.className = 'cluster-marker';
  el.innerHTML = `<div class="cluster-count">${count}</div>`;
  return el;
};

const CourseMap = ({ courses = [], onCourseSelect }) => {
  // Center on Algarve, Portugal (note: Mapbox uses [lng, lat] order)
  const center = [-8.2, 37.1]; // Center of Algarve region
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [mapInitialized, setMapInitialized] = useState(false);
  const markers = useRef([]); // Individual markers
  const clusterMarkers = useRef([]); // Cluster markers
  const supercluster = useRef(null); // Reference to the supercluster instance
  const featuresRef = useRef([]); // Reference to the GeoJSON features
  const containerRef = useRef(null);

  // Initialize map when component mounts
  useEffect(() => {
    console.log("CourseMap component mounted");
    
    // Check if map container exists and map not already initialized
    if (mapContainer.current && !map.current) {
      console.log("Initializing map...");
      
      try {
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: center,
          zoom: 8.5 // Zoom level to show Algarve from east to west
        });

        // Add navigation controls
        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
        
        // Create supercluster instance
        supercluster.current = new Supercluster({
          radius: 60, // Radius of each cluster when clustering points (defaults to 40)
          maxZoom: 16, // Maximum zoom level at which clusters are generated (defaults to 16)
          minPoints: 2 // Minimum number of points to form a cluster (defaults to 2)
        });
        
        // Set map initialized flag when the map is loaded
        map.current.on('load', () => {
          console.log("Map loaded successfully");
          setMapInitialized(true);
          
          // Force resize once the map is loaded
          if (map.current) {
            console.log("Forcing initial resize");
            map.current.resize();
          }
        });
        
        // Add map move events to update clusters
        map.current.on('moveend', () => updateClusters());
        map.current.on('zoomend', () => updateClusters());
        
      } catch (error) {
        console.error("Error initializing map:", error);
      }
    }

    // Cleanup on unmount
    return () => {
      if (map.current) {
        console.log("Removing map instance");
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Update clusters based on current map bounds and zoom level
  const updateClusters = () => {
    if (!map.current || !supercluster.current || featuresRef.current.length === 0) return;
    
    // Clear all existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];
    
    clusterMarkers.current.forEach(marker => marker.remove());
    clusterMarkers.current = [];
    
    // Get the current bounds of the map
    const bounds = map.current.getBounds();
    const bbox = [
      bounds.getWest(),
      bounds.getSouth(),
      bounds.getEast(),
      bounds.getNorth()
    ];
    
    // Get the current zoom level
    const zoom = Math.floor(map.current.getZoom());
    
    // Get clusters based on the current zoom and bounds
    const clusters = supercluster.current.getClusters(bbox, zoom);
    
    // Add cluster markers or individual markers
    clusters.forEach(cluster => {
      if (cluster.properties.cluster) {
        // This is a cluster
        const count = cluster.properties.point_count;
        
        // Create a marker for the cluster
        const el = createClusterMarker(count);
        
        const marker = new mapboxgl.Marker({
          element: el
        })
          .setLngLat(cluster.geometry.coordinates)
          .addTo(map.current);
          
        // Add click event to zoom in when cluster is clicked
        el.addEventListener('click', () => {
          const expansionZoom = Math.min(
            supercluster.current.getClusterExpansionZoom(cluster.properties.cluster_id),
            20
          );
          
          map.current.flyTo({
            center: cluster.geometry.coordinates,
            zoom: expansionZoom,
            speed: 1.5,
            curve: 1.5
          });
        });
        
        clusterMarkers.current.push(marker);
      } else {
        // This is an individual point
        const course = courses.find(c => c.id === cluster.properties.id);
        if (!course) return;
        
        // Create a marker for the individual point
        addMarkerForCourse(course, [cluster.geometry.coordinates[0], cluster.geometry.coordinates[1]]);
      }
    });
  };

  // Add individual marker for a course
  const addMarkerForCourse = (course, position) => {
    // Create custom popup
    const popupContent = document.createElement('div');
    popupContent.className = 'popup-content';
    
    const title = document.createElement('h3');
    title.textContent = course.name;
    title.style.marginTop = '5px'; // Add margin to top of title
    
    const location = document.createElement('p');
    location.textContent = course.location;
    
    const button = document.createElement('button');
    button.className = 'view-details-btn';
    button.textContent = 'View Details';
    button.onclick = () => onCourseSelect && onCourseSelect(course);
    
    popupContent.appendChild(title);
    popupContent.appendChild(location);
    popupContent.appendChild(button);

    // Create popup with offset and correct positioning
    const popup = new mapboxgl.Popup({ 
      offset: 25,
      closeButton: true,
      closeOnClick: false
    })
      .setDOMContent(popupContent);

    // Create marker with default Mapbox marker color instead of a custom element
    const marker = new mapboxgl.Marker({
      color: '#186d00', // Match the green color used in the app
    })
      .setLngLat(position)
      .setPopup(popup)
      .addTo(map.current);
      
    // Add a tooltip as a child of the mapboxgl-marker element
    const markerElement = marker.getElement();
    const tooltipElement = document.createElement('div');
    tooltipElement.className = 'course-tooltip';
    tooltipElement.textContent = course.name;
    markerElement.appendChild(tooltipElement);
      
    // Store marker reference for later cleanup
    markers.current.push(marker);
  };

  // This effect ensures the map resizes properly when the container becomes visible
  useEffect(() => {
    const handleResize = () => {
      if (map.current) {
        console.log("Resizing map");
        map.current.resize();
        
        // Also update clusters when resizing
        updateClusters();
      }
    };

    // Add resize event listener
    window.addEventListener('resize', handleResize);
    
    // Create a MutationObserver to detect when the map container becomes visible
    if (containerRef.current) {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
            const mapView = document.querySelector('.map-view');
            if (mapView && mapView.classList.contains('active')) {
              console.log("Map view became active");
              
              // Force multiple resize calls with increasing delays to ensure proper rendering
              setTimeout(handleResize, 0);
              setTimeout(handleResize, 100);
              setTimeout(handleResize, 300);
              setTimeout(handleResize, 500);
            }
          }
        });
      });
      
      // Start observing parent nodes up to 3 levels for changes in the 'class' attribute
      let parent = containerRef.current.parentNode;
      for (let i = 0; i < 3 && parent; i++) {
        observer.observe(parent, { attributes: true, attributeFilter: ['class'] });
        parent = parent.parentNode;
      }
      
      // Clean up observer
      return () => observer.disconnect();
    }
    
    // Force resize after delays to ensure the container is visible
    const resizeTimers = [
      setTimeout(handleResize, 0),
      setTimeout(handleResize, 100),
      setTimeout(handleResize, 300),
      setTimeout(handleResize, 500),
      setTimeout(handleResize, 1000)
    ];

    return () => {
      window.removeEventListener('resize', handleResize);
      resizeTimers.forEach(timer => clearTimeout(timer));
    };
  }, [mapInitialized]);

  // Add markers when courses change or map is initialized
  useEffect(() => {
    if (!map.current || !mapInitialized || !courses.length || !supercluster.current) return;

    console.log("Processing", courses.length, "courses for clustering");
    
    // Clear previous markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];
    
    clusterMarkers.current.forEach(marker => marker.remove());
    clusterMarkers.current = [];
    
    // Convert courses to GeoJSON features for the supercluster
    const features = courses.map(course => {
      const position = parsePosition(course.position);
      if (!position) {
        console.log("Invalid position for course:", course.name);
        return null;
      }
      
      return {
        type: 'Feature',
        properties: {
          id: course.id
        },
        geometry: {
          type: 'Point',
          coordinates: position
        }
      };
    }).filter(Boolean); // Remove null values
    
    // Store the features for later use
    featuresRef.current = features;
    
    // Load the features into the supercluster
    supercluster.current.load(features);
    
    // Update clusters based on current view
    updateClusters();
    
  }, [courses, onCourseSelect, mapInitialized]);

  return (
    <div className="course-map-container" ref={containerRef}>
      <div 
        ref={mapContainer} 
        className="mapbox-container"
        style={{ 
          position: 'absolute', 
          top: 0, 
          bottom: 0, 
          left: 0, 
          right: 0 
        }} 
      />
    </div>
  );
};

export default CourseMap; 