import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../utils/firebaseConfig";
import { useLocale } from "../contexts/LocaleContext";
import { getRegionTier, getPackPrice } from "../utils/localeUtils";
import "./Home.css"; // Ensure you create and style this CSS file

const Home = () => {
  const { getLocalizedPath, currentLocale } = useLocale();
  const heroContentRef = useRef(null);
  const heroRef = useRef(null);
  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to handle smooth scrolling
  const handleExploreClick = (e) => {
    e.preventDefault();
    const targetId = e.currentTarget.getAttribute('href').substring(1);
    const targetElement = document.getElementById(targetId);
    
    if (targetElement) {
      window.scrollTo({
        top: targetElement.offsetTop,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      if (heroContentRef.current && heroRef.current) {
        // Calculate how far down the page we've scrolled
        const scrollPos = window.scrollY;
        
        // Get the hero container dimensions
        const heroHeight = heroRef.current.offsetHeight;
        const heroBottom = heroRef.current.getBoundingClientRect().bottom + scrollPos;
        
        // Calculate the maximum allowed translation to keep content within hero
        // Allow only 70% of the hero height for translation to keep content visible
        const maxTranslation = heroHeight * 0.3;

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
    const fetchFeaturedPacks = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Check for cached packs first (cache for 10 minutes)
        const cachedData = localStorage.getItem('outtabounds_featured_packs');
        const cacheTimestamp = localStorage.getItem('outtabounds_featured_packs_timestamp');
        const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
        
        if (cachedData && cacheTimestamp && 
            (Date.now() - parseInt(cacheTimestamp)) < CACHE_DURATION) {
          console.log('Using cached packs data');
          setPacks(JSON.parse(cachedData));
          setLoading(false);
          return;
        }

        // Determine user's region tier
        let detectedTier = 'rest';
        
        // Try to get user's country from various sources
        try {
          // First try to get from current URL locale
          const currentPath = window.location.pathname;
          const pathSegments = currentPath.split('/').filter(Boolean);
          const urlLocale = pathSegments[0];
          
          if (urlLocale) {
            // Map locale to likely country
            const localeToCountry = {
              'en-us': 'US',
              'en-uk': 'UK', 
              'fr': 'FR',
              'pt': 'PT',
              'es': 'ES'
            };
            const country = localeToCountry[urlLocale];
            if (country) {
              detectedTier = getRegionTier(country);
            }
          }
          
          // If no URL locale detected, try browser language
          if (detectedTier === 'rest') {
            const browserLang = navigator.language.toLowerCase();
            
            // More precise language detection
            if (browserLang.startsWith('fr')) {
              detectedTier = getRegionTier('FR');
            } else if (browserLang.startsWith('pt')) {
              detectedTier = getRegionTier('PT');
            } else if (browserLang.startsWith('es')) {
              detectedTier = getRegionTier('ES');
            } else if (browserLang.startsWith('en-gb') || browserLang.startsWith('en-uk')) {
              detectedTier = getRegionTier('UK');
            } else if (browserLang.startsWith('en')) {
              detectedTier = getRegionTier('US');
            }
          }
          
          // If still no detection, try to use a simple IP geolocation service
          if (detectedTier === 'rest') {
            try {
              const response = await fetch('https://ipapi.co/json/', { timeout: 3000 });
              if (response.ok) {
                const data = await response.json();
                const countryCode = data.country_code;
                if (countryCode) {
                  detectedTier = getRegionTier(countryCode);
                }
              }
            } catch (ipError) {
              // Silently fail IP geolocation
            }
          }
          
        } catch (err) {
          // Silently fail region detection
        }
        
        let featuredPacks = [];
        
        try {
          // Fetch featured packs configuration
          const featuredPacksDoc = await getDoc(doc(db, 'settings', 'featuredPacks'));
          let featuredPackIds = [];
          
          if (featuredPacksDoc.exists()) {
            const featuredPacksData = featuredPacksDoc.data();
            featuredPackIds = featuredPacksData[detectedTier] || [];
          }
          
          // If no featured packs configured for this tier, fall back to order-based selection
          if (featuredPackIds.length === 0) {
            const packsCollection = collection(db, "packs");
            const packsSnapshot = await getDocs(packsCollection);
            let packsList = packsSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            
            // Sort by order field if it exists, otherwise just take the first 5
            packsList = packsList.sort((a, b) => {
              if (a.order !== undefined && b.order !== undefined) {
                return a.order - b.order;
              }
              return 0;
            }).slice(0, 5);
            
            featuredPacks = packsList;
          } else {
            // Fetch the specific featured packs
            const packsCollection = collection(db, "packs");
            const packsSnapshot = await getDocs(packsCollection);
            const allPacks = {};
            
            packsSnapshot.docs.forEach(doc => {
              allPacks[doc.id] = {
                id: doc.id,
                ...doc.data()
              };
            });
            
            // Get featured packs in the specified order
            featuredPacks = featuredPackIds
              .map(packId => allPacks[packId])
              .filter(pack => pack); // Remove any undefined packs
          }
          
          // Cache the results
          localStorage.setItem('outtabounds_featured_packs', JSON.stringify(featuredPacks));
          localStorage.setItem('outtabounds_featured_packs_timestamp', Date.now().toString());
          
          setPacks(featuredPacks);
          
        } catch (firestoreError) {
          console.error('Firestore error:', firestoreError);
          
          // Check if it's a quota exceeded error
          if (firestoreError.code === 'resource-exhausted') {
            setError("Our service is temporarily experiencing high traffic. Please try again in a few minutes.");
            
            // Try to load fallback data from cache if available (even if expired)
            const fallbackData = localStorage.getItem('outtabounds_featured_packs');
            if (fallbackData) {
              console.log('Loading fallback cached data due to quota exceeded');
              setPacks(JSON.parse(fallbackData));
            }
          } else {
            setError("Unable to load travel packs at the moment. Please try again later.");
          }
        }
        
      } catch (error) {
        console.error('General error fetching packs:', error);
        setError("Failed to fetch packs. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedPacks();
  }, []);

  return (
    <div className="home">
      <header className="hero" ref={heroRef}>
        <div className="hero-content" ref={heroContentRef}>
          <h1>Welcome to OuttaBounds Travel</h1>
          <p>Your gateway to unforgettable adventures and experiences.</p>
          <a href="#featured-packs" className="btn-primary" onClick={handleExploreClick}>Explore Now</a>
        </div>
      </header>

      {/* Featured Packs Section */}
      <section id="featured-packs" className="featured-packs-section">
        <div className="section-header">
          <h2>Best Packs</h2>
          <div className="subheader">
            <p>Made by us, for you</p>
          </div>
        </div>

        {error ? (
          <div className="error-message">
            <p>{error}</p>
            {packs.length === 0 && (
              <div className="fallback-content">
                <p>In the meantime, explore our travel destinations:</p>
                <div className="fallback-links">
                  <Link to={getLocalizedPath('/courses')} className="btn-secondary">Golf Courses</Link>
                  <Link to={getLocalizedPath('/experiences')} className="btn-secondary">Experiences</Link>
                  <Link to={getLocalizedPath('/houses')} className="btn-secondary">Accommodations</Link>
                </div>
              </div>
            )}
          </div>
        ) : loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading packs...</p>
          </div>
        ) : packs.length === 0 ? (
          <div className="no-packs-message">
            <p>No packs available. Please check back later.</p>
          </div>
        ) : (
          <div className="featured-packs">
            {packs.map((pack, index) => {
              const priceInfo = getPackPrice(pack, currentLocale);
              
              return (
                <div 
                  key={pack.id} 
                  className={`pack-card ${index === 1 ? 'pack-card-large' : ''}`}
                  onClick={() => {
                    const packIdentifier = pack.slug || pack.id;
                    window.location.href = getLocalizedPath(`/packs/${packIdentifier}`);
                  }}
                >
                  <div className="pack-image" style={{ backgroundImage: `url(${pack.imageUrl || 'https://via.placeholder.com/600x400?text=No+Image'})` }}>
                    <div className="pack-title-overlay">
                      <h3 className="pack-title">{pack.name}</h3>
                    </div>
                    <div className="pack-overlay">
                      <div className="pack-price">
                        <div className="price-amount">
                          <span className="currency">{priceInfo ? priceInfo.symbol : '€'}</span>
                          <span className="amount">{priceInfo ? priceInfo.amount : '---'}</span>
                        </div>
                        <div className="per-night">PER NIGHT</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        <div className="view-all-packs">
          <Link to={getLocalizedPath('/packs')} className="btn-secondary">View All Packs</Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
