import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Auth.css';

export default function Login() {
  const emailRef = useRef();
  const passwordRef = useRef();
  const { login, signInWithGoogle, signInWithApple } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
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

  // Redirect to intended page or homepage after login
  const from = location.state?.from?.pathname || '/';

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setError('');
      setLoading(true);
      await login(emailRef.current.value, passwordRef.current.value);
      navigate(from, { replace: true });
    } catch (error) {
      setError('Failed to log in: ' + error.message);
    }

    setLoading(false);
  }

  async function handleGoogleLogin() {
    try {
      setError('');
      setLoading(true);
      console.log("Starting Google sign-in process");
      const result = await signInWithGoogle();
      console.log("Google sign-in result:", result);
      
      if (result.isNewUser) {
        console.log("New user detected, redirecting to profile completion");
        // Redirect to profile completion page for new users
        // Include a flag in state to indicate this is from social login
        navigate('/profile-completion', { 
          state: { fromSocialLogin: true } 
        });
      } else {
        console.log("Existing user detected, redirecting to:", from);
        // Redirect to intended page for existing users
        navigate(from, { replace: true });
      }
    } catch (error) {
      console.error("Google sign-in error:", error);
      setError('Failed to log in with Google: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAppleLogin() {
    try {
      setError('');
      setLoading(true);
      console.log("Starting Apple sign-in process");
      const result = await signInWithApple();
      console.log("Apple sign-in result:", result);
      
      if (result.isNewUser) {
        console.log("New user detected, redirecting to profile completion");
        // Redirect to profile completion page for new users
        // Include a flag in state to indicate this is from social login
        navigate('/profile-completion', { 
          state: { fromSocialLogin: true } 
        });
      } else {
        console.log("Existing user detected, redirecting to:", from);
        // Redirect to intended page for existing users
        navigate(from, { replace: true });
      }
    } catch (error) {
      console.error("Apple sign-in error:", error);
      setError('Failed to log in with Apple: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card" ref={authCardRef}>
        <h2>Log In</h2>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input type="email" ref={emailRef} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" ref={passwordRef} required />
          </div>
          <button disabled={loading} type="submit" className="auth-button">
            Log In
          </button>
        </form>

        <div className="auth-divider">
          <span>OR</span>
        </div>

        <div className="social-auth-buttons">
          <button 
            disabled={loading} 
            onClick={handleGoogleLogin} 
            className="social-auth-button google-auth-button"
          >
            Continue with Google
          </button>
          <button 
            disabled={loading} 
            onClick={handleAppleLogin} 
            className="social-auth-button apple-auth-button"
          >
            Continue with Apple
          </button>
        </div>

        <div className="auth-links">
          <Link to="/forgot-password">Forgot Password?</Link>
        </div>
        <div className="auth-footer">
          Need an account? <Link to="/signup">Sign Up</Link>
        </div>
      </div>
    </div>
  );
} 