import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getAlternateUrls } from '../utils/localeUtils';

const SEOHreflang = ({ baseUrl = 'https://outtaboundstravel.com' }) => {
  const location = useLocation();
  
  useEffect(() => {
    // Remove existing hreflang tags
    const existingTags = document.querySelectorAll('link[rel="alternate"][hreflang]');
    existingTags.forEach(tag => tag.remove());
    
    // Generate new hreflang tags
    const alternateUrls = getAlternateUrls(location.pathname, baseUrl);
    
    alternateUrls.forEach(({ locale, url }) => {
      const link = document.createElement('link');
      link.rel = 'alternate';
      link.hreflang = locale;
      link.href = url;
      document.head.appendChild(link);
    });
    
    // Add x-default hreflang for the default locale
    const defaultLink = document.createElement('link');
    defaultLink.rel = 'alternate';
    defaultLink.hreflang = 'x-default';
    defaultLink.href = `${baseUrl}/en-us${location.pathname === '/' ? '' : location.pathname}`;
    document.head.appendChild(defaultLink);
    
    // Cleanup function
    return () => {
      const tagsToRemove = document.querySelectorAll('link[rel="alternate"][hreflang]');
      tagsToRemove.forEach(tag => tag.remove());
    };
  }, [location.pathname, baseUrl]);
  
  // This component doesn't render anything
  return null;
};

export default SEOHreflang; 