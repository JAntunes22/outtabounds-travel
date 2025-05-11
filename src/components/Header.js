import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Header.css';
import logo from '../assets/logo/logo.png';

export default function Header() {
  const { currentUser, isAdmin, logout, userFullname } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [backdropVisible, setBackdropVisible] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const backdropRef = useRef(null);
  
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

  // This effect only runs on component unmount as a safety cleanup
  useEffect(() => {
    return () => {
      // Safety cleanup in case component unmounts with locked scroll
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY.replace('-', '').replace('px', '')));
      }
    };
  }, []);
  
  // Use a separate effect to directly control the backdrop element when its state changes
  // useLayoutEffect runs synchronously before the browser paints
  useLayoutEffect(() => {
    if (backdropRef.current) {
      if (backdropVisible) {
        backdropRef.current.style.opacity = '1';
        backdropRef.current.style.visibility = 'visible';
        backdropRef.current.style.pointerEvents = 'auto';
      } else {
        backdropRef.current.style.opacity = '0';
        backdropRef.current.style.visibility = 'hidden';
        backdropRef.current.style.pointerEvents = 'none';
      }
    }
  }, [backdropVisible]);

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
        handleCloseMenu(event);
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

  // Handle hamburger menu click - completely redesigned approach
  const handleHamburgerClick = (e) => {
    // Prevent all default behaviors and stop event propagation
    if (e && e.preventDefault) e.preventDefault();
    if (e && e.stopPropagation) e.stopPropagation();
    
    if (!menuOpen) {
      // Lock scroll position first to prevent any layout shifts
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      
      // Make the backdrop visible immediately
      // First directly modify DOM to avoid any React rendering delays
      if (backdropRef.current) {
        backdropRef.current.style.opacity = '1';
        backdropRef.current.style.visibility = 'visible';
        backdropRef.current.style.pointerEvents = 'auto';
      }
      
      // Then update state to keep React in sync
      setBackdropVisible(true);
      
      // After the backdrop is shown, open the menu
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setMenuOpen(true);
        });
      });
    } else {
      // When closing, hide menu first then backdrop
      setMenuOpen(false);
      setTimeout(() => {
        // Update React state
        setBackdropVisible(false);
        
        // Directly modify DOM for immediate effect
        if (backdropRef.current) {
          backdropRef.current.style.opacity = '0';
          backdropRef.current.style.visibility = 'hidden';
          backdropRef.current.style.pointerEvents = 'none';
        }
        
        // Only unlock scrolling after both menu and backdrop are hidden
        const scrollY = document.body.style.top;
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        
        if (scrollY) {
          window.scrollTo(0, parseInt(scrollY.replace('-', '').replace('px', '')));
        }
      }, 300); // Wait for menu animation to complete
    }
    
    // Return false to prevent any other handlers
    return false;
  };

  // Handler for closing the menu
  const handleCloseMenu = (e) => {
    // Prevent default events
    if (e && e.preventDefault) e.preventDefault();
    if (e && e.stopPropagation) e.stopPropagation();
    
    // First close the menu
    setMenuOpen(false);
    
    // Then after the menu animation completes, hide the backdrop and restore scroll
    setTimeout(() => {
      // Update React state
      setBackdropVisible(false);
      
      // Directly modify DOM for immediate effect
      if (backdropRef.current) {
        backdropRef.current.style.opacity = '0';
        backdropRef.current.style.visibility = 'hidden';
        backdropRef.current.style.pointerEvents = 'none';
      }
      
      // Restore scrolling only after both menu and backdrop are hidden
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY.replace('-', '').replace('px', '')));
      }
    }, 300);
    
    // Return false to prevent any other handlers
    return false;
  };

  // Handler for mobile menu links
  const handleMenuLinkClick = () => {
    // Just close the menu
    handleCloseMenu({});
  };

  return (
    <header className={`site-header ${scrolled ? 'scrolled' : ''}`}>
      <div className="header-container">
        {/* Left side - Hamburger menu */}
        <div className={`hamburger-menu ${menuOpen ? 'open' : ''}`} onClick={handleHamburgerClick}>
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
              onClick={() => currentUser ? setAccountMenuOpen(!accountMenuOpen) : navigate('/login')}
              aria-label="Account"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2"/>
                <path d="M4 20C4 17.6863 6.68629 16 9 16H15C17.3137 16 20 17.6863 20 20V20C20 20.5523 19.5523 21 19 21H5C4.44772 21 4 20.5523 4 20V20Z" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </button>
            
            {accountMenuOpen && currentUser && (
              <div className="account-menu">
                <div className="account-menu-header">
                  <p className="user-greeting">Hello, {(userFullname || currentUser.displayName || 'User').split(' ')[0]}</p>
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
              </div>
            )}
          </div>
          
          {/* Cart icon - Changed to a minimalist shopping bag */}
          <Link to="/your-pack" className="cart-icon" aria-label="Your Pack">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 2L3 6V20C3 20.5304 3.21071 21.0391 3.58579 21.4142C3.96086 21.7893 4.46957 22 5 22H19C19.5304 22 20.0391 21.7893 20.4142 21.4142C20.7893 21.0391 21 20.5304 21 20V6L18 2H6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3 6H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 10C16 11.0609 15.5786 12.0783 14.8284 12.8284C14.0783 13.5786 13.0609 14 12 14C10.9391 14 9.92172 13.5786 9.17157 12.8284C8.42143 12.0783 8 11.0609 8 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        </div>
      </div>
      
      {/* Mobile menu backdrop - now with ref to directly manipulate DOM */}
      <div 
        ref={backdropRef}
        className="mobile-menu-backdrop"
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
                to="/packs" 
                onClick={handleMenuLinkClick}
              >
                Packs
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
                  Account
                </Link>
              </div>
            )}
            
            {currentUser && (
              <div className="mobile-account-section">
                <h3>My Account</h3>
                <div className="mobile-user-info">
                  <p className="mobile-greeting">Hello, {(userFullname || currentUser.displayName || 'User').split(' ')[0]}</p>
                </div>
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
                  className="mobile-account-link logout" 
                  onClick={() => {
                    handleLogout();
                    handleMenuLinkClick();
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