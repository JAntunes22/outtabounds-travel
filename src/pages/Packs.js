import React, { useEffect, useState, useRef } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../utils/firebaseConfig";
import './Packs.css';

const Packs = () => {
  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPack, setSelectedPack] = useState(null);
  const heroContentRef = useRef(null);
  const heroRef = useRef(null);

  // Handle keyboard events (e.g., pressing Escape to close modal)
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape' && selectedPack) {
        closePackModal();
      }
    };

    window.addEventListener('keydown', handleEscKey);
    
    return () => {
      window.removeEventListener('keydown', handleEscKey);
    };
  }, [selectedPack]);

  // Prevent scrolling when modal is open
  useEffect(() => {
    if (selectedPack) {
      // Store the current scroll position
      const scrollY = window.scrollY;
      
      // Add the modal-open class to body
      document.body.classList.add('modal-open');
      
      // Set the body position to maintain scroll position
      document.body.style.top = `-${scrollY}px`;
      
      // Cleanup function to restore scrolling when modal is closed
      return () => {
        // Remove the modal-open class
        document.body.classList.remove('modal-open');
        
        // Restore the scroll position
        document.body.style.top = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [selectedPack]);

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
    const fetchPacks = async () => {
      setLoading(true);
      try {
        const packsCollection = collection(db, "packs");
        const packsSnapshot = await getDocs(packsCollection);
        const packsList = packsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setPacks(packsList);
      } catch (err) {
        console.error("Error fetching packs:", err);
        setError("Failed to fetch packs. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchPacks();
  }, []);

  const openPackModal = (pack) => {
    setSelectedPack(pack);
  };

  const closePackModal = () => {
    setSelectedPack(null);
  };

  // Handle click outside modal to close it
  const handleOverlayClick = (e) => {
    if (e.target.classList.contains('pack-modal-overlay')) {
      closePackModal();
    }
  };

  const handleBookNow = (packId, packName) => {
    // Handle the booking action - for now just log it
    console.log(`Booking pack: ${packName} (${packId})`);
    alert(`Thank you for booking ${packName}! We'll contact you soon to complete your reservation.`);
    // You could also add logic to redirect to a booking page or open a booking form
  };

  return (
    <div className="packs">
      <header className="hero hero-packs" ref={heroRef} style={{ 
        backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('https://i.imgur.com/vexaClj.jpeg')" 
      }}>
        <div className="hero-packs-content" ref={heroContentRef}>
          <h1>Travel Packs</h1>
          <p>Discover our curated travel packages featuring the best courses, accommodations, and experiences.</p>
        </div>
      </header>
      
      {error ? (
        <p className="error-message">{error}</p>
      ) : loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading packs...</p>
        </div>
      ) : (
        <div className="packs-content">
          <h2 className="section-title">Available Packs</h2>
          
          <div className="packs-container">
            {packs.length === 0 ? (
              <p className="no-packs-message">No packs available at the moment. Please check back later.</p>
            ) : (
              <div className="pack-list">
                {packs.map((pack) => (
                  <div 
                    className="pack-item" 
                    key={pack.id}
                    onClick={() => openPackModal(pack)}
                  >
                    <div className="pack-image-container">
                      {pack.imageUrl ? (
                        <img 
                          src={pack.imageUrl} 
                          alt={pack.name} 
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://via.placeholder.com/400x600?text=Pack+Image+Not+Available";
                          }}
                        />
                      ) : (
                        <img 
                          src="https://via.placeholder.com/400x600?text=No+Image+Available" 
                          alt="No Image Available" 
                        />
                      )}
                    </div>
                    <div className="pack-content">
                      <div className="pack-info">
                        <h2>{pack.name}</h2>
                        <h3 className="pack-price">{pack.price ? `$${pack.price}` : 'Price upon request'}</h3>
                        <p>{pack.description 
                            ? (pack.description.length > 100 
                              ? `${pack.description.substring(0, 100)}...` 
                              : pack.description)
                            : 'No description available'}</p>
                        <div className="pack-includes-summary">
                          {pack.courses && pack.courses.length > 0 && <span>{pack.courses.length} Course{pack.courses.length > 1 ? 's' : ''}</span>}
                          {pack.experiences && pack.experiences.length > 0 && <span>{pack.experiences.length} Experience{pack.experiences.length > 1 ? 's' : ''}</span>}
                          {pack.accommodations && pack.accommodations.length > 0 && <span>{pack.accommodations.length} Accommodation{pack.accommodations.length > 1 ? 's' : ''}</span>}
                          {pack.services && pack.services.length > 0 && <span>{pack.services.length} Service{pack.services.length > 1 ? 's' : ''}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {selectedPack && (
        <div className="pack-modal-overlay" onClick={handleOverlayClick}>
          <div className="pack-modal">
            <button className="close-button" onClick={closePackModal}>×</button>
            <div className="pack-modal-content">
              <div className="pack-modal-image">
                {selectedPack.imageUrl ? (
                  <img 
                    src={selectedPack.imageUrl} 
                    alt={selectedPack.name} 
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://via.placeholder.com/800x600?text=Pack+Image+Not+Available";
                    }}
                  />
                ) : (
                  <div className="placeholder-image">No image available</div>
                )}
              </div>
              <div className="pack-modal-details">
                <h2>{selectedPack.name}</h2>
                <h3 className="pack-price">{selectedPack.price ? `$${selectedPack.price}` : 'Price upon request'}</h3>
                <p className="pack-description">{selectedPack.description || 'No description available'}</p>
                
                <div className="pack-includes">
                  <h4 className="includes-title">What's Included</h4>
                  <div className="includes-sections">
                    {selectedPack.courses && selectedPack.courses.length > 0 && (
                      <div className="includes-section">
                        <h5>Courses</h5>
                        <ul className="includes-list">
                          {selectedPack.courses.map((course, index) => (
                            <li key={`course-${index}`}>{course.name || course}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {selectedPack.experiences && selectedPack.experiences.length > 0 && (
                      <div className="includes-section">
                        <h5>Experiences</h5>
                        <ul className="includes-list">
                          {selectedPack.experiences.map((exp, index) => (
                            <li key={`exp-${index}`}>{exp.name || exp}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {selectedPack.accommodations && selectedPack.accommodations.length > 0 && (
                      <div className="includes-section">
                        <h5>Accommodations</h5>
                        <ul className="includes-list">
                          {selectedPack.accommodations.map((acc, index) => (
                            <li key={`acc-${index}`}>{acc.name || acc}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {selectedPack.services && selectedPack.services.length > 0 && (
                      <div className="includes-section">
                        <h5>Services</h5>
                        <ul className="includes-list">
                          {selectedPack.services.map((service, index) => (
                            <li key={`service-${index}`}>{service.name || service}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
                
                <button 
                  className="book-now-button"
                  onClick={() => handleBookNow(selectedPack.id, selectedPack.name)}
                >
                  Book Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Packs;