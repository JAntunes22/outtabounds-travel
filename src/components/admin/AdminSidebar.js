import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function AdminSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { currentUser } = useAuth();
  const location = useLocation();

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className={`admin-sidebar ${isCollapsed ? 'closed' : ''}`}>
      <div className="sidebar-header">
        <h2>Admin Panel</h2>
        <button className="sidebar-toggle" onClick={toggleSidebar}>
          {isCollapsed ? '→' : '←'}
        </button>
      </div>

      <div className="sidebar-user">
        <div className="avatar">
          {getInitials(currentUser?.displayName)}
        </div>
        <div className="user-info">
          <span>{currentUser?.displayName || 'Admin User'}</span>
          <small>{currentUser?.email}</small>
        </div>
      </div>

      <nav className="sidebar-nav">
        <ul>
          <li>
            <Link 
              to="/admin" 
              className={`nav-link ${isActive('/admin') && location.pathname === '/admin' ? 'active' : ''}`}
            >
              <span className="icon">📊</span>
              <span>Dashboard</span>
            </Link>
          </li>
          <li>
            <Link 
              to="/admin/courses" 
              className={`nav-link ${isActive('/admin/courses') ? 'active' : ''}`}
            >
              <span className="icon">🏌️</span>
              <span>Golf Courses</span>
            </Link>
          </li>
          <li>
            <Link 
              to="/admin/experiences" 
              className={`nav-link ${isActive('/admin/experiences') ? 'active' : ''}`}
            >
              <span className="icon">🗺️</span>
              <span>Experiences</span>
            </Link>
          </li>
          <li>
            <Link 
              to="/admin/accommodations" 
              className={`nav-link ${isActive('/admin/accommodations') ? 'active' : ''}`}
            >
              <span className="icon">🏠</span>
              <span>Accommodations</span>
            </Link>
          </li>
          <li>
            <Link 
              to="/admin/services" 
              className={`nav-link ${isActive('/admin/services') ? 'active' : ''}`}
            >
              <span className="icon">🛎️</span>
              <span>Services</span>
            </Link>
          </li>
          <li>
            <Link 
              to="/admin/packs" 
              className={`nav-link ${isActive('/admin/packs') ? 'active' : ''}`}
            >
              <span className="icon">📦</span>
              <span>Packs</span>
            </Link>
          </li>
          <li>
            <Link 
              to="/admin/users" 
              className={`nav-link ${isActive('/admin/users') ? 'active' : ''}`}
            >
              <span className="icon">👥</span>
              <span>Users</span>
            </Link>
          </li>
          <li>
            <Link 
              to="/admin/inquiries" 
              className={`nav-link ${isActive('/admin/inquiries') ? 'active' : ''}`}
            >
              <span className="icon">📧</span>
              <span>Inquiries</span>
            </Link>
          </li>
          <li>
            <Link 
              to="/admin/settings" 
              className={`nav-link ${isActive('/admin/settings') ? 'active' : ''}`}
            >
              <span className="icon">⚙️</span>
              <span>Settings</span>
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
} 