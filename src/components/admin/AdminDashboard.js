import React, { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Admin.css';

export default function AdminDashboard() {
  const { currentUser, isAdmin, refreshAdminStatus } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    async function verifyAdmin() {
      setLoading(true);
      try {
        console.log("AdminDashboard - Verifying admin status");
        const adminStatus = await refreshAdminStatus();
        console.log("Admin status result:", adminStatus);
        
        if (!adminStatus) {
          console.error("Not an admin, redirecting to unauthorized");
          navigate("/unauthorized");
        }
      } catch (error) {
        console.error("Error verifying admin status:", error);
        navigate("/unauthorized");
      } finally {
        setLoading(false);
      }
    }
    
    verifyAdmin();
  }, [refreshAdminStatus, navigate]);
  
  if (loading) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
        <p>Verifying admin access...</p>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className={`admin-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h2>Admin Panel</h2>
          <button 
            className="sidebar-toggle" 
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? '←' : '→'}
          </button>
        </div>
        
        <div className="sidebar-user">
          <div className="avatar">
            {currentUser?.displayName?.charAt(0) || 'A'}
          </div>
          <div className="user-info">
            <span>{currentUser?.displayName || 'Admin User'}</span>
            <small>{currentUser?.email}</small>
            <span className="admin-badge">Admin</span>
          </div>
        </div>
        
        <nav className="sidebar-nav">
          <ul>
            <li>
              <Link to="/admin" className="nav-link" end>
                <i className="icon">📊</i>
                <span>Dashboard</span>
              </Link>
            </li>
            <li>
              <Link to="/admin/users" className="nav-link">
                <i className="icon">👥</i>
                <span>Users</span>
              </Link>
            </li>
            <li>
              <Link to="/admin/inquiries" className="nav-link">
                <i className="icon">📨</i>
                <span>Inquiries</span>
              </Link>
            </li>
            <li>
              <Link to="/admin/courses" className="nav-link">
                <i className="icon">🏌️</i>
                <span>Courses</span>
              </Link>
            </li>
            <li>
              <Link to="/admin/packs" className="nav-link">
                <i className="icon">📦</i>
                <span>Packs</span>
              </Link>
            </li>
            <li>
              <Link to="/admin/experiences" className="nav-link">
                <i className="icon">🗺️</i>
                <span>Experiences</span>
              </Link>
            </li>
            <li>
              <Link to="/admin/accommodations" className="nav-link">
                <i className="icon">🏠</i>
                <span>Accommodations</span>
              </Link>
            </li>
            <li>
              <Link to="/admin/settings" className="nav-link">
                <i className="icon">⚙️</i>
                <span>Settings</span>
              </Link>
            </li>
          </ul>
        </nav>
      </div>
      
      <div className="admin-content">
        <Outlet />
      </div>
    </div>
  );
} 