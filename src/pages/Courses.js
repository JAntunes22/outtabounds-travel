import React, { useEffect, useState, useRef } from "react";
import { fetchCourses } from "../utils/firebaseUtils";
import CourseModal from "../components/CourseModal";
import CourseMap from "../components/CourseMap";
import AddToPack from "../components/AddToPack";
import './Courses.css';

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState("default");
  const [locationFilter, setLocationFilter] = useState("");
  const [locations, setLocations] = useState([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [viewMode, setViewMode] = useState("list"); // "list" or "map"
  const heroContentRef = useRef(null);
  const heroRef = useRef(null);

  // Helper function to normalize location strings
  const normalizeLocation = (location) => {
    return location.trim().toLowerCase();
  };

  // Add parallax effect for hero section with limits
  useEffect(() => {
    const handleScroll = () => {
      if (heroContentRef.current && heroRef.current) {
        // Calculate how far down the page we've scrolled
        const scrollPos = window.scrollY;
        
        // Get the hero container dimensions
        const heroHeight = heroRef.current.offsetHeight;
        const heroBottom = heroRef.current.getBoundingClientRect().bottom + scrollPos;
        
        // Calculate the maximum allowed translation to keep content within hero
        // Allow only 60% of the hero height for translation (courses hero is shorter)
        const maxTranslation = heroHeight * 0.25;

        // Apply a parallax effect to the hero content, but limit the movement
        if (scrollPos < heroBottom) {
          // Calculate translation with a limit
          const translateY = Math.min(scrollPos * 0.3, maxTranslation);
          heroContentRef.current.style.transform = `translateY(${translateY}px)`;
        }
      }
    };

    // Add scroll event listener
    window.addEventListener('scroll', handleScroll);
    
    // Clean up
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    const getCourses = async () => {
      try {
        const fetchedCourses = await fetchCourses();
        console.log("Fetched courses from Firebase:", fetchedCourses);
        // Log the first course to check its structure
        if (fetchedCourses && fetchedCourses.length > 0) {
          console.log("First course data:", fetchedCourses[0]);
          console.log("Features data type:", typeof fetchedCourses[0].features);
          console.log("Features value:", fetchedCourses[0].features);
        }
        
        // Add mock popularity and rating data if not available
        const enhancedCourses = fetchedCourses.map((course) => {
          console.log(`Processing course ${course.id}: ${course.name}`);
          console.log(`Features for ${course.name}:`, course.features);
          
          // Handle features properly, ensuring it's an array
          let courseFeatures = [];
          if (course.features) {
            // If features exists, make sure it's an array
            if (Array.isArray(course.features)) {
              courseFeatures = course.features;
            } else if (typeof course.features === 'string') {
              // If it's a string, try to parse it as JSON
              try {
                const parsed = JSON.parse(course.features);
                courseFeatures = Array.isArray(parsed) ? parsed : [course.features];
              } catch (e) {
                courseFeatures = [course.features]; // Use as single string feature
              }
            } else {
              // If it's another type, convert to string
              courseFeatures = [String(course.features)];
            }
          }
          
          // Ensure rating is a number and properly formatted
          let rating = course.rating;
          if (rating) {
            // If rating exists but is a string, convert to float
            rating = typeof rating === 'string' ? parseFloat(rating) : rating;
            // Ensure it's within 1-5 range and formatted to one decimal place
            rating = Math.min(5, Math.max(1, rating)).toFixed(1);
          } else {
            // Generate a random rating between 3.0 and 5.0 if none exists
            rating = (Math.random() * 2 + 3).toFixed(1);
          }
          
          return {
            ...course,
            popularity: course.popularity || Math.floor(Math.random() * 100),
            rating: rating,
            normalizedLocation: normalizeLocation(course.location),
            features: courseFeatures.length > 0 ? courseFeatures : ["No features available"]
          };
        });
        
        setCourses(enhancedCourses);
        setFilteredCourses(enhancedCourses);
        
        // Extract unique locations for filter - group by normalized locations
        const locationMap = {};
        enhancedCourses.forEach(course => {
          const normalized = normalizeLocation(course.location);
          // Keep the original formatting for display, but use normalized for comparison
          locationMap[normalized] = course.location;
        });
        
        const uniqueLocations = Object.values(locationMap);
        setLocations(uniqueLocations);
      } catch (err) {
        console.error("Error fetching courses:", err);
        setError("Failed to fetch courses. Please try again later.");
      }
    };
    getCourses();
  }, []);

  // Effect to handle filtering and sorting
  useEffect(() => {
    let result = [...courses];
    
    // Apply location filter
    if (locationFilter) {
      const normalizedFilter = normalizeLocation(locationFilter);
      result = result.filter(course => normalizeLocation(course.location) === normalizedFilter);
    }
    
    // Apply sorting
    switch (sortBy) {
      case "popularity":
        result.sort((a, b) => b.popularity - a.popularity);
        break;
      case "rating":
        result.sort((a, b) => b.rating - a.rating);
        break;
      default:
        // Keep default order
        break;
    }
    
    setFilteredCourses(result);
  }, [courses, sortBy, locationFilter]);

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };
  
  const handleLocationChange = (e) => {
    setLocationFilter(e.target.value);
  };
  
  const clearFilters = () => {
    setSortBy("default");
    setLocationFilter("");
  };

  const toggleFilter = () => {
    setIsFilterOpen(!isFilterOpen);
  };

  const openCourseModal = (course) => {
    console.log("Opening modal for course:", course);
    // Make sure course has a features array even if undefined in the original data
    const courseWithFeatures = {
      ...course,
      features: course.features || [
        "Professional golf lessons available",
        "Club rentals and golf carts",
        "Restaurant and bar on premises",
        "18-hole championship course",
        "Practice facilities"
      ]
    };
    setSelectedCourse(courseWithFeatures);
  };

  const closeCourseModal = () => {
    setSelectedCourse(null);
  };

  // Function to toggle between list and map views
  const toggleView = (mode) => {
    setViewMode(mode);
  };

  return (
    <div className="courses">
      <header className="hero hero-courses" ref={heroRef}>
        <div className="hero-courses-content" ref={heroContentRef}>
          <h1>Our Golf Courses</h1>
          <p>Explore the best golf courses curated just for you.</p>
        </div>
      </header>
      
      {error ? (
        <div className="error-message-container">
          <p className="error-message">{error}</p>
        </div>
      ) : courses.length === 0 ? (
        <div className="no-courses-container">
          <p className="no-courses-message">
            No courses are currently available. Please check back later for exciting golf courses!
          </p>
        </div>
      ) : (
        <div className="courses-content">
          {/* View toggle buttons */}
          <div className="view-toggle">
            <button 
              className={viewMode === "list" ? "active" : ""} 
              onClick={() => toggleView("list")}
            >
              List View
            </button>
            <button 
              className={viewMode === "map" ? "active" : ""} 
              onClick={() => toggleView("map")}
            >
              Map View
            </button>
          </div>

          {/* List view */}
          <div className={`list-view ${viewMode === "list" ? "active" : "hidden"}`}>
            <div className="courses-container">
              <button className="filter-toggle" onClick={toggleFilter}>
                {isFilterOpen ? "Hide Filters" : "Show Filters"}
              </button>
              
              <div className={`filter-sidebar ${isFilterOpen ? 'open' : 'closed'}`}>
                <div className="filter-section">
                  <h3>Sort By</h3>
                  <select value={sortBy} onChange={handleSortChange}>
                    <option value="default">Default</option>
                    <option value="popularity">Most Popular</option>
                    <option value="rating">Highest Rated</option>
                  </select>
                </div>
                
                <div className="filter-section">
                  <h3>Filter By Location</h3>
                  <select value={locationFilter} onChange={handleLocationChange}>
                    <option value="">All Locations</option>
                    {locations.map((location, index) => (
                      <option key={index} value={location}>{location}</option>
                    ))}
                  </select>
                </div>
                
                {(sortBy !== "default" || locationFilter) && (
                  <button className="clear-filters" onClick={clearFilters}>
                    Clear Filters
                  </button>
                )}
              </div>
              
              <div className="course-list">
                {filteredCourses.map((course) => (
                  <div 
                    key={course.id} 
                    className="course-item" 
                    onClick={() => openCourseModal(course)}
                  >
                    <div className="course-image-container">
                      <img src={course.url} alt={course.name} />
                    </div>
                    <div className="course-content">
                      <div className="course-info">
                        <h2>{course.name}</h2>
                        <h3>{course.location}</h3>
                        {course.rating && (
                          <div className="course-rating">
                            {parseFloat(course.rating).toFixed(1)}
                            <span className="rating-stars">
                              {[...Array(5)].map((_, i) => (
                                <span key={i} className={i < Math.round(parseFloat(course.rating)) ? "star filled" : "star"}>
                                  ★
                                </span>
                              ))}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="course-actions" onClick={(e) => e.stopPropagation()}>
                        <AddToPack 
                          item={{
                            id: course.id,
                            name: course.name,
                            location: course.location,
                            description: course.description || 'Explore this amazing golf course.',
                            imageUrl: course.url,
                            rating: course.rating
                          }} 
                          type="course"
                          buttonStyle="secondary"
                          showFeedback={false}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                
                {filteredCourses.length === 0 && (
                  <div className="no-results">
                    <p>No courses match your filters. Try different criteria.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Map view */}
          <div className={`map-view ${viewMode === "map" ? "active" : ""}`}>
            <CourseMap courses={filteredCourses} onCourseSelect={openCourseModal} />
          </div>
        </div>
      )}

      {selectedCourse && (
        <CourseModal 
          course={selectedCourse} 
          onClose={closeCourseModal} 
        />
      )}
    </div>
  );
};

export default Courses;
