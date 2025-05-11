import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../utils/firebaseConfig";
import "./Home.css"; // Ensure you create and style this CSS file

const Home = () => {
  const heroContentRef = useRef(null);
  const heroRef = useRef(null);
  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
    const fetchPacks = async () => {
      setLoading(true);
      try {
        // Use the same approach as the Packs page but with ordering and limit
        const packsCollection = collection(db, "packs");
        // First get all packs to make sure we have data
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
        }).slice(0, 5); // Limit to 5 packs for the homepage
        
        console.log("Fetched packs:", packsList);
        setPacks(packsList);
      } catch (error) {
        console.error("Error fetching packs:", error);
        setError("Failed to fetch packs. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchPacks();
  }, []);

  return (
    <div className="home">
      <header className="hero" ref={heroRef}>
        <div className="hero-content" ref={heroContentRef}>
          <h1>Welcome to OuttaBounds Travel</h1>
          <p>Your gateway to unforgettable adventures and experiences.</p>
          <a href="#explore" className="btn-primary">Explore Now</a>
        </div>
      </header>
      <section id="explore" className="explore-section">
        <h2>Discover Our Offerings</h2>
        <div className="offerings">
          <div className="offering">
            <h3>Courses</h3>
            <p>Enhance your skills with our curated travel courses.</p>
          </div>
          <div className="offering">
            <h3>Experiences</h3>
            <p>Immerse yourself in unique and memorable experiences.</p>
          </div>
          <div className="offering">
            <h3>Houses</h3>
            <p>Find the perfect place to stay during your journey.</p>
          </div>
        </div>
      </section>

      {/* Featured Packs Section */}
      <section className="featured-packs-section">
        <div className="section-header">
          <h2>Best Packs</h2>
          <div className="subheader">
            <p>Made by us, for you</p>
            <p className="customize-note">*all packs are customizable</p>
          </div>
        </div>

        {error ? (
          <div className="error-message">{error}</div>
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
            {packs.map((pack, index) => (
              <div 
                key={pack.id} 
                className={`pack-card ${index === 1 ? 'pack-card-large' : ''}`}
                onClick={() => window.location.href = `/packs/${pack.id}`}
              >
                <div className="pack-image" style={{ backgroundImage: `url(${pack.imageUrl || 'https://via.placeholder.com/600x400?text=No+Image'})` }}>
                  <div className="pack-title-overlay">
                    <h3 className="pack-title">{pack.name}</h3>
                  </div>
                  <div className="pack-overlay">
                    <div className="pack-price">
                      <div className="price-amount">
                        <span className="currency">€</span>
                        <span className="amount">{pack.price || '---'}</span>
                      </div>
                      <div className="per-night">PER NIGHT</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="view-all-packs">
          <Link to="/packs" className="btn-secondary">View All Packs</Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
