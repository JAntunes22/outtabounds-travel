import React from "react";
import Footer from "../components/Footer";
import "./Home.css"; // Ensure you create and style this CSS file

const Home = () => {
  return (
    <div className="home">
      <header className="hero">
        <div className="hero-content">
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
      <Footer /> {/* Add Footer */}
    </div>
  );
};

export default Home;
