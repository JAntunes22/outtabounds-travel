import React, { useEffect, useState } from "react";
import { fetchCourses } from "../utils/firebaseUtils";
import Footer from "../components/Footer";
import CourseModal from "../components/CourseModal";
import CourseMap from "../components/CourseMap";
import './Courses.css';

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState("default");
  const [locationFilter, setLocationFilter] = useState("");
  const [locations, setLocations] = useState([]);
  const [isFilterOpen, setIsFilterOpen] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [viewMode, setViewMode] = useState("list"); // "list" or "map"

  // Helper function to normalize location strings
  const normalizeLocation = (location) => {
    return location.trim().toLowerCase();
  };

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
          
          return {
            ...course,
            popularity: course.popularity || Math.floor(Math.random() * 100),
            rating: course.rating || (Math.random() * 3 + 2).toFixed(1),
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
      <header className="hero hero-courses">
        <div className="hero-courses-content">
          <h1>Our Golf Courses</h1>
          <p>Explore the best golf courses curated just for you.</p>
        </div>
      </header>
      
      {error ? (
        <p className="error-message">{error}</p>
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
                  <div key={course.id} className="course-item" onClick={() => openCourseModal(course)}>
                    <img src={course.url} alt={course.name} />
                    <div className="course-content">
                      <h2>{course.name}</h2>
                      <h3>{course.location}</h3>
                      {course.rating && <div className="course-rating">Rating: {course.rating}★</div>}
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
      
      <Footer />
    </div>
  );
};

export default Courses;
