import React from 'react';
import { Link } from 'react-router-dom';
import './Auth.css';

export default function Unauthorized() {
  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Unauthorized Access</h2>
        <div className="auth-error">
          You do not have permission to access this page. This area is restricted to administrators only.
        </div>
        <p style={{ textAlign: 'center', marginTop: '20px' }}>
          Please contact the site administrator if you believe you should have access.
        </p>
        <div style={{ marginTop: '30px', textAlign: 'center' }}>
          <Link to="/" className="auth-button" style={{ display: 'inline-block', textDecoration: 'none', maxWidth: '200px' }}>
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
} 