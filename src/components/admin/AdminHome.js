import React, { useState, useEffect } from 'react';
import { db } from '../../utils/firebaseConfig';
import { collection, query, getDocs } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import './Admin.css';

export default function AdminHome() {
  const [stats, setStats] = useState({
    courses: 0,
    experiences: 0,
    accommodations: 0
  });
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        // Fetch counts from each collection
        const collections = ['courses', 'experiences', 'accommodations'];
        const counts = {};
        
        for (const collName of collections) {
          const q = query(collection(db, collName));
          const snapshot = await getDocs(q);
          counts[collName] = snapshot.size;
        }
        
        setStats(counts);
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchStats();
  }, []);

  return (
    <div>
      <div className="admin-header">
        <h1 className="admin-title">Admin Dashboard</h1>
      </div>
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          Loading stats...
        </div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: '#e3f2fd' }}>
                🏌️
              </div>
              <div className="stat-content">
                <h3>{stats.courses}</h3>
                <p>Golf Courses</p>
              </div>
              <Link to="/admin/courses" className="stat-link">Manage Courses</Link>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: '#fff8e1' }}>
                🗺️
              </div>
              <div className="stat-content">
                <h3>{stats.experiences}</h3>
                <p>Experiences</p>
              </div>
              <Link to="/admin/experiences" className="stat-link">Manage Experiences</Link>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: '#e8f5e9' }}>
                🏠
              </div>
              <div className="stat-content">
                <h3>{stats.accommodations}</h3>
                <p>Accommodations</p>
              </div>
              <Link to="/admin/accommodations" className="stat-link">Manage Accommodations</Link>
            </div>
          </div>
          
          <div className="quick-actions">
            <h2>Quick Actions</h2>
            <div className="actions-grid">
              <Link to="/admin/courses/new" className="action-card">
                <div className="action-icon">➕</div>
                <div className="action-title">Add New Course</div>
              </Link>
              
              <Link to="/admin/experiences/new" className="action-card">
                <div className="action-icon">➕</div>
                <div className="action-title">Add New Experience</div>
              </Link>
              
              <Link to="/admin/accommodations/new" className="action-card">
                <div className="action-icon">➕</div>
                <div className="action-title">Add New Accommodation</div>
              </Link>
              
              <Link to="/admin/settings" className="action-card">
                <div className="action-icon">⚙️</div>
                <div className="action-title">Settings</div>
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
} 