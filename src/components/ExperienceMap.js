import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import Supercluster from 'supercluster';
import 'mapbox-gl/dist/mapbox-gl.css';
import './ExperienceMap.css';

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

const ExperienceMap = ({ experiences = [], onExperienceSelect }) => {
  // Center on Algarve, Portugal (note: Mapbox uses [lng, lat] order)
  const center = useMemo(() => [-8.2, 37.1], []); // Center of Algarve region
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [mapInitialized, setMapInitialized] = useState(false);
  const markers = useRef([]); // For storing created markers
  const markerData = useRef([]); // For storing preprocessed GeoJSON points
  const clusterIndex = useRef(null); // For Supercluster index
  const containerRef = useRef(null);
  const clusterMarkers = useRef([]); // For storing cluster markers
  const openPopups = useRef({}); // Track which popups are open
  const isMoving = useRef(false); // Track if the map is currently moving
  const updateTimeout = useRef(null); // Timeout for debounced updates
  
  // References to functions to avoid initialization issues
  const updateMarkersRef = useRef(null);
  const debouncedUpdateMarkersRef = useRef(null);

  // Clear all markers from the map
  const clearAllMarkers = useCallback(() => {
    // Only remove markers that don't have open popups
    markers.current = markers.current.filter(marker => {
      const markerId = marker._id;
      if (openPopups.current[markerId]) {
        return true; // Keep this marker
      } else {
        marker.remove();
        return false; // Remove this marker
      }
    });
    
    // Only remove cluster markers
    clusterMarkers.current.forEach(marker => marker.remove());
    clusterMarkers.current = [];
  }, []);
  
  // Define the debounced update function first
  const debouncedUpdateMarkers = useCallback(() => {
    // Clear any existing timeout
    if (updateTimeout.current) {
      clearTimeout(updateTimeout.current);
    }
    
    // Set a new timeout
    updateTimeout.current = setTimeout(() => {
      // Only update if the map isn't currently moving
      if (!isMoving.current && map.current && map.current.loaded()) {
        updateMarkersRef.current && updateMarkersRef.current();
      }
    }, 150); // Reduced delay for better responsiveness
  }, []);
  
  // Store reference to the debounced function
  debouncedUpdateMarkersRef.current = debouncedUpdateMarkers;

  // Update markers based on current map view
  const updateMarkers = useCallback(() => {
    if (!map.current || !mapInitialized || !clusterIndex.current || markerData.current.length === 0) return;
    
    // Skip updates if map is still moving
    if (isMoving.current) return;
    
    console.log("Updating markers based on current map view");
    
    try {
      // Clear existing markers first
      clearAllMarkers();
      
      // Get the current map bounds
      const bounds = map.current.getBounds();
      const bbox = [
        bounds.getWest(),
        bounds.getSouth(),
        bounds.getEast(),
        bounds.getNorth()
      ];
      
      // Get current zoom level
      const zoom = Math.floor(map.current.getZoom());
      
      // Get clusters for current view
      const clusters = clusterIndex.current.getClusters(bbox, zoom);
      console.log(`Found ${clusters.length} clusters/points at zoom level ${zoom}`);
      
      // Create markers for each cluster or individual point
      clusters.forEach(cluster => {
        // Check if this is a cluster or an individual point
        if (cluster.properties.cluster) {
          // This is a cluster
          const clusterId = cluster.properties.cluster_id;
          const pointCount = cluster.properties.point_count;
          const clusterCoordinates = cluster.geometry.coordinates;
          
          // Create cluster marker
          const el = document.createElement('div');
          el.className = 'cluster-marker';
          el.style.width = `${Math.min(60, 30 + pointCount * 3)}px`;
          el.style.height = `${Math.min(60, 30 + pointCount * 3)}px`;
          el.style.borderRadius = '50%';
          el.style.backgroundColor = '#186d00'; // Using the same color as in courses
          el.style.display = 'flex';
          el.style.justifyContent = 'center';
          el.style.alignItems = 'center';
          el.style.color = 'white';
          el.style.fontWeight = 'bold';
          el.style.border = '2px solid white';
          el.innerText = pointCount;
          
          // Create marker for this cluster
          const marker = new mapboxgl.Marker({
            element: el,
            anchor: 'center',
          })
            .setLngLat(clusterCoordinates)
            .addTo(map.current);
          
          // Store cluster ID with marker for tracking
          marker._clusterId = clusterId;
          
          // Add click handler to expand cluster
          el.addEventListener('click', () => {
            console.log(`Expanding cluster ${clusterId}`);
            
            // Get children of this cluster
            const children = clusterIndex.current.getChildren(clusterId);
            
            // Create a bounds object from the children coordinates
            const childrenBounds = new mapboxgl.LngLatBounds();
            children.forEach(child => {
              childrenBounds.extend(child.geometry.coordinates);
            });
            
            // Zoom the map to fit these points
            map.current.fitBounds(childrenBounds, {
              padding: 80,
              duration: 500
            });
          });
          
          // Store this cluster marker
          clusterMarkers.current.push(marker);
          
        } else {
          // This is an individual point
          const position = cluster.geometry.coordinates;
          const experience = cluster.properties.experience;
          
          // Create custom marker element
          const el = document.createElement('div');
          el.className = 'experience-marker';
          el.style.backgroundImage = `url(${experience.url})`;
          
          // Create marker for this experience
          const marker = new mapboxgl.Marker({
            element: el,
            anchor: 'bottom',
          })
            .setLngLat(position)
            .addTo(map.current);
          
          // Store experience ID with marker for tracking
          marker._id = experience.id;
          
          // Create popup but don't add it to the map yet
          const popup = new mapboxgl.Popup({
            closeButton: true,
            closeOnClick: false,
            offset: 25,
            className: 'experience-popup'
          });
          
          // Add click event to marker
          el.addEventListener('click', () => {
            // Clear any open popups
            markers.current.forEach(m => {
              if (m._popup && m._popup.isOpen()) {
                m._popup.remove();
              }
            });
            
            // Set up popup content
            const popupContent = document.createElement('div');
            popupContent.className = 'popup-content';
            
            // Create popup image
            const popupImg = document.createElement('img');
            popupImg.src = experience.url;
            popupImg.alt = experience.name;
            popupImg.className = 'popup-image';
            
            // Create popup info
            const popupInfo = document.createElement('div');
            popupInfo.className = 'popup-info';
            
            // Experience name
            const popupName = document.createElement('h3');
            popupName.textContent = experience.name;
            
            // Experience location
            const popupLocation = document.createElement('p');
            popupLocation.textContent = experience.location;
            
            // View details button
            const viewDetailsBtn = document.createElement('button');
            viewDetailsBtn.textContent = 'View Details';
            viewDetailsBtn.className = 'popup-btn';
            viewDetailsBtn.addEventListener('click', () => {
              // Close the popup
              popup.remove();
              
              // Call the onExperienceSelect function
              onExperienceSelect(experience);
            });
            
            // Add elements to popup info
            popupInfo.appendChild(popupName);
            popupInfo.appendChild(popupLocation);
            popupInfo.appendChild(viewDetailsBtn);
            
            // Add image and info to popup content
            popupContent.appendChild(popupImg);
            popupContent.appendChild(popupInfo);
            
            // Set popup content
            popup.setLngLat(position)
              .setDOMContent(popupContent)
              .addTo(map.current);
            
            // Store reference to popup
            marker._popup = popup;
            
            // Mark this popup as open
            openPopups.current[marker._id] = true;
            
            // Add event listener for popup close
            popup.on('close', () => {
              delete openPopups.current[marker._id];
            });
          });
          
          // Store this marker
          markers.current.push(marker);
        }
      });
      
    } catch (error) {
      console.error("Error updating markers:", error);
    }
  }, [mapInitialized, clearAllMarkers, onExperienceSelect]);
  
  // Store reference to the updateMarkers function
  updateMarkersRef.current = updateMarkers;

  // Process experience data into GeoJSON points and initialize Supercluster
  useEffect(() => {
    if (!experiences.length) return;
    
    console.log("Processing experiences for clustering");
    
    try {
      // Convert experiences to GeoJSON features
      const points = [];
      
      experiences.forEach(experience => {
        const position = parsePosition(experience.position);
        if (!position) return; // Skip invalid positions
        
        // Create a feature with proper properties
        const feature = {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: position
          },
          properties: {
            id: experience.id,
            name: experience.name,
            location: experience.location,
            experience // Store full experience object
          }
        };
        
        points.push(feature);
      });
      
      console.log(`Created ${points.length} valid GeoJSON points`);
      markerData.current = points;
      
      // Create a new Supercluster instance with simpler options
      clusterIndex.current = new Supercluster({
        radius: 40,
        maxZoom: 16
      });
      
      if (points.length > 0) {
        // Load points into the cluster index
        clusterIndex.current.load(points);
        console.log("Supercluster index initialized successfully");
      }
    } catch (error) {
      console.error("Error initializing clustering:", error);
    }
  }, [experiences]);

  // Initialize map on first render
  useEffect(() => {
    if (map.current) return; // Skip if already initialized
    
    console.log("Initializing map");
    
    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: center,
        zoom: 9,
        attributionControl: false
      });
      
      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
      
      // Add event listeners
      map.current.on('load', () => {
        console.log("Map loaded");
        setMapInitialized(true);
      });
      
      map.current.on('movestart', () => {
        isMoving.current = true;
      });
      
      map.current.on('moveend', () => {
        isMoving.current = false;
        debouncedUpdateMarkersRef.current();
      });
      
      map.current.on('zoomstart', () => {
        isMoving.current = true;
      });
      
      map.current.on('zoomend', () => {
        isMoving.current = false;
        debouncedUpdateMarkersRef.current();
      });
      
      // For initial marker update
      map.current.once('idle', () => {
        debouncedUpdateMarkersRef.current();
      });
      
    } catch (error) {
      console.error("Error initializing map:", error);
    }
    
    // Cleanup function
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [center]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (map.current) {
        map.current.resize();
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="experience-map-container"
    >
      <div 
        ref={mapContainer} 
        className="experience-map"
      />
    </div>
  );
};

export default ExperienceMap; 