import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLocale } from '../../contexts/LocaleContext';
import './Auth.css';

export default function Signup() {
  const { getLocalizedPath } = useLocale();
  const nameRef = useRef();
  const emailRef = useRef();
  const passwordRef = useRef();
  const passwordConfirmRef = useRef();
  const { signup, signInWithGoogle, signInWithApple } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const authCardRef = useRef(null);

  // Add a subtle parallax effect on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (authCardRef.current) {
        const scrollPos = window.scrollY;
        // Very subtle movement for the card
        if (scrollPos < window.innerHeight) {
          const scale = 1 + (scrollPos * 0.0002); // Very small scale change
          authCardRef.current.style.transform = `scale(${scale})`;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();

    if (passwordRef.current.value !== passwordConfirmRef.current.value) {
      return setError('Passwords do not match');
    }

    try {
      setError('');
      setLoading(true);
      
      console.log("Signup: Starting email signup process");
      const user = await signup(
        emailRef.current.value, 
        passwordRef.current.value,
        nameRef.current.value
      );
      
      console.log("Signup: Successfully created account, redirecting to home");
      navigate(getLocalizedPath('/'));
    } catch (error) {
      console.error("Signup: Error during account creation:", error);
      setError('Failed to create an account: ' + error.message);
      setLoading(false);
    }
  }

  async function handleGoogleSignup() {
    try {
      setError('');
      setLoading(true);
      const result = await signInWithGoogle();
      
      if (result.isNewUser) {
        // Redirect to profile completion page for new users
        // Include a flag in state to indicate this is from social login
        navigate(getLocalizedPath('/profile-completion'), { 
          state: { fromSocialLogin: true } 
        });
      } else {
        // Redirect to homepage for existing users
        navigate(getLocalizedPath('/'));
      }
    } catch (error) {
      setError('Failed to sign up with Google: ' + error.message);
    }
    setLoading(false);
  }

  async function handleAppleSignup() {
    try {
      setError('');
      setLoading(true);
      const result = await signInWithApple();
      
      if (result.isNewUser) {
        // Redirect to profile completion page for new users
        // Include a flag in state to indicate this is from social login
        navigate(getLocalizedPath('/profile-completion'), { 
          state: { fromSocialLogin: true } 
        });
      } else {
        // Redirect to homepage for existing users
        navigate(getLocalizedPath('/'));
      }
    } catch (error) {
      setError('Failed to sign up with Apple: ' + error.message);
    }
    setLoading(false);
  }

  return (
    <div className="auth-container">
      <div className="auth-card" ref={authCardRef}>
        <h2>Sign Up</h2>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input type="text" ref={nameRef} required />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" ref={emailRef} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" ref={passwordRef} required />
          </div>
          <div className="form-group">
            <label>Confirm Password</label>
            <input type="password" ref={passwordConfirmRef} required />
          </div>
          <button disabled={loading} type="submit" className="auth-button">
            Sign Up
          </button>
        </form>

        <div className="auth-divider">
          <span>OR</span>
        </div>

        <div className="social-auth-buttons">
          <button 
            disabled={loading} 
            onClick={handleGoogleSignup} 
            className="social-auth-button google-auth-button"
          >
            Continue with Google
          </button>
          <button 
            disabled={loading} 
            onClick={handleAppleSignup} 
            className="social-auth-button apple-auth-button"
          >
            Continue with Apple
          </button>
        </div>

        <div className="auth-footer">
          Already have an account? <Link to={getLocalizedPath('/login')}>Log In</Link>
        </div>
      </div>
    </div>
  );
} 