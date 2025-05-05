import React, { useEffect, useRef } from "react";
import "./Home.css"; // Ensure you create and style this CSS file

const Home = () => {
  const heroContentRef = useRef(null);
  const heroRef = useRef(null);

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
    </div>
  );
};

export default Home;
