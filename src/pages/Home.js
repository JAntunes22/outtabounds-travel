import React, { useEffect, useRef } from "react";
import "./Home.css"; // Ensure you create and style this CSS file

const Home = () => {
  const heroContentRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      if (heroContentRef.current) {
        // Calculate how far down the page we've scrolled
        const scrollPos = window.scrollY;
        // Apply a parallax effect to the hero content
        // Move it up slightly as we scroll down
        if (scrollPos < window.innerHeight) {
          const translateY = scrollPos * 0.4; // Adjust this value to control effect intensity
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
      <header className="hero">
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
