import React, { useEffect, useState, useRef } from "react";
import { collection, getDocs, getDoc, doc } from "firebase/firestore";
import { db } from "../utils/firebaseConfig";
import { useNavigate } from "react-router-dom";
import { useLocale } from "../contexts/LocaleContext";
import { formatPackPrice } from "../utils/localeUtils";
import './Packs.css';

const Packs = () => {
  const { getLocalizedPath, currentLocale } = useLocale();
  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const heroContentRef = useRef(null);
  const heroRef = useRef(null);
  const navigate = useNavigate();

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
        // First, try to get featured packs for the current locale
        const featuredPacksDoc = await getDoc(doc(db, 'settings', 'featuredPacks'));
        let featuredPackIds = [];
        
        if (featuredPacksDoc.exists()) {
          const featuredPacksData = featuredPacksDoc.data();
          // Map current locale to tier
          const getRegionTier = (locale) => {
            const tierMap = {
              'en-us': 'tier1',
              'en-uk': 'tier1', 
              'fr': 'tier2',
              'pt': 'tier3',
              'es': 'tier3'
            };
            return tierMap[locale] || 'rest';
          };
          
          const tier = getRegionTier(currentLocale);
          featuredPackIds = featuredPacksData[tier] || [];
        }

        // Fetch all packs
        const packsCollection = collection(db, "packs");
        const packsSnapshot = await getDocs(packsCollection);
        const allPacks = {};
        
        packsSnapshot.docs.forEach(doc => {
          allPacks[doc.id] = {
            id: doc.id,
            ...doc.data()
          };
        });

        // Get featured packs in order
        const featuredPacks = featuredPackIds
          .map(packId => allPacks[packId])
          .filter(pack => pack); // Remove any undefined packs

        // Get remaining packs (not featured) and sort by order field
        const remainingPacks = Object.values(allPacks)
          .filter(pack => !featuredPackIds.includes(pack.id))
          .sort((a, b) => {
            // Sort by order field first, then by name
            if (a.order !== undefined && b.order !== undefined) {
              return a.order - b.order;
            }
            if (a.order !== undefined) return -1;
            if (b.order !== undefined) return 1;
            return a.name.localeCompare(b.name);
          });

        // Combine: featured packs first, then remaining packs
        const finalPacksList = [...featuredPacks, ...remainingPacks];
        
        setPacks(finalPacksList);
      } catch (error) {
        console.error("Error fetching packs:", error);
        setError("Failed to fetch packs. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchPacks();
  }, [currentLocale]);

  const handlePackClick = (pack) => {
    // Use slug if available, otherwise fall back to ID
    const packIdentifier = pack.slug || pack.id;
    navigate(getLocalizedPath(`/packs/${packIdentifier}`));
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
              <div className="packs-grid">
                {packs.map((pack) => (
                  <div 
                    key={pack.id} 
                    className="pack-card"
                    onClick={() => handlePackClick(pack)}
                  >
                    <div className="pack-image">
                      <img 
                        src={pack.imageUrl || 'https://via.placeholder.com/400x250?text=No+Image'} 
                        alt={pack.name}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://via.placeholder.com/400x250?text=No+Image';
                        }}
                      />
                    </div>
                    
                    <div className="pack-content">
                      <div className="pack-info">
                        <h2>{pack.name}</h2>
                      </div>
                      <div className="pack-bottom">
                        <div className="pack-includes-summary">
                          {pack.courses && pack.courses.length > 0 && <span>{pack.courses.length} Course{pack.courses.length > 1 ? 's' : ''}</span>}
                          {pack.experiences && pack.experiences.length > 0 && <span>{pack.experiences.length} Experience{pack.experiences.length > 1 ? 's' : ''}</span>}
                          {pack.accommodations && pack.accommodations.length > 0 && <span>{pack.accommodations.length} Accommodation{pack.accommodations.length > 1 ? 's' : ''}</span>}
                          {pack.services && pack.services.length > 0 && <span>{pack.services.length} Service{pack.services.length > 1 ? 's' : ''}</span>}
                        </div>
                        <h3 className="pack-price">{formatPackPrice(pack, currentLocale)} pp</h3>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Packs;