import React, { useEffect, useState } from "react";
import { fetchCourses } from "../utils/firebaseUtils";

const Courses = () => {
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    const getCourses = async () => {
      const fetchedCourses = await fetchCourses();
      setCourses(fetchedCourses);
    };
    getCourses();
  }, []);

  return (
    <div className="courses">
      <h1>Our Courses</h1>
      <div className="course-list">
        {courses.map((course) => (
          <div key={course.id} className="course-item">
            <img src={course.image} alt={course.title} />
            <h2>{course.name}</h2>
            <h3>{course.location}</h3>
            <p>{course.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Courses;
