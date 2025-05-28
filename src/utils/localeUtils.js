import localeConfig from '../config/localeConfig';

// Cookie and localStorage keys
const LOCALE_OVERRIDE_KEY = 'locale_override';
const LOCALE_COOKIE_KEY = 'user_locale';

/**
 * Get user's saved locale preference from localStorage or cookie
 */
export const getSavedLocaleOverride = () => {
  // Check localStorage first
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(LOCALE_OVERRIDE_KEY);
    if (saved && localeConfig.locales.includes(saved)) {
      return saved;
    }
    
    // Fallback to cookie
    const cookies = document.cookie.split(';');
    const localeCookie = cookies.find(cookie => 
      cookie.trim().startsWith(`${LOCALE_COOKIE_KEY}=`)
    );
    
    if (localeCookie) {
      const locale = localeCookie.split('=')[1];
      if (localeConfig.locales.includes(locale)) {
        return locale;
      }
    }
  }
  
  return null;
};

/**
 * Save user's locale preference
 */
export const saveLocaleOverride = (locale) => {
  if (!localeConfig.locales.includes(locale)) {
    console.warn(`Invalid locale: ${locale}`);
    return;
  }
  
  if (typeof window !== 'undefined') {
    // Save to localStorage
    localStorage.setItem(LOCALE_OVERRIDE_KEY, locale);
    
    // Save to cookie (expires in 1 year)
    const expires = new Date();
    expires.setFullYear(expires.getFullYear() + 1);
    document.cookie = `${LOCALE_COOKIE_KEY}=${locale}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
  }
};

/**
 * Clear saved locale preference
 */
export const clearLocaleOverride = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(LOCALE_OVERRIDE_KEY);
    document.cookie = `${LOCALE_COOKIE_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  }
};

/**
 * Parse Accept-Language header to get preferred languages
 */
export const parseAcceptLanguage = (acceptLanguage) => {
  if (!acceptLanguage) return [];
  
  return acceptLanguage
    .split(',')
    .map(lang => {
      const [locale, q = '1'] = lang.trim().split(';q=');
      return {
        locale: locale.toLowerCase(),
        quality: parseFloat(q)
      };
    })
    .sort((a, b) => b.quality - a.quality)
    .map(item => item.locale);
};

/**
 * Map country code to locale based on regionMap
 */
export const getLocaleFromCountry = (countryCode) => {
  if (!countryCode) return localeConfig.defaultLocale;
  
  const upperCountry = countryCode.toUpperCase();
  return localeConfig.regionMap[upperCountry] || localeConfig.defaultLocale;
};

/**
 * Get the best locale based on country and Accept-Language
 */
export const getBestLocale = (countryCode, acceptLanguage) => {
  // First, check for saved override
  const savedOverride = getSavedLocaleOverride();
  if (savedOverride) {
    return savedOverride;
  }
  
  // Parse Accept-Language header
  const preferredLanguages = parseAcceptLanguage(acceptLanguage);
  
  // Try to match preferred languages with available locales
  for (const lang of preferredLanguages) {
    // Direct match
    if (localeConfig.locales.includes(lang)) {
      return lang;
    }
    
    // Language code match (e.g., 'en' matches 'en-us')
    const langCode = lang.split('-')[0];
    const matchingLocale = localeConfig.locales.find(locale => 
      locale.startsWith(langCode)
    );
    if (matchingLocale) {
      return matchingLocale;
    }
  }
  
  // Fallback to country-based locale
  return getLocaleFromCountry(countryCode);
};

/**
 * Get currency for a locale
 */
export const getCurrencyForLocale = (locale) => {
  return localeConfig.currencyMap[locale] || localeConfig.currencyMap[localeConfig.defaultLocale];
};

/**
 * Format price with locale-specific currency
 */
export const formatPrice = (amount, locale) => {
  const currency = getCurrencyForLocale(locale);
  
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  } catch (error) {
    console.warn(`Error formatting price for locale ${locale}:`, error);
    // Fallback formatting
    const symbol = localeConfig.currencySymbols[currency] || currency;
    return `${symbol}${amount.toLocaleString()}`;
  }
};

/**
 * Get the region tier for a country code
 * @param {string} countryCode - The country code (e.g., 'US', 'FR')
 * @returns {string} - The tier name ('tier1', 'tier2', 'tier3', 'rest')
 */
export function getRegionTier(countryCode) {
  if (!countryCode) return 'rest';
  
  const { regionTiers } = localeConfig;
  
  for (const [tier, countries] of Object.entries(regionTiers)) {
    if (countries.includes(countryCode) || countries.includes('*')) {
      return tier;
    }
  }
  
  return 'rest';
}

/**
 * Extract locale from pathname
 */
export const getLocaleFromPath = (pathname) => {
  const segments = pathname.split('/').filter(Boolean);
  const firstSegment = segments[0];
  
  if (firstSegment && localeConfig.locales.includes(firstSegment)) {
    return firstSegment;
  }
  
  return null;
};

/**
 * Remove locale from pathname
 */
export const removeLocaleFromPath = (pathname) => {
  const locale = getLocaleFromPath(pathname);
  if (locale) {
    return pathname.replace(`/${locale}`, '') || '/';
  }
  return pathname;
};

/**
 * Add locale to pathname
 */
export const addLocaleToPath = (pathname, locale) => {
  const cleanPath = removeLocaleFromPath(pathname);
  return `/${locale}${cleanPath === '/' ? '' : cleanPath}`;
};

/**
 * Get alternate URLs for SEO hreflang tags
 */
export const getAlternateUrls = (pathname, baseUrl = 'https://outtaboundstravel.com') => {
  const cleanPath = removeLocaleFromPath(pathname);
  
  return localeConfig.locales.map(locale => ({
    locale,
    url: `${baseUrl}/${locale}${cleanPath === '/' ? '' : cleanPath}`
  }));
};

/**
 * Get the price for a pack in the appropriate currency for the given locale
 */
export const getPackPrice = (pack, locale) => {
  const currency = getCurrencyForLocale(locale);
  
  // If pack has new multi-currency pricing structure
  if (pack.prices && typeof pack.prices === 'object') {
    if (pack.prices[currency]) {
      return {
        amount: pack.prices[currency],
        currency: currency,
        symbol: localeConfig.currencySymbols[currency]
      };
    }
    
    // Fallback to other available currencies
    const fallbackOrder = ['EUR', 'USD', 'GBP'];
    for (const fallbackCurrency of fallbackOrder) {
      if (pack.prices[fallbackCurrency]) {
        return {
          amount: pack.prices[fallbackCurrency],
          currency: fallbackCurrency,
          symbol: localeConfig.currencySymbols[fallbackCurrency]
        };
      }
    }
  }
  
  // Fallback to old single price format
  if (pack.price) {
    return {
      amount: pack.price,
      currency: currency,
      symbol: localeConfig.currencySymbols[currency]
    };
  }
  
  // No price available
  return null;
};

/**
 * Format a pack price for display
 */
export const formatPackPrice = (pack, locale) => {
  const priceInfo = getPackPrice(pack, locale);
  
  if (!priceInfo) {
    return 'Price upon request';
  }
  
  return `${priceInfo.symbol}${priceInfo.amount}`;
};

/**
 * Get currency symbol for a given currency code
 */
export const getCurrencySymbol = (currencyCode) => {
  return localeConfig.currencySymbols[currencyCode] || currencyCode;
}; 