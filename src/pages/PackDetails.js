import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, collection, query, where, getDocs, limit } from "firebase/firestore";
import { db } from "../utils/firebaseConfig";
import { fetchIncludedItemDetails, fetchCourseById, fetchAccommodationById, fetchExperienceById } from "../utils/firebaseUtils";
import './PackCommon.css';
import './Packs.css';

const PackDetails = () => {
  const { packId } = useParams(); // This could be either an ID or a slug
  const navigate = useNavigate();
  const [pack, setPack] = useState(null);
  const PLACEHOLDER_IMAGE = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==";
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for booking options
  const [arrivalDate, setArrivalDate] = useState("");
  const [groupSize, setGroupSize] = useState(2);
  const [totalPrice, setTotalPrice] = useState(0);
  
  // State for included items details
  const [accommodationsData, setAccommodationsData] = useState({});
  const [coursesData, setCoursesData] = useState({});
  const [experiencesData, setExperiencesData] = useState({});

  // Calculate total price based on group size
  const calculateTotalPrice = useCallback((basePrice, size) => {
    return basePrice * size;
  }, []);

  useEffect(() => {
    const fetchPack = async () => {
      setLoading(true);
      try {
        // First try to fetch directly by ID
        const packDoc = await getDoc(doc(db, "packs", packId));
        
        if (packDoc.exists()) {
          // Found by ID
          const packData = {
            id: packDoc.id,
            ...packDoc.data()
          };
          setPack(packData);
          
          // Set initial group size from recommended if available
          if (packData.recommendedGroup) {
            setGroupSize(parseInt(packData.recommendedGroup, 10));
          }
          
          // Calculate initial total price
          if (packData.price) {
            setTotalPrice(calculateTotalPrice(packData.price, groupSize));
          }
          
          // Fetch details for included items
          await fetchItemDetails(packData);
        } else {
          // If not found by ID, try to find by slug
          const packsRef = collection(db, "packs");
          const q = query(packsRef, where("slug", "==", packId), limit(1));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            // Found by slug
            const packData = {
              id: querySnapshot.docs[0].id,
              ...querySnapshot.docs[0].data()
            };
            setPack(packData);
            
            // Set initial group size from recommended if available
            if (packData.recommendedGroup) {
              setGroupSize(parseInt(packData.recommendedGroup, 10));
            }
            
            // Calculate initial total price
            if (packData.price) {
              setTotalPrice(calculateTotalPrice(packData.price, groupSize));
            }
            
            // Fetch details for included items
            await fetchItemDetails(packData);
          } else {
            // Not found by ID or slug
            setError("Pack not found");
          }
        }
      } catch (err) {
        console.error("Error fetching pack:", err);
        setError("Failed to fetch pack details. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    if (packId) {
      fetchPack();
    }
  }, [packId, calculateTotalPrice, groupSize]);
  
  // Fetch details for included items
  const fetchItemDetails = async (packData) => {
    try {
      console.log("Fetching item details for pack:", packData.name);
      
      // Fetch accommodations details
      const accommodationsDetailsObj = {};
      if (packData.accommodations && packData.accommodations.length > 0) {
        console.log("Fetching accommodations:", packData.accommodations, "type:", typeof packData.accommodations);
        
        // Make sure accommodations is an array
        const accommodationsArray = Array.isArray(packData.accommodations) 
          ? packData.accommodations 
          : Object.keys(packData.accommodations);
        
        console.log("Accommodations array:", accommodationsArray);
        
        for (const accommodation of accommodationsArray) {
          try {
            console.log("Processing accommodation:", accommodation, "type:", typeof accommodation);
            if (typeof accommodation === 'string') {
              // Try fetching directly by ID first
              let details = null;
              try {
                details = await fetchAccommodationById(accommodation);
                console.log("Found accommodation by ID:", details);
                console.log("Accommodation image URL:", details.imageUrl);
              } catch (idError) {
                // Try with fetchIncludedItemDetails which also tries by name
                details = await fetchIncludedItemDetails(accommodation, 'accommodation');
                console.log("Found accommodation by name:", details);
              }
              
              if (details) {
                console.log("Adding accommodation details:", details);
                // Debug log to see what image fields are available in the details
                console.log("Image fields in accommodation:", {
                  imageUrl: details.imageUrl,
                  image: details.image,
                  imageSrc: details.imageSrc,
                  pictureUrl: details.pictureUrl,
                  thumbnail: details.thumbnail
                });
                // Store using the original key (string or object)
                accommodationsDetailsObj[typeof accommodation === 'string' ? accommodation : accommodation.id] = details;
              } else {
                console.log("No details found for accommodation:", accommodation);
                // Add a default object with the name and placeholder image
                accommodationsDetailsObj[typeof accommodation === 'string' ? accommodation : accommodation.id] = { 
                  name: accommodation,
                  imageUrl: PLACEHOLDER_IMAGE 
                };
              }
            } else {
              // Get the ID - either the string itself or from the object
              const accommodationId = typeof accommodation === 'string' 
                ? accommodation 
                : (accommodation.id || accommodation.name);
              
              console.log("Accommodation ID to fetch:", accommodationId);
              
              // Try fetching directly by ID first
              let details = null;
              try {
                details = await fetchAccommodationById(accommodationId);
                console.log("Found accommodation by ID:", details);
                console.log("Accommodation image URL:", details.imageUrl);
              } catch (idError) {
                // Try with fetchIncludedItemDetails which also tries by name
                details = await fetchIncludedItemDetails(accommodationId, 'accommodation');
                console.log("Found accommodation by name:", details);
              }
              
              if (details) {
                console.log("Adding accommodation details:", details);
                // Debug log to see what image fields are available in the details
                console.log("Image fields in accommodation:", {
                  imageUrl: details.imageUrl,
                  image: details.image,
                  imageSrc: details.imageSrc,
                  pictureUrl: details.pictureUrl,
                  thumbnail: details.thumbnail
                });
                // Store using the original key (string or object) - convert complex objects to string keys
                const storeKey = typeof accommodation === 'string' ? accommodation : JSON.stringify(accommodation.id || accommodation);
                accommodationsDetailsObj[storeKey] = details;
              } else {
                console.log("No details found for accommodation:", accommodation);
                // Add a default object with the name and placeholder image
                const storeKey = typeof accommodation === 'string' ? accommodation : JSON.stringify(accommodation.id || accommodation);
                accommodationsDetailsObj[storeKey] = { 
                  name: typeof accommodation === 'object' && accommodation.name ? accommodation.name.toString() : accommodation,
                  imageUrl: PLACEHOLDER_IMAGE 
                };
              }
            }
          } catch (accommodationError) {
            console.error("Error fetching accommodation details:", accommodationError);
            // Add a default object for error case
            accommodationsDetailsObj[typeof accommodation === 'string' ? accommodation : 'unknown'] = { 
              name: typeof accommodation === 'string' ? accommodation : 'Unknown Accommodation',
              imageUrl: PLACEHOLDER_IMAGE 
            };
          }
        }
        console.log("Final accommodations data:", accommodationsDetailsObj);
        setAccommodationsData(accommodationsDetailsObj);
      }
      
      // Fetch courses details
      const coursesDetailsObj = {};
      if (packData.courses && packData.courses.length > 0) {
        console.log("Fetching courses:", packData.courses);
        for (const course of packData.courses) {
          try {
            // Create a consistent key for this course
            const courseKey = typeof course === 'string' 
              ? course 
              : (course?.id?.toString() || JSON.stringify(course));
            
            // Create a name display string
            const courseName = typeof course === 'string' 
              ? course 
              : (course?.name?.toString() || 'Unknown Course');
              
            if (typeof course === 'string' || course.id) {
              // Try fetching directly by ID first
              let details = null;
              
              try {
                details = await fetchCourseById(typeof course === 'string' ? course : course.id);
                console.log("Found course by ID:", details);
                
                // Log the image fields in the course
                if (details) {
                  console.log("Course image fields:", {
                    url: details.url,
                    imageUrl: details.imageUrl,
                    image: details.image
                  });
                  
                  // Ensure the course has imageUrl set from url if needed
                  if (!details.imageUrl && details.url) {
                    details.imageUrl = details.url;
                    console.log("Set imageUrl from url field:", details.url);
                  }
                }
              } catch (idError) {
                // Try with fetchIncludedItemDetails which also tries by name
                details = await fetchIncludedItemDetails(
                  typeof course === 'string' ? course : course.id, 
                  'course'
                );
                console.log("Found course by name:", details);
                
                // Log the image fields in the course
                if (details) {
                  console.log("Course image fields:", {
                    url: details.url,
                    imageUrl: details.imageUrl,
                    image: details.image
                  });
                  
                  // Ensure the course has imageUrl set from url if needed
                  if (!details.imageUrl && details.url) {
                    details.imageUrl = details.url;
                    console.log("Set imageUrl from url field:", details.url);
                  }
                }
              }
              
              if (details) {
                console.log("Adding course details:", details);
                coursesDetailsObj[courseKey] = details;
              } else {
                console.log("No details found for course:", course);
                // Add a default object with the name and placeholder image
                coursesDetailsObj[courseKey] = { 
                  name: courseName,
                  imageUrl: PLACEHOLDER_IMAGE 
                };
              }
            } else {
              // Handle object that doesn't have an ID
              coursesDetailsObj[courseKey] = { 
                name: courseName,
                imageUrl: PLACEHOLDER_IMAGE 
              };
            }
          } catch (courseError) {
            console.error("Error fetching course details:", courseError);
            
            // Create consistent keys again in the catch block
            const courseKey = typeof course === 'string' 
              ? course 
              : (course?.id?.toString() || JSON.stringify(course));
              
            const courseName = typeof course === 'string' 
              ? course 
              : (course?.name?.toString() || 'Unknown Course');
              
            // Add a default object for error case
            coursesDetailsObj[courseKey] = { 
              name: courseName,
              imageUrl: PLACEHOLDER_IMAGE 
            };
          }
        }
        console.log("Final courses data:", coursesDetailsObj);
        setCoursesData(coursesDetailsObj);
      }
      
      // Fetch experiences details
      const experiencesDetailsObj = {};
      if (packData.experiences && packData.experiences.length > 0) {
        console.log("Fetching experiences:", packData.experiences);
        for (const experience of packData.experiences) {
          try {
            // Create a consistent key for this experience
            const experienceKey = typeof experience === 'string' 
              ? experience 
              : (experience?.id?.toString() || JSON.stringify(experience));
            
            // Create a name display string
            const experienceName = typeof experience === 'string' 
              ? experience 
              : (experience?.name?.toString() || 'Unknown Experience');
              
            if (typeof experience === 'string' || experience.id) {
              // Try fetching directly by ID first
              let details = null;
              
              try {
                details = await fetchExperienceById(typeof experience === 'string' ? experience : experience.id);
                console.log("Found experience by ID:", details);
              } catch (idError) {
                // Try with fetchIncludedItemDetails which also tries by name
                details = await fetchIncludedItemDetails(
                  typeof experience === 'string' ? experience : experience.id, 
                  'experience'
                );
                console.log("Found experience by name:", details);
              }
              
              if (details) {
                console.log("Adding experience details:", details);
                experiencesDetailsObj[experienceKey] = details;
              } else {
                console.log("No details found for experience:", experience);
                console.log("Experience key:", experienceKey);
                console.log("Experience name:", experienceName);
                // Add a default object with the name and placeholder image
                experiencesDetailsObj[experienceKey] = { 
                  name: experienceName,
                  imageUrl: PLACEHOLDER_IMAGE 
                };
              }
            } else {
              // Handle object that doesn't have an ID
              experiencesDetailsObj[experienceKey] = { 
                name: experienceName,
                imageUrl: PLACEHOLDER_IMAGE 
              };
            }
          } catch (experienceError) {
            console.error("Error fetching experience details:", experienceError);
            // Add a default object for error case
            const experienceKey = typeof experience === 'string' ? experience : (experience?.id?.toString() || JSON.stringify(experience));
            experiencesDetailsObj[experienceKey] = { 
              name: typeof experience === 'string' ? experience : 'Unknown Experience',
              imageUrl: PLACEHOLDER_IMAGE 
            };
          }
        }
        console.log("Final experiences data:", experiencesDetailsObj);
        setExperiencesData(experiencesDetailsObj);
      }
    } catch (error) {
      console.error("Error fetching included items details:", error);
    }
  };
  
  // Set minimum date to today + 1 day
  const getMinDate = () => {
    const today = new Date();
    today.setDate(today.getDate() + 1);
    return today.toISOString().split('T')[0];
  };
  
  // Handle group size change
  const handleGroupSizeChange = (newSize) => {
    if (newSize >= 1 && newSize <= 20) {
      setGroupSize(newSize);
      if (pack && pack.price) {
        setTotalPrice(calculateTotalPrice(pack.price, newSize));
      }
    }
  };

  const handleDecrease = (e) => { e.preventDefault(); e.stopPropagation(); handleGroupSizeChange(groupSize - 1); };
  const handleIncrease = (e) => { e.preventDefault(); e.stopPropagation(); handleGroupSizeChange(groupSize + 1); };
  const handleBookNow = () => {
    if (pack) {
      // Include booking details in the navigation state
      navigate('/booking-details', { 
        state: { 
          selectedPack: pack,
          bookingDetails: {
            arrivalDate,
            groupSize,
            totalPrice
          }
        } 
      });
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading pack details...</p>
      </div>
    );
  }

  if (error || !pack) {
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>{error || "Pack not found"}</p>
        <button onClick={() => navigate('/packs')} className="button-primary">
          Back to Packs
        </button>
      </div>
    );
  }

  // Helper function to get item details for string items
  const getItemDetails = (item, type) => {
    // If it's already an object with complete details, use it
    if (typeof item === 'object' && item.imageUrl) {
      return item;
    }
    
    // Get the key to use for lookup - either the string itself or the id from object
    const lookupKey = typeof item === 'string' ? item : (item?.id || '');
    console.log(`Getting details for ${type} with key:`, lookupKey);
    
    // For objects, also try using a stringified version as key
    const stringKey = typeof item === 'object' ? JSON.stringify(item.id || item) : '';
    
    let itemDetails = null;
    
    // Look up in the corresponding details object
    if (type === 'accommodation' && (accommodationsData[lookupKey] || accommodationsData[stringKey])) {
      itemDetails = accommodationsData[lookupKey] || accommodationsData[stringKey];
      console.log(`Found ${type} details:`, itemDetails);
    } else if (type === 'course' && (coursesData[lookupKey] || coursesData[stringKey])) {
      itemDetails = coursesData[lookupKey] || coursesData[stringKey];
      console.log(`Found course details:`, itemDetails);
      
      // Debug for courses - log all available fields
      if (itemDetails) {
        console.log('Course fields available:', Object.keys(itemDetails));
        console.log('Course url field:', itemDetails.url);
        console.log('Course imageUrl field:', itemDetails.imageUrl);
      }
    } else if (type === 'experience' && (experiencesData[lookupKey] || experiencesData[stringKey])) {
      itemDetails = experiencesData[lookupKey] || experiencesData[stringKey];
      console.log(`Found ${type} details:`, itemDetails);
    }
    
    // If we found details, ensure the imageUrl property exists by checking alternative field names
    if (itemDetails) {
      // Check different possible image field names and use the first one that exists
      if (!itemDetails.imageUrl) {
        if ((type === 'course' || type === 'experience') && itemDetails.url) {
          // For courses and experiences, use the url field
          itemDetails.imageUrl = itemDetails.url;
          console.log(`Using 'url' field for ${type}:`, itemDetails.url);
        } else if (itemDetails.image) {
          itemDetails.imageUrl = itemDetails.image;
          console.log(`Using 'image' field for ${type} ${item}`);
        } else if (itemDetails.imageSrc) {
          itemDetails.imageUrl = itemDetails.imageSrc;
          console.log(`Using 'imageSrc' field for ${type} ${item}`);
        } else if (itemDetails.pictureUrl) {
          itemDetails.imageUrl = itemDetails.pictureUrl;
          console.log(`Using 'pictureUrl' field for ${type} ${item}`);
        } else if (itemDetails.thumbnail) {
          itemDetails.imageUrl = itemDetails.thumbnail;
          console.log(`Using 'thumbnail' field for ${type} ${item}`);
        } else {
          console.log(`No image field found for ${type} ${item}, using placeholder`);
          itemDetails.imageUrl = PLACEHOLDER_IMAGE;
        }
      }
      return itemDetails;
    }
    
    // No details found, return a simple object with the name and placeholder image
    return { 
      name: item,
      imageUrl: PLACEHOLDER_IMAGE 
    };
  };

  // Debug the data for included items
  console.log("Accommodations data:", accommodationsData);
  console.log("Courses data:", coursesData);
  console.log("Experiences data:", experiencesData);
  
  // Let's check each item's image property
  Object.keys(accommodationsData).forEach(key => {
    console.log(`Accommodation ${key} image fields:`, {
      imageUrl: accommodationsData[key].imageUrl,
      image: accommodationsData[key].image,
      imageSrc: accommodationsData[key].imageSrc,
      pictureUrl: accommodationsData[key].pictureUrl,
      thumbnail: accommodationsData[key].thumbnail
    });
  });

  return (
    <div className="pack-details-page">
      <header className="pack-details-hero" style={{ 
        backgroundImage: pack.imageUrl ? 
          `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('${pack.imageUrl}')` : 
          "linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('https://via.placeholder.com/1600x900?text=Pack+Image+Not+Available')"
      }}>
        <div className="pack-details-hero-content">
          <h1>{pack.name}</h1>
        </div>
      </header>

      <div className="pack-details-content">
        <div className="pack-details-main">
          <div className="pack-details-left">
            <div className="pack-description-section">
              <h2>Description</h2>
              <p>{pack.description || 'No description available'}</p>
            </div>

            <div className="pack-includes-details">
              <h2>What's Included</h2>
              
              <div className="includes-sections-vertical">
                {/* Accommodations Section */}
                {pack.accommodations && pack.accommodations.length > 0 && (
                  <div className="includes-vertical-section">
                    <h3>Accommodations</h3>
                    <div className="includes-items-list">
                      {pack.accommodations.map((accommodation, index) => {
                        // Get the name directly from accommodation if it's an object with a name
                        const displayName = typeof accommodation === 'object' && accommodation.name 
                          ? accommodation.name.toString() 
                          : (typeof accommodation === 'string' ? accommodation : 'Unknown');
                        
                        const accommodationDetails = getItemDetails(accommodation, 'accommodation');
                        console.log(`Rendering accommodation ${index}:`, accommodationDetails);
                        
                        // Ensure we check for all possible image fields
                        const hasImage = !!accommodationDetails.imageUrl;
                        const imageSrc = accommodationDetails.imageUrl || PLACEHOLDER_IMAGE;
                        
                        return (
                          <div className="includes-item-card" key={`acc-${index}`}>
                            <div className="item-image">
                              {hasImage ? (
                                <img 
                                  src={imageSrc} 
                                  alt={accommodationDetails.name || displayName} 
                                  onError={(e) => {
                                    console.log(`Image error for ${displayName}:`, e);
                                    e.target.onerror = null;
                                    e.target.src = PLACEHOLDER_IMAGE;
                                  }}
                                />
                              ) : (
                                <div className="placeholder-image">No Image</div>
                              )}
                            </div>
                            <div className="item-details">
                              <h4>{accommodationDetails.name || displayName}</h4>
                              {accommodationDetails.description && (
                                <p>{accommodationDetails.description}</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {/* Courses Section */}
                {pack.courses && pack.courses.length > 0 && (
                  <div className="includes-vertical-section">
                    <h3>Courses</h3>
                    <div className="includes-items-list">
                      {pack.courses.map((course, index) => {
                        // Get the name directly from course if it's an object with a name
                        const displayName = typeof course === 'object' && course.name 
                          ? course.name.toString() 
                          : (typeof course === 'string' ? course : 'Unknown');
                        
                        const courseDetails = getItemDetails(course, 'course');
                        console.log(`Rendering course ${index}:`, courseDetails);
                        
                        // Ensure we check for both imageUrl and url fields
                        const hasImage = !!(courseDetails.imageUrl || courseDetails.url);
                        const imageSrc = courseDetails.imageUrl || courseDetails.url || PLACEHOLDER_IMAGE;
                        
                        return (
                          <div className="includes-item-card" key={`course-${index}`}>
                            <div className="item-image">
                              {hasImage ? (
                                <img 
                                  src={imageSrc} 
                                  alt={courseDetails.name || displayName}
                                  onError={(e) => {
                                    console.log(`Image error for ${displayName}:`, e);
                                    e.target.onerror = null;
                                    e.target.src = PLACEHOLDER_IMAGE;
                                  }}
                                />
                              ) : (
                                <div className="placeholder-image">No Image</div>
                              )}
                            </div>
                            <div className="item-details">
                              <h4>{courseDetails.name || displayName}</h4>
                              {courseDetails.description && (
                                <p>{courseDetails.description}</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {/* Experiences Section */}
                {pack.experiences && pack.experiences.length > 0 && (
                  <div className="includes-vertical-section">
                    <h3>Experiences</h3>
                    <div className="includes-items-list">
                      {pack.experiences.map((experience, index) => {
                        // Get the name directly from experience if it's an object with a name
                        const displayName = typeof experience === 'object' && experience.name 
                          ? experience.name.toString() 
                          : (typeof experience === 'string' ? experience : 'Unknown');
                        
                        const experienceDetails = getItemDetails(experience, 'experience');
                        console.log(`Rendering experience ${index}:`, experienceDetails);
                        
                        // Ensure we check for all possible image fields
                        const hasImage = !!(experienceDetails.url || experienceDetails.imageUrl);
                        const imageSrc = experienceDetails.url || experienceDetails.imageUrl || PLACEHOLDER_IMAGE;
                        
                        return (
                          <div className="includes-item-card" key={`exp-${index}`}>
                            <div className="item-image">
                              {hasImage ? (
                                <img 
                                  src={imageSrc} 
                                  alt={experienceDetails.name || displayName}
                                  onError={(e) => {
                                    console.log(`Image error for ${displayName}:`, e);
                                    e.target.onerror = null;
                                    e.target.src = PLACEHOLDER_IMAGE;
                                  }}
                                />
                              ) : (
                                <div className="placeholder-image">No Image</div>
                              )}
                            </div>
                            <div className="item-details">
                              <h4>{experienceDetails.name || displayName}</h4>
                              {experienceDetails.description && (
                                <p>{experienceDetails.description}</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="pack-details-right">
            <div className="pack-booking-card">
              <div className="pack-price-container">
                <div className="price-main">
                  <span className="currency">$</span>
                  <span className="amount">{pack.price || '0'}</span>
                  <span className="unit">pp</span>
                </div>
                <p className="price-note">
                  Price per person based on {pack.recommendedGroup || 2} people sharing.
                </p>
              </div>
              
              <div className="pack-booking-options">
                <div className="booking-option">
                  <label htmlFor="arrival-date">Arrival Date</label>
                  <input 
                    type="date" 
                    id="arrival-date"
                    value={arrivalDate} 
                    onChange={(e) => setArrivalDate(e.target.value)}
                    min={getMinDate()}
                    required
                  />
                </div>
                
                <div className="booking-option">
                  <label htmlFor="group-size">Group Size</label>
                  <div className="number-input-control">
                    <button 
                      type="button" 
                      className="decrease" 
                      onClick={handleDecrease}
                      disabled={groupSize <= 1}
                    >-</button>
                    <input 
                      type="number" 
                      id="group-size"
                      value={groupSize} 
                      onChange={(e) => handleGroupSizeChange(parseInt(e.target.value, 10) || 1)}
                      min="1"
                      max="20"
                      required
                    />
                    <button 
                      type="button" 
                      className="increase" 
                      onClick={handleIncrease}
                      disabled={groupSize >= 20}
                    >+</button>
                  </div>
                </div>
                
                <div className="booking-summary">
                  <div className="booking-total">
                    <span>Total:</span>
                    <span className="total-price">${totalPrice}</span>
                  </div>
                  <small>For {groupSize} {groupSize === 1 ? 'person' : 'people'}</small>
                </div>
              </div>
              
              <div className="pack-details-info">
                <div className="info-item">
                  <div className="info-icon nights-icon"></div>
                  <div className="info-content">
                    <h4>NIGHTS</h4>
                    <p>{pack.nights || 'Not specified'}</p>
                  </div>
                </div>
                
                <div className="info-item">
                  <div className="info-icon board-icon"></div>
                  <div className="info-content">
                    <h4>BOARD</h4>
                    <p>{pack.board || 'Room only'}</p>
                  </div>
                </div>
                
                <div className="info-item">
                  <div className="info-icon group-icon"></div>
                  <div className="info-content">
                    <h4>GROUP SIZE</h4>
                    <p>{groupSize}</p>
                  </div>
                </div>
              </div>
              
              <button 
                className="button-primary book-now-button" 
                onClick={handleBookNow}
                disabled={!arrivalDate}
                style={{ margin: '0 auto', display: 'block' }}
              >
                BOOK NOW
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PackDetails; 