import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Header.css';
import logo from '../assets/logo/logo.png';

export default function Header() {
  const { currentUser, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  // Handle scroll event to change navbar style
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Prevent body scrolling when menu is open
  useEffect(() => {
    const html = document.documentElement;
    
    if (menuOpen) {
      // Store current scroll position
      const scrollY = window.scrollY;
      sessionStorage.setItem('scrollPosition', scrollY);
      
      // Add classes to lock scrolling
      html.classList.add('scroll-locked');
      document.body.classList.add('menu-open');
      
      // Set the body's top position to negative scroll amount
      // This keeps the page visually in the same place
      document.body.style.top = `-${scrollY}px`;
    } else {
      // Remove classes to unlock scrolling
      html.classList.remove('scroll-locked');
      document.body.classList.remove('menu-open');
      
      // Get the stored scroll position
      const scrollY = sessionStorage.getItem('scrollPosition');
      if (scrollY) {
        // Reset the body's top position
        document.body.style.top = '';
        // Scroll back to the original position
        window.scrollTo(0, parseInt(scrollY));
        // Clear stored position
        sessionStorage.removeItem('scrollPosition');
      }
    }
    
    // Cleanup function
    return () => {
      html.classList.remove('scroll-locked');
      document.body.classList.remove('menu-open');
      document.body.style.top = '';
      
      const scrollY = sessionStorage.getItem('scrollPosition');
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY));
        sessionStorage.removeItem('scrollPosition');
      }
    };
  }, [menuOpen]);

  async function handleLogout() {
    try {
      await logout();
      navigate('/');
      setAccountMenuOpen(false);
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  }

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuOpen && !event.target.closest('.hamburger-menu') && 
          !event.target.closest('.mobile-menu')) {
        setMenuOpen(false);
      }
      
      if (accountMenuOpen && !event.target.closest('.account-icon') && 
          !event.target.closest('.account-menu')) {
        setAccountMenuOpen(false);
      }
      
      if (languageMenuOpen && !event.target.closest('.language-selector')) {
        setLanguageMenuOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen, accountMenuOpen, languageMenuOpen]);

  // Update toggleMenu to be more deliberate about scroll prevention
  const toggleMenu = (e) => {
    // Update menu state without causing scroll
    setMenuOpen(prevState => !prevState);
  };

  // Update hamburger menu click handler to be more specific about preventing default behavior
  const handleHamburgerClick = (e) => {
    // Prevent all default behaviors and stop event propagation
    if (e && e.preventDefault) e.preventDefault();
    if (e && e.stopPropagation) e.stopPropagation();
    
    // Save scroll position only when opening the menu
    if (!menuOpen && typeof window !== 'undefined') {
      sessionStorage.setItem('scrollPosition', window.scrollY);
    }
    
    // Use a callback to ensure we're working with the latest state
    setMenuOpen(prevState => !prevState);
    
    // Return false to prevent any other handlers
    return false;
  };

  // Handler for closing the menu
  const handleCloseMenu = (e) => {
    // Prevent default events
    if (e && e.preventDefault) e.preventDefault();
    if (e && e.stopPropagation) e.stopPropagation();
    
    // Close the menu
    setMenuOpen(false);
    
    // Return false to prevent any other handlers
    return false;
  };

  // Handler for mobile menu links
  const handleMenuLinkClick = () => {
    // Just close the menu without preventing default behavior
    // This ensures navigation happens but prevents scrolling to top
    setMenuOpen(false);
  };

  return (
    <header className={`site-header ${scrolled ? 'scrolled' : ''}`}>
      <div className="header-container">
        {/* Left side - Hamburger menu */}
        <div className="hamburger-menu" onClick={handleHamburgerClick}>
          <span></span>
          <span></span>
          <span></span>
        </div>
        
        {/* Center - Logo and brand name */}
        <div className="logo-container">
          <img src={logo} alt="OuttaBounds Logo" className="logo-image" />
          <Link to="/" className="brand-name">OuttaBounds</Link>
        </div>
        
        {/* Right side - Functionality icons */}
        <div className="header-icons">
          {/* Language selector */}
          <div className="language-selector">
            <button 
              className="language-button" 
              onClick={() => setLanguageMenuOpen(!languageMenuOpen)}
            >
              ENG
            </button>
            {languageMenuOpen && (
              <div className="language-dropdown">
                <button className="language-option active">English</button>
                <button className="language-option">Português</button>
              </div>
            )}
          </div>
          
          {/* Account icon */}
          <div className="account-icon-container">
            <button 
              className="account-icon" 
              onClick={() => setAccountMenuOpen(!accountMenuOpen)}
              aria-label="Account"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2"/>
                <path d="M4 20C4 17.6863 6.68629 16 9 16H15C17.3137 16 20 17.6863 20 20V20C20 20.5523 19.5523 21 19 21H5C4.44772 21 4 20.5523 4 20V20Z" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </button>
            
            {accountMenuOpen && (
              <div className="account-menu">
                {currentUser ? (
                  <>
                    <div className="account-menu-header">
                      <p className="user-greeting">Hello, {currentUser.displayName || 'User'}</p>
                    </div>
                    <div className="account-menu-items">
                      <Link 
                        to="/profile" 
                        className="account-menu-item"
                        onClick={() => setAccountMenuOpen(false)}
                      >
                        My Profile
                      </Link>
                      {isAdmin && (
                        <Link 
                          to="/admin" 
                          className="account-menu-item"
                          onClick={() => setAccountMenuOpen(false)}
                        >
                          Admin Dashboard
                        </Link>
                      )}
                      <button 
                        className="account-menu-item logout" 
                        onClick={handleLogout}
                      >
                        Log Out
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="account-menu-items">
                    <Link 
                      to="/login" 
                      className="account-menu-item"
                      onClick={() => setAccountMenuOpen(false)}
                    >
                      Log In
                    </Link>
                    <Link 
                      to="/signup" 
                      className="account-menu-item"
                      onClick={() => setAccountMenuOpen(false)}
                    >
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Cart icon */}
          <Link to="/custom-pack" className="cart-icon" aria-label="Custom Pack">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 6H5H21L19 17H5L3 6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 21C8.55228 21 9 20.5523 9 20C9 19.4477 8.55228 19 8 19C7.44772 19 7 19.4477 7 20C7 20.5523 7.44772 21 8 21Z" stroke="currentColor" strokeWidth="2"/>
              <path d="M16 21C16.5523 21 17 20.5523 17 20C17 19.4477 16.5523 19 16 19C15.4477 19 15 19.4477 15 20C15 20.5523 15.4477 21 16 21Z" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </Link>
        </div>
      </div>
      
      {/* Mobile menu backdrop */}
      <div 
        className={`mobile-menu-backdrop ${menuOpen ? 'visible' : ''}`}
        onClick={handleCloseMenu}
      ></div>
      
      {/* Mobile menu - shown when hamburger is clicked */}
      <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
        <button className="mobile-menu-close" onClick={handleCloseMenu}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <nav className="main-nav-mobile">
          <ul>
            <li>
              <Link 
                to="/" 
                onClick={handleMenuLinkClick}
              >
                Home
              </Link>
            </li>
            <li>
              <Link 
                to="/courses" 
                onClick={handleMenuLinkClick}
              >
                Courses
              </Link>
            </li>
            <li>
              <Link 
                to="/experiences" 
                onClick={handleMenuLinkClick}
              >
                Experiences
              </Link>
            </li>
            <li>
              <Link 
                to="/houses" 
                onClick={handleMenuLinkClick}
              >
                Houses
              </Link>
            </li>
            <li>
              <Link 
                to="/about" 
                onClick={handleMenuLinkClick}
              >
                About
              </Link>
            </li>
            <li>
              <Link 
                to="/contact" 
                onClick={handleMenuLinkClick}
              >
                Contact
              </Link>
            </li>
          </ul>
          
          {/* Mobile-only items */}
          <div className="mobile-only-menu">
            <h3>Settings</h3>
            <div className="mobile-language-selector">
              <p>Language</p>
              <div className="mobile-language-options">
                <button className="language-option active">English</button>
                <button className="language-option">Português</button>
              </div>
            </div>
            
            {!currentUser && (
              <div className="mobile-auth-links">
                <Link 
                  to="/login" 
                  className="mobile-auth-link"
                  onClick={handleMenuLinkClick}
                >
                  Log In
                </Link>
                <Link 
                  to="/signup" 
                  className="mobile-auth-link"
                  onClick={handleMenuLinkClick}
                >
                  Sign Up
                </Link>
              </div>
            )}
            
            {currentUser && (
              <div className="mobile-account-section">
                <h3>My Account</h3>
                <Link 
                  to="/profile" 
                  className="mobile-account-link"
                  onClick={handleMenuLinkClick}
                >
                  Profile
                </Link>
                {isAdmin && (
                  <Link 
                    to="/admin" 
                    className="mobile-account-link"
                    onClick={handleMenuLinkClick}
                  >
                    Admin Dashboard
                  </Link>
                )}
                <button 
                  className="mobile-logout-button"
                  onClick={(e) => {
                    e.preventDefault();
                    handleLogout();
                    setMenuOpen(false);
                  }}
                >
                  Log Out
                </button>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
} 