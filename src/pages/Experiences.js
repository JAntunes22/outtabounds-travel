import React, { useEffect, useState, useRef } from "react";
import { fetchExperiences } from "../utils/firebaseUtils";
import ExperienceModal from "../components/ExperienceModal";
import ExperienceMap from "../components/ExperienceMap";
import AddToPack from "../components/AddToPack";
import './Experiences.css';

const Experiences = () => {
  const [experiences, setExperiences] = useState([]);
  const [filteredExperiences, setFilteredExperiences] = useState([]);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState("default");
  const [locationFilter, setLocationFilter] = useState("");
  const [locations, setLocations] = useState([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedExperience, setSelectedExperience] = useState(null);
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
    const getExperiences = async () => {
      try {
        console.log("Attempting to fetch experiences...");
        const fetchedExperiences = await fetchExperiences();
        console.log("Fetched experiences from Firebase:", fetchedExperiences);
        
        if (!Array.isArray(fetchedExperiences)) {
          console.error("Fetched experiences is not an array:", fetchedExperiences);
          setError("Failed to fetch experiences. Invalid data format.");
          return;
        }
        
        // Add mock popularity and rating data if not available
        const enhancedExperiences = fetchedExperiences.map((experience) => {
          console.log(`Processing experience ${experience.id}: ${experience.name}`);
          
          // Handle features properly, ensuring it's an array
          let experienceFeatures = [];
          if (experience.features) {
            // If features exists, make sure it's an array
            if (Array.isArray(experience.features)) {
              experienceFeatures = experience.features;
            } else if (typeof experience.features === 'string') {
              // If it's a string, try to parse it as JSON
              try {
                const parsed = JSON.parse(experience.features);
                experienceFeatures = Array.isArray(parsed) ? parsed : [experience.features];
              } catch (e) {
                experienceFeatures = [experience.features]; // Use as single string feature
              }
            } else {
              // If it's another type, convert to string
              experienceFeatures = [String(experience.features)];
            }
          }
          
          // Ensure rating is a number and properly formatted
          let rating = experience.rating;
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
            ...experience,
            popularity: experience.popularity || Math.floor(Math.random() * 100),
            rating: rating,
            normalizedLocation: normalizeLocation(experience.location || "Unknown location"),
            features: experienceFeatures.length > 0 ? experienceFeatures : ["No features available"]
          };
        });
        
        setExperiences(enhancedExperiences);
        setFilteredExperiences(enhancedExperiences);
        
        // Extract unique locations for filter - group by normalized locations
        const locationMap = {};
        enhancedExperiences.forEach(experience => {
          if (experience.location) {
            const normalized = normalizeLocation(experience.location);
            // Keep the original formatting for display, but use normalized for comparison
            locationMap[normalized] = experience.location;
          }
        });
        
        const uniqueLocations = Object.values(locationMap);
        setLocations(uniqueLocations);
        
        // Clear any previous error if successful
        setError(null);
      } catch (err) {
        console.error("Error fetching experiences:", err);
        setError("Failed to fetch experiences. Please try again later.");
      }
    };
    getExperiences();
  }, []);

  // Effect to handle filtering and sorting
  useEffect(() => {
    let result = [...experiences];
    
    // Apply location filter
    if (locationFilter) {
      const normalizedFilter = normalizeLocation(locationFilter);
      result = result.filter(experience => normalizeLocation(experience.location) === normalizedFilter);
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
    
    setFilteredExperiences(result);
  }, [experiences, sortBy, locationFilter]);

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

  const openExperienceModal = (experience) => {
    console.log("Opening modal for experience:", experience);
    // Make sure experience has a features array even if undefined in the original data
    const experienceWithFeatures = {
      ...experience,
      features: experience.features || [
        "Professional guides available",
        "Equipment rentals",
        "Food and beverages included",
        "Stunning views",
        "Transportation provided"
      ]
    };
    setSelectedExperience(experienceWithFeatures);
  };

  const closeExperienceModal = () => {
    setSelectedExperience(null);
  };

  // Function to toggle between list and map views
  const toggleView = (mode) => {
    setViewMode(mode);
  };

  return (
    <div className="experiences">
      <header className="hero hero-experiences" ref={heroRef}>
        <div className="hero-experiences-content" ref={heroContentRef}>
          <h1>Our Experiences</h1>
          <p>Explore amazing activities and adventures curated just for you.</p>
        </div>
      </header>
      
      {error ? (
        <div className="error-message-container">
          <p className="error-message">{error}</p>
        </div>
      ) : experiences.length === 0 ? (
        <div className="no-experiences-container">
          <p className="no-experiences-message">
            No experiences are currently available. Please check back later for exciting adventures!
          </p>
        </div>
      ) : (
        <div className="experiences-content">
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
            <div className="experiences-container">
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
              
              <div className="experience-list">
                {filteredExperiences.map((experience) => (
                  <div 
                    key={experience.id} 
                    className="experience-item" 
                    onClick={() => openExperienceModal(experience)}
                  >
                    <div className="experience-image-container">
                      <img src={experience.url} alt={experience.name} />
                    </div>
                    <div className="experience-content">
                      <div className="experience-info">
                        <h2>{experience.name}</h2>
                        <h3>{experience.location}</h3>
                        {experience.rating && (
                          <div className="experience-rating">
                            {parseFloat(experience.rating).toFixed(1)}
                            <span className="rating-stars">
                              {[...Array(5)].map((_, i) => (
                                <span key={i} className={i < Math.round(parseFloat(experience.rating)) ? "star filled" : "star"}>
                                  ★
                                </span>
                              ))}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="experience-actions" onClick={(e) => e.stopPropagation()}>
                        <AddToPack 
                          item={{
                            id: experience.id,
                            name: experience.name,
                            location: experience.location,
                            description: experience.description || 'Explore this amazing experience.',
                            imageUrl: experience.url,
                            rating: experience.rating
                          }} 
                          type="experience"
                          buttonStyle="secondary"
                          showFeedback={false}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                
                {filteredExperiences.length === 0 && (
                  <div className="no-results">
                    <p>No experiences match your filters. Try different criteria.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Map view */}
          <div className={`map-view ${viewMode === "map" ? "active" : ""}`}>
            <ExperienceMap experiences={filteredExperiences} onExperienceSelect={openExperienceModal} />
          </div>
        </div>
      )}

      {selectedExperience && (
        <ExperienceModal 
          experience={selectedExperience} 
          onClose={closeExperienceModal} 
        />
      )}
    </div>
  );
};

export default Experiences;
