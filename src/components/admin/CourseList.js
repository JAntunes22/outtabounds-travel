import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { db } from '../../utils/firebaseConfig';
import { 
  collection, 
  query, 
  getDocs, 
  doc, 
  deleteDoc 
} from 'firebase/firestore';
import './Admin.css';

export default function CourseList() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    fetchCourses();
  }, []);
  
  async function fetchCourses() {
    setLoading(true);
    try {
      const coursesRef = collection(db, 'courses');
      const q = query(coursesRef);
      const querySnapshot = await getDocs(q);
      
      const courseList = [];
      querySnapshot.forEach((doc) => {
        courseList.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setCourses(courseList);
    } catch (error) {
      console.error("Error fetching courses:", error);
    } finally {
      setLoading(false);
    }
  }
  
  function handleEditCourse(courseId) {
    navigate(`/admin/courses/edit/${courseId}`);
  }
  
  function confirmDelete(course) {
    setCourseToDelete(course);
    setShowDeleteModal(true);
  }
  
  async function deleteCourse() {
    if (!courseToDelete) return;
    
    try {
      await deleteDoc(doc(db, 'courses', courseToDelete.id));
      setCourses(courses.filter(course => course.id !== courseToDelete.id));
      setShowDeleteModal(false);
      setCourseToDelete(null);
    } catch (error) {
      console.error("Error deleting course:", error);
    }
  }

  return (
    <div>
      <div className="admin-header">
        <h1 className="admin-title">Manage Courses</h1>
        <Link to="/admin/courses/new" className="admin-action-btn">
          <span>+</span> Add New Course
        </Link>
      </div>
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          Loading courses...
        </div>
      ) : (
        <div className="admin-table-container">
          {courses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px' }}>
              <p>No courses found. Add your first course to get started.</p>
              <Link to="/admin/courses/new" className="admin-action-btn" style={{ display: 'inline-block', marginTop: '15px' }}>
                Add New Course
              </Link>
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Location</th>
                  <th>Position</th>
                  <th>Rating</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {courses.map(course => (
                  <tr key={course.id}>
                    <td>{course.name}</td>
                    <td>{course.location}</td>
                    <td>{course.position || 'Not set'}</td>
                    <td>{course.rating || 'N/A'}</td>
                    <td>
                      <div className="table-actions">
                        <button 
                          className="action-btn edit" 
                          onClick={() => handleEditCourse(course.id)}
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button 
                          className="action-btn delete" 
                          onClick={() => confirmDelete(course)}
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
      
      {showDeleteModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="modal-header">
              <h3>Confirm Delete</h3>
              <button className="modal-close" onClick={() => setShowDeleteModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete <strong>{courseToDelete?.name}</strong>?</p>
              <p>This action cannot be undone.</p>
            </div>
            <div className="modal-actions">
              <button 
                className="admin-action-btn cancel-btn" 
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button 
                className="admin-action-btn" 
                style={{ backgroundColor: '#f44336' }}
                onClick={deleteCourse}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 