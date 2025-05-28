import React, { useState } from 'react';
import { useLocale } from '../contexts/LocaleContext';
import './LocaleSwitcher.css';

const LocaleSwitcher = ({ className = '' }) => {
  const { 
    currentLocale, 
    currentCurrency, 
    availableLocales, 
    localeNames, 
    changeLocale,
    config 
  } = useLocale();
  
  const [isOpen, setIsOpen] = useState(false);
  
  const handleLocaleChange = (locale) => {
    changeLocale(locale);
    setIsOpen(false);
  };
  
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };
  
  const currentLocaleName = localeNames[currentLocale];
  const currentCurrencySymbol = config.currencySymbols[currentCurrency];
  
  return (
    <div className={`locale-switcher ${className}`}>
      <button 
        className="locale-switcher-button"
        onClick={toggleDropdown}
        aria-label="Change language and currency"
        aria-expanded={isOpen}
      >
        <span className="locale-switcher-current">
          <span className="locale-name">{currentLocaleName}</span>
          <span className="currency-symbol">({currentCurrencySymbol})</span>
        </span>
        <svg 
          className={`locale-switcher-arrow ${isOpen ? 'open' : ''}`}
          width="12" 
          height="8" 
          viewBox="0 0 12 8"
          fill="none"
        >
          <path 
            d="M1 1L6 6L11 1" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
      </button>
      
      {isOpen && (
        <>
          <div 
            className="locale-switcher-overlay"
            onClick={() => setIsOpen(false)}
          />
          <div className="locale-switcher-dropdown">
            {availableLocales.map(locale => {
              const localeName = localeNames[locale];
              const currency = config.currencyMap[locale];
              const currencySymbol = config.currencySymbols[currency];
              const isSelected = locale === currentLocale;
              
              return (
                <button
                  key={locale}
                  className={`locale-switcher-option ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleLocaleChange(locale)}
                  disabled={isSelected}
                >
                  <span className="locale-option-name">{localeName}</span>
                  <span className="locale-option-currency">({currencySymbol})</span>
                  {isSelected && (
                    <svg 
                      className="locale-option-check"
                      width="16" 
                      height="16" 
                      viewBox="0 0 16 16"
                      fill="none"
                    >
                      <path 
                        d="M13.5 4.5L6 12L2.5 8.5" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default LocaleSwitcher; 