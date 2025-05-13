import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
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

  // Process course data into GeoJSON points and initialize Supercluster
  useEffect(() => {
    if (!courses.length) return;
    
    console.log("Processing courses for clustering");
    
    try {
      // Convert courses to GeoJSON features
      const points = [];
      
      courses.forEach(course => {
        const position = parsePosition(course.position);
        if (!position) return; // Skip invalid positions
        
        // Create a feature with proper properties
        const feature = {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: position
          },
          properties: {
            id: course.id,
            name: course.name,
            location: course.location,
            course // Store full course object
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
  }, [courses]);

  // Debounced update function to prevent too many updates during movement
  const debouncedUpdateMarkers = useCallback(() => {
    // Clear any existing timeout
    if (updateTimeout.current) {
      clearTimeout(updateTimeout.current);
    }
    
    // Set a new timeout with a shorter delay for responsive updates
    updateTimeout.current = setTimeout(() => {
      // Only update if the map isn't currently moving
      if (!isMoving.current && map.current && map.current.loaded()) {
        if (updateMarkers.current) {
          updateMarkers.current();
        }
      }
    }, 150); // Reduced from 500ms to 150ms for better responsiveness
  }, []);

  // Update markers based on current map view - reference to avoid circular dependency
  const updateMarkers = useRef(() => {});

  // Update markers based on current map view - optimized to reduce flickering and lag
  useEffect(() => {
    // Define the actual implementation
    updateMarkers.current = () => {
      if (!map.current || !mapInitialized || !clusterIndex.current || markerData.current.length === 0) return;
      
      // Skip updates if map is still moving
      if (isMoving.current) return;
      
      console.log("Updating markers based on current map view");
      
      try {
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
        
        // Track existing marker IDs to only remove what's necessary
        const newMarkerIds = new Set();
        
        // Track active cluster IDs to clean up old ones
        const activeClusters = new Set();
        
        // Create markers for each cluster or individual point
        clusters.forEach(cluster => {
          // Check if this is a cluster or an individual point
          if (cluster.properties.cluster) {
            // This is a cluster
            const clusterId = cluster.properties.cluster_id;
            const pointCount = cluster.properties.point_count;
            const clusterCoordinates = cluster.geometry.coordinates;
            
            // Add this cluster ID to active clusters
            activeClusters.add(clusterId);
            
            // Check if we already have a marker for this cluster
            const existingClusterMarker = clusterMarkers.current.find(
              marker => marker._clusterId === clusterId
            );
            
            if (existingClusterMarker) {
              // Update position if needed
              existingClusterMarker.setLngLat(clusterCoordinates);
              return;
            }
            
            // Create cluster marker 
            const el = document.createElement('div');
            el.className = 'cluster-marker';
            el.style.width = `${Math.min(60, 30 + pointCount * 3)}px`; // Size based on point count
            el.style.height = `${Math.min(60, 30 + pointCount * 3)}px`;
            el.style.borderRadius = '50%';
            el.style.backgroundColor = '#186d00';
            el.style.display = 'flex';
            el.style.justifyContent = 'center';
            el.style.alignItems = 'center';
            el.style.color = 'white';
            el.style.fontWeight = 'bold';
            el.style.border = '2px solid white';
            el.style.willChange = 'transform'; // Optimize for transform changes
            el.innerText = pointCount;
            
            // Create marker for this cluster
            const marker = new mapboxgl.Marker({
              element: el,
              anchor: 'center', // Ensure proper centering
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
              
              // Get new bounds that encompass all children
              const coordinates = children.map(child => child.geometry.coordinates);
              
              // Create a bounds object from the points
              const childrenBounds = new mapboxgl.LngLatBounds();
              coordinates.forEach(coord => {
                childrenBounds.extend(coord);
              });
              
              // Zoom the map to fit these points, with some padding
              map.current.fitBounds(childrenBounds, {
                padding: 80,
                duration: 500 // Animation time in ms
              });
            });
            
            // Store this cluster marker
            clusterMarkers.current.push(marker);
            
          } else {
            // This is an individual point
            const position = cluster.geometry.coordinates;
            const course = cluster.properties.course;
            const markerId = `marker-${course.id}`;
            
            // Add the marker ID to our tracking set
            newMarkerIds.add(markerId);
            
            // Skip if we already have a marker with an open popup for this course
            if (openPopups.current[markerId]) {
              return;
            }
            
            // Skip if this marker already exists (to reduce DOM operations)
            const existingMarker = markers.current.find(m => m._id === markerId);
            if (existingMarker) {
              // Ensure it's at the correct position (may have moved slightly)
              existingMarker.setLngLat(position);
              return;
            }
            
            // If we're here, we need to create a new marker
            
            // Create custom popup
            const popupContent = document.createElement('div');
            popupContent.className = 'popup-content';
            
            // Add image section
            const imageContainer = document.createElement('div');
            imageContainer.className = 'popup-image-container';
            
            const image = document.createElement('img');
            image.className = 'popup-image';
            image.src = course.url || 'https://via.placeholder.com/300x200?text=No+Image+Available';
            image.alt = course.name;
            image.onerror = () => {
              image.src = 'https://via.placeholder.com/300x200?text=Image+Error';
            };
            
            imageContainer.appendChild(image);
            popupContent.appendChild(imageContainer);
            
            // Add info section
            const infoContainer = document.createElement('div');
            infoContainer.className = 'popup-info';
            
            const title = document.createElement('h3');
            title.textContent = course.name;
            
            const location = document.createElement('p');
            location.textContent = course.location;
            
            const button = document.createElement('button');
            button.className = 'popup-btn';
            button.textContent = 'View Details';
            button.onclick = (e) => {
              e.stopPropagation();
              // Close the popup when opening the details view
              if (marker && marker.getPopup()) {
                marker.getPopup().remove();
              }
              onCourseSelect && onCourseSelect(course);
            };
            
            infoContainer.appendChild(title);
            infoContainer.appendChild(location);
            infoContainer.appendChild(button);
            popupContent.appendChild(infoContainer);

            // Create popup with offset and correct positioning
            const popup = new mapboxgl.Popup({ 
              offset: 25,
              closeButton: true,
              closeOnClick: false,
              className: 'course-popup' // Add custom class for styling
            }).setDOMContent(popupContent);
            
            // Track popup open/close state
            popup.on('open', () => {
              console.log(`Popup opened for course: ${course.name}`);
              openPopups.current[markerId] = true;
              
              // Ensure the marker stays in the same place
              if (marker && marker.getLngLat) {
                marker.setLngLat(position);
              }
            });
            
            popup.on('close', () => {
              console.log(`Popup closed for course: ${course.name}`);
              delete openPopups.current[markerId];
              
              // Subtle delay before potentially running updateMarkers
              // to prevent visual jumps after closing popup
              setTimeout(() => {
                if (!isMoving.current && map.current && map.current.loaded()) {
                  debouncedUpdateMarkers();
                }
              }, 50);
            });

            // Create marker for individual course
            const marker = new mapboxgl.Marker({
              color: '#186d00', // Match the green color used in the app
              anchor: 'center', // Ensure proper centering
            })
              .setLngLat(position)
              .setPopup(popup)
              .addTo(map.current);
              
            // Store the ID with the marker for tracking
            marker._id = markerId;
              
            // Add a tooltip as a child of the mapboxgl-marker element
            const markerElement = marker.getElement();
            const tooltipElement = document.createElement('div');
            tooltipElement.className = 'course-tooltip';
            tooltipElement.textContent = course.name;
            
            // Add the tooltip to the marker element
            markerElement.appendChild(tooltipElement);
            
            // Add click handler to the marker element
            markerElement.addEventListener('click', (e) => {
              e.stopPropagation();
              marker.togglePopup();
            });
            
            // Add click handler specifically to the tooltip
            tooltipElement.addEventListener('click', (e) => {
              e.stopPropagation();
              marker.togglePopup();
            });
              
            // Store marker reference for later cleanup
            markers.current.push(marker);
          }
        });
        
        // Only remove markers that are no longer in view and don't have open popups
        // This is more efficient than clearing all markers and recreating them
        markers.current = markers.current.filter(marker => {
          const markerId = marker._id;
          if (openPopups.current[markerId] || newMarkerIds.has(markerId)) {
            return true; // Keep this marker
          } else {
            marker.remove();
            return false; // Remove this marker
          }
        });
        
        // Remove cluster markers that are no longer active
        clusterMarkers.current = clusterMarkers.current.filter(marker => {
          const clusterId = marker._clusterId;
          if (activeClusters.has(clusterId)) {
            return true; // Keep this cluster marker
          } else {
            marker.remove();
            return false; // Remove this cluster marker
          }
        });
        
      } catch (error) {
        console.error("Error updating markers:", error);
      }
    };
  }, [mapInitialized, clearAllMarkers, onCourseSelect, debouncedUpdateMarkers]);

  // Update the map initialization
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
          zoom: 8.5, // Zoom level to show Algarve from east to west
          fadeDuration: 0, // Disable fade animations to prevent cluster position jumps
          trackResize: true,
          renderWorldCopies: false, // Prevent flickering at boundaries
          antialias: true, // Smoother rendering
        });

        // Add navigation controls
        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
        
        // Create supercluster instance is now handled in a separate useEffect
        
        // Set map initialized flag when the map is loaded
        map.current.on('load', () => {
          console.log("Map loaded successfully");
          setMapInitialized(true);
          
          // Force resize once the map is loaded
          if (map.current) {
            console.log("Forcing initial resize");
            map.current.resize();
          }
          
          // Initial render of markers
          setTimeout(() => {
            if (updateMarkers.current) {
              updateMarkers.current();
            }
          }, 100);
        });
        
        // Track map movement state
        map.current.on('movestart', () => {
          isMoving.current = true;
        });
        
        map.current.on('moveend', () => {
          isMoving.current = false;
          // Update markers immediately on moveend for better responsiveness
          if (updateMarkers.current) {
            updateMarkers.current();
          }
        });
        
        // Handle zoom changes once they complete
        map.current.on('zoomend', () => {
          // Update markers immediately on zoomend for better responsiveness
          if (updateMarkers.current) {
            updateMarkers.current();
          }
        });
        
        // More responsive render updates while preserving performance
        let lastUpdateTime = 0;
        map.current.on('render', () => {
          const now = Date.now();
          // Only consider updating if it's been at least 2 seconds since last update
          if (now - lastUpdateTime > 2000 && // Reduced from 10s to 2s
              map.current &&
              map.current.loaded() && 
              !isMoving.current && 
              Object.keys(openPopups.current).length === 0) {
            lastUpdateTime = now;
            debouncedUpdateMarkers();
          }
        });
      } catch (error) {
        console.error("Error initializing map:", error);
      }
    }

    // Cleanup on unmount
    return () => {
      if (updateTimeout.current) {
        clearTimeout(updateTimeout.current);
      }
      
      if (map.current) {
        console.log("Removing map instance");
        // Remove event listeners
        if (map.current) {
          map.current.off('movestart');
          map.current.off('moveend');
          map.current.off('zoomend');
          map.current.off('render');
        }
        // Remove all markers
        clearAllMarkers();
        map.current.remove();
        map.current = null;
      }
    };
  }, [center, clearAllMarkers, debouncedUpdateMarkers]);

  // Update clusters based on current map bounds and zoom level
  const updateClusters = () => {
    if (!map.current || !clusterIndex.current || markerData.current.length === 0) return;
    
    try {
      console.log("Updating clusters at zoom level", map.current.getZoom());
      
      // Clear all existing individual markers but not clusters yet
      markers.current.forEach(marker => marker.remove());
      markers.current = [];
      
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
      console.log(`Getting clusters for zoom level ${zoom} and bounds ${bbox.join(', ')}`);
      
      // Get clusters based on the current zoom and bounds
      const clusters = clusterIndex.current.getClusters(bbox, zoom);
      console.log(`Found ${clusters.length} clusters/points`);
      
      // Track active cluster IDs
      const activeClusters = new Set();
      
      // Add cluster markers or individual markers
      clusters.forEach(cluster => {
        if (cluster.properties.cluster) {
          // This is a cluster
          const count = cluster.properties.point_count;
          const clusterId = cluster.properties.cluster_id;
          
          // Add to active clusters
          activeClusters.add(clusterId);
          
          // Check if we already have a marker for this cluster
          const existingClusterMarker = clusterMarkers.current.find(
            marker => marker._clusterId === clusterId
          );
          
          if (existingClusterMarker) {
            // Update position if needed
            existingClusterMarker.setLngLat(cluster.geometry.coordinates);
            return;
          }
          
          console.log(`Adding cluster of ${count} points with ID ${clusterId}`);
          
          // Create a marker for the cluster
          const el = createClusterMarker(count);
          
          const marker = new mapboxgl.Marker({
            element: el
          })
            .setLngLat(cluster.geometry.coordinates)
            .addTo(map.current);
            
          // Store the cluster ID with the marker
          marker._clusterId = clusterId;
            
          // Add click event to zoom in when cluster is clicked
          el.addEventListener('click', () => {
            try {
              const expansionZoom = Math.min(
                clusterIndex.current.getClusterExpansionZoom(clusterId),
                20
              );
              
              console.log(`Expanding cluster ${clusterId} to zoom level ${expansionZoom}`);
              
              map.current.flyTo({
                center: cluster.geometry.coordinates,
                zoom: expansionZoom,
                speed: 1, // Slower speed for more reliable rendering
                curve: 1.5,
                essential: true // This ensures the movement is considered essential and completes
              });
            } catch (err) {
              console.error("Error expanding cluster:", err);
            }
          });
          
          clusterMarkers.current.push(marker);
        } else {
          // This is an individual point
          const courseId = cluster.properties.id;
          const course = courses.find(c => c.id === courseId);
          
          if (!course) {
            console.warn(`Course with ID ${courseId} not found`);
            return;
          }
          
          console.log(`Adding individual marker for course: ${course.name}`);
          
          // Create a marker for the individual point
          addMarkerForCourse(course, [cluster.geometry.coordinates[0], cluster.geometry.coordinates[1]]);
        }
      });
      
      // Remove cluster markers that are no longer active
      clusterMarkers.current = clusterMarkers.current.filter(marker => {
        const clusterId = marker._clusterId;
        if (activeClusters.has(clusterId)) {
          return true; // Keep this cluster marker
        } else {
          marker.remove();
          return false; // Remove this cluster marker
        }
      });
      
    } catch (err) {
      console.error("Error updating clusters:", err);
    }
  };

  // Add individual marker for a course
  const addMarkerForCourse = (course, position) => {
    try {
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
      button.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        // Close the popup when opening the details view
        if (marker && marker.getPopup()) {
          marker.getPopup().remove();
        }
        onCourseSelect && onCourseSelect(course);
      };
      
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
      tooltipElement.style.pointerEvents = 'auto';
      tooltipElement.style.cursor = 'pointer';
      markerElement.appendChild(tooltipElement);
      
      // Add click handler to the tooltip
      tooltipElement.addEventListener('click', (e) => {
        e.stopPropagation();
        marker.togglePopup();
      });
        
      // Store marker reference for later cleanup
      markers.current.push(marker);
    } catch (err) {
      console.error("Error adding marker for course:", course.name, err);
    }
  };

  // This effect ensures the map resizes properly when the container becomes visible
  useEffect(() => {
    const handleResize = () => {
      if (map.current) {
        console.log("Resizing map");
        map.current.resize();
        
        // Also update clusters when resizing, but with a small delay
        setTimeout(() => updateClusters(), 100);
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
              
              // Force map resize with increasing delays to ensure proper rendering
              setTimeout(handleResize, 0);
              setTimeout(handleResize, 100);
              setTimeout(handleResize, 300);
              setTimeout(handleResize, 500);
              setTimeout(handleResize, 1000);
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

  // Update markers when courses data changes
  useEffect(() => {
    if (!mapInitialized || !courses.length || !clusterIndex.current) return;
    
    console.log("Courses data updated, updating markers");
    
    // We need a slight delay to ensure the map is properly initialized
    setTimeout(() => {
      if (updateMarkers.current) {
        updateMarkers.current();
      }
    }, 250);
  }, [courses, mapInitialized]);

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