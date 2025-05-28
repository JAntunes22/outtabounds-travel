import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  getSavedLocaleOverride, 
  getLocaleFromPath,
  addLocaleToPath
} from '../utils/localeUtils';
import localeConfig from '../config/localeConfig';

const LocaleRedirect = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);
  
  useEffect(() => {
    const checkAndRedirect = async () => {
      // Only check on root path without locale
      if (location.pathname !== '/' || hasChecked) {
        setHasChecked(true);
        return;
      }
      
      setIsRedirecting(true);
      
      try {
        // First, check for saved locale override
        const savedLocale = getSavedLocaleOverride();
        if (savedLocale) {
          const newPath = addLocaleToPath('/', savedLocale);
          navigate(newPath, { replace: true });
          return;
        }
        
        // Try browser language detection first as a quick fallback
        let detectedLocale = null;
        const browserLang = navigator.language.toLowerCase();
        
        // Map browser language to our supported locales
        if (browserLang.startsWith('fr')) {
          detectedLocale = 'fr';
        } else if (browserLang.startsWith('pt')) {
          detectedLocale = 'pt';
        } else if (browserLang.startsWith('es')) {
          detectedLocale = 'es';
        } else if (browserLang.startsWith('en-gb') || browserLang.startsWith('en-uk')) {
          detectedLocale = 'en-uk';
        } else if (browserLang.startsWith('en')) {
          detectedLocale = 'en-us';
        }
        
        // If we detected a locale from browser language, use it
        if (detectedLocale) {
          const newPath = addLocaleToPath('/', detectedLocale);
          navigate(newPath, { replace: true });
          return;
        }
        
        // If browser detection failed, try the Firebase function
        const isDevelopment = process.env.NODE_ENV === 'development';
        const apiUrl = isDevelopment 
          ? 'http://localhost:5001/outtabounds-travel/us-central1/detectLocale'
          : 'https://us-central1-outtabounds-travel.cloudfunctions.net/detectLocale';
          
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Accept-Language': navigator.language || 'en-US'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          const suggestedLocale = data.suggestedLocale || localeConfig.defaultLocale;
          
          const newPath = addLocaleToPath('/', suggestedLocale);
          navigate(newPath, { replace: true });
        } else {
          // Fallback to default locale
          const newPath = addLocaleToPath('/', localeConfig.defaultLocale);
          navigate(newPath, { replace: true });
        }
      } catch (error) {
        // Fallback to default locale
        const newPath = addLocaleToPath('/', localeConfig.defaultLocale);
        navigate(newPath, { replace: true });
      } finally {
        setIsRedirecting(false);
        setHasChecked(true);
      }
    };
    
    checkAndRedirect();
  }, [location.pathname, navigate, hasChecked]);
  
  // Show loading state while redirecting from root
  if (location.pathname === '/' && isRedirecting) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '16px',
        color: '#666'
      }}>
        Redirecting...
      </div>
    );
  }
  
  // For paths with locale prefix or after redirect check, render children
  const currentLocale = getLocaleFromPath(location.pathname);
  if (currentLocale || hasChecked) {
    return children;
  }
  
  // Default loading state
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      fontSize: '16px',
      color: '#666'
    }}>
      Loading...
    </div>
  );
};

export default LocaleRedirect; 