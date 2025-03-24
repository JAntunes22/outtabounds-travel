import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/logo/logo.png';
import './Navbar.css';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [navbarBackground, setNavbarBackground] = useState(false);
  const [hamburgerMenuActive, setHamburgerMenuActive] = useState(false);
  const isMenuOpenRef = useRef(isMenuOpen);
  const menuRef = useRef(null); // Ref for the menu container

  const toggleMenu = () => {
    if (isMenuOpen) {
      // Delay the update of hamburgerMenuActive when closing
      setTimeout(() => {
        setHamburgerMenuActive(false);
      }, 300); // Match the CSS transition duration (0.3s)
      setIsMenuOpen(false);
      isMenuOpenRef.current = false;
      if (window.scrollY === 0) {
        setNavbarBackground(false);
      }
    } else {
      // Instantly update values when opening
      setIsMenuOpen(true);
      setHamburgerMenuActive(true);
      isMenuOpenRef.current = true;
      if (window.scrollY === 0) {
        setNavbarBackground(true);
      }
    }
  };

  const changeBackground = () => {
    if (window.scrollY > 0) {
      setNavbarBackground(true);
    } else if (!isMenuOpenRef.current) {
      setNavbarBackground(false);
    }
  };

  const handleClickOutside = (event) => {
    if (menuRef.current && !menuRef.current.contains(event.target)) {
      setTimeout(() => {
        setHamburgerMenuActive(false);
      }, 300); // Match the CSS transition duration (0.3s)
      setIsMenuOpen(false);
      isMenuOpenRef.current = false;
      if (window.scrollY === 0) {
        setNavbarBackground(false);
      }
    }
  };

  useEffect(() => {
    window.addEventListener('scroll', changeBackground);
    document.addEventListener('mousedown', handleClickOutside); // Add event listener for clicks outside
    return () => {
      window.removeEventListener('scroll', changeBackground);
      document.removeEventListener('mousedown', handleClickOutside); // Cleanup event listener
    };
  }, []);

  return (
    <nav className={`navbar ${navbarBackground ? 'navbar-scrolled' : ''}`}>
      <div ref={menuRef} className={`navbar-container ${hamburgerMenuActive ? 'menu-active' : ''}`}>
        {/* Logo and Text */}
        <div className="logo">
          <Link to="/">
            <img src={logo} alt="Outtabounds Logo" className="navbar-logo" />
            <span className="brand-text">Outtabounds</span>
          </Link>
        </div>

        {/* Navigation Links */}
        <ul className={`nav-menu ${isMenuOpen ? 'active' : ''}`}>
          <li className="nav-item">
            <Link to="/" className="nav-link">Home</Link>
          </li>
          <li className="nav-item">
            <Link to="/courses" className="nav-link">Courses</Link>
          </li>
          <li className="nav-item">
            <Link to="/experiences" className="nav-link">Experiences</Link>
          </li>
          <li className="nav-item">
            <Link to="/houses" className="nav-link">Houses</Link>
          </li>
          <li className="nav-item">
            <Link to="/about" className="nav-link">About</Link>
          </li>
          <li className="nav-item">
            <Link to="/contact" className="nav-link">Contact</Link>
          </li>
        </ul>

        {/* Hamburger Menu */}
        <button
          className={`hamburger ${hamburgerMenuActive ? 'active' : ''}`}
          onClick={toggleMenu}
          aria-label="Toggle navigation menu"
        >
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;