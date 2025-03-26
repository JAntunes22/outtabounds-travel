import React, { useEffect, useState } from "react";
import { fetchCourses } from "../utils/firebaseUtils";
import Footer from "../components/Footer";
import './Courses.css';

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState(null); // Add error state

  useEffect(() => {
    const getCourses = async () => {
      try {
        const fetchedCourses = await fetchCourses();
        setCourses(fetchedCourses);
      } catch (err) {
        console.error("Error fetching courses:", err);
        setError("Failed to fetch courses. Please try again later.");
      }
    };
    getCourses();
  }, []);

  return (
    <div className="courses">
      <header className="hero-courses">
        <div className="hero-courses-content">
          <h1>Our Golf Courses</h1>
          <p>Explore the best golf courses curated just for you.</p>
        </div>
      </header>
      {error ? (
        <p className="error-message">{error}</p>
      ) : (
        <div className="course-list">
          {courses.map((course) => (
            <div key={course.id} className="course-item">
              <img src={course.url} alt={course.name} />
              <div className="course-content">
                <h2>{course.name}</h2>
                <h3>{course.location}</h3>
                <p>{course.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      <Footer />
    </div>
  );
};

export default Courses;
