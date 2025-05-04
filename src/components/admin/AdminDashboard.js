import React, { useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Admin.css';

export default function AdminDashboard() {
  const { currentUser } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

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
              <Link to="/admin/courses" className="nav-link">
                <i className="icon">🏌️</i>
                <span>Courses</span>
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