import React, { useState, useEffect } from 'react';
import { db } from '../../utils/firebaseConfig';
import { collection, query, getDocs } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { useLocale } from '../../contexts/LocaleContext';
import './Admin.css';

export default function AdminHome() {
  const { getLocalizedPath } = useLocale();
  const [stats, setStats] = useState({
    courses: 0,
    experiences: 0,
    accommodations: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      setError(null);
      
      try {
        console.log("Fetching collection statistics...");
        // Fetch counts from each collection
        const collections = ['courses', 'experiences', 'accommodations'];
        const counts = {
          courses: 0,
          experiences: 0,
          accommodations: 0
        };
        
        for (const collName of collections) {
          console.log(`Fetching ${collName} count...`);
          try {
            const q = query(collection(db, collName));
            const snapshot = await getDocs(q);
            counts[collName] = snapshot.size;
            console.log(`Found ${snapshot.size} ${collName}`);
          } catch (collError) {
            console.error(`Error fetching ${collName}:`, collError);
            // Continue with other collections even if one fails
          }
        }
        
        console.log("Final counts:", counts);
        setStats(counts);
      } catch (error) {
        console.error("Error fetching stats:", error);
        setError("Failed to load dashboard statistics. Please try refreshing the page.");
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
      ) : error ? (
        <div className="error-message" style={{ textAlign: 'center', padding: '20px', color: 'red' }}>
          {error}
          <button 
            onClick={() => window.location.reload()}
            style={{ display: 'block', margin: '10px auto', padding: '8px 16px' }}
          >
            Refresh
          </button>
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
              <Link to={getLocalizedPath('/admin/courses')} className="stat-link">Manage Courses</Link>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: '#fff8e1' }}>
                🗺️
              </div>
              <div className="stat-content">
                <h3>{stats.experiences}</h3>
                <p>Experiences</p>
              </div>
              <Link to={getLocalizedPath('/admin/experiences')} className="stat-link">Manage Experiences</Link>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: '#e8f5e9' }}>
                🏠
              </div>
              <div className="stat-content">
                <h3>{stats.accommodations}</h3>
                <p>Accommodations</p>
              </div>
              <Link to={getLocalizedPath('/admin/accommodations')} className="stat-link">Manage Accommodations</Link>
            </div>
          </div>
          
          <div className="quick-actions">
            <h2>Quick Actions</h2>
            <div className="actions-grid">
              <Link to={getLocalizedPath('/admin/courses/new')} className="action-card">
                <div className="action-icon">➕</div>
                <div className="action-title">Add New Course</div>
              </Link>
              
              <Link to={getLocalizedPath('/admin/experiences/new')} className="action-card">
                <div className="action-icon">➕</div>
                <div className="action-title">Add New Experience</div>
              </Link>
              
              <Link to={getLocalizedPath('/admin/accommodations/new')} className="action-card">
                <div className="action-icon">➕</div>
                <div className="action-title">Add New Accommodation</div>
              </Link>
              
              <Link to={getLocalizedPath('/admin/settings')} className="action-card">
                <div className="action-icon">⚙️</div>
                <div className="action-title">Settings</div>
              </Link>
            </div>
          </div>

          <div className="admin-utilities">
            <h2>Maintenance Utilities</h2>
            <div className="admin-utility-buttons">
              <button
                className="admin-utility-btn"
                onClick={async () => {
                  try {
                    const { migrateExperienceImageUrls } = await import('../../utils/migrationUtils');
                    if (window.confirm('This will update all experiences with imageUrl to use url instead. Continue?')) {
                      const result = await migrateExperienceImageUrls();
                      alert(`Migration complete.\n\nTotal Experiences: ${result.totalExperiences}\nUpdated: ${result.updatedCount}\nAlready correct: ${result.alreadyCorrect}`);
                    }
                  } catch (error) {
                    console.error("Migration failed:", error);
                    alert(`Migration failed: ${error.message}`);
                  }
                }}
              >
                Migrate Experience Images
              </button>
            </div>
            <p className="admin-help-text">Use these utilities for maintenance tasks. Run only when needed.</p>
          </div>
        </>
      )}
    </div>
  );
} 