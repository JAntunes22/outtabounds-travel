import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import localeConfig from '../config/localeConfig';
import {
  getLocaleFromPath,
  removeLocaleFromPath,
  addLocaleToPath,
  saveLocaleOverride,
  getCurrencyForLocale,
  formatPrice,
  getRegionTier
} from '../utils/localeUtils';

const LocaleContext = createContext();

export const useLocale = () => {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
};

export const LocaleProvider = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Extract current locale from URL path
  const currentLocaleFromPath = getLocaleFromPath(location.pathname);
  const [currentLocale, setCurrentLocale] = useState(
    currentLocaleFromPath || localeConfig.defaultLocale
  );
  
  // Update locale when path changes
  useEffect(() => {
    const pathLocale = getLocaleFromPath(location.pathname);
    if (pathLocale && pathLocale !== currentLocale) {
      setCurrentLocale(pathLocale);
    }
  }, [location.pathname, currentLocale]);
  
  // Get current currency
  const currentCurrency = getCurrencyForLocale(currentLocale);
  
  // Change locale and navigate to new path
  const changeLocale = (newLocale) => {
    if (!localeConfig.locales.includes(newLocale)) {
      console.warn(`Invalid locale: ${newLocale}`);
      return;
    }
    
    // Save user preference
    saveLocaleOverride(newLocale);
    
    // Update state
    setCurrentLocale(newLocale);
    
    // Navigate to new locale path
    const currentPath = removeLocaleFromPath(location.pathname);
    const newPath = addLocaleToPath(currentPath, newLocale);
    navigate(newPath + location.search + location.hash, { replace: true });
  };
  
  // Format price with current locale
  const formatPriceForCurrentLocale = (amount) => {
    return formatPrice(amount, currentLocale);
  };
  
  // Get localized path
  const getLocalizedPath = (path) => {
    const cleanPath = removeLocaleFromPath(path);
    return addLocaleToPath(cleanPath, currentLocale);
  };
  
  // Check if current path has locale prefix
  const hasLocalePrefix = () => {
    return getLocaleFromPath(location.pathname) !== null;
  };
  
  // Get region tier for current locale
  const getCurrentRegionTier = () => {
    // Map locale back to country for tier determination
    const countryForLocale = Object.entries(localeConfig.regionMap)
      .find(([, locale]) => locale === currentLocale)?.[0];
    return getRegionTier(countryForLocale);
  };
  
  const value = {
    // Current state
    currentLocale,
    currentCurrency,
    
    // Available options
    availableLocales: localeConfig.locales,
    localeNames: localeConfig.localeNames,
    
    // Functions
    changeLocale,
    formatPrice: formatPriceForCurrentLocale,
    getLocalizedPath,
    hasLocalePrefix,
    getCurrentRegionTier,
    
    // Utilities
    removeLocaleFromPath,
    addLocaleToPath,
    
    // Config access
    config: localeConfig
  };
  
  return (
    <LocaleContext.Provider value={value}>
      {children}
    </LocaleContext.Provider>
  );
}; 