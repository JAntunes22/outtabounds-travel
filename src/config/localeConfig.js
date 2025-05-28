const localeConfig = {
  locales: ['en-us', 'fr', 'pt', 'es', 'en-uk'],
  defaultLocale: 'en-us',
  
  // Map country codes to default locales
  regionMap: {
    US: 'en-us',
    FR: 'fr', 
    PT: 'pt',
    ES: 'es',
    UK: 'en-uk',
    GB: 'en-uk', // Alternative for UK
    // Add more country mappings as needed
    CA: 'en-us', // Canada defaults to US English
    AU: 'en-uk', // Australia defaults to UK English
    DE: 'en-uk', // Germany defaults to UK English
    IT: 'en-uk', // Italy defaults to UK English
    NL: 'en-uk', // Netherlands defaults to UK English
    BE: 'fr',    // Belgium defaults to French
    CH: 'en-uk', // Switzerland defaults to UK English
    AT: 'en-uk', // Austria defaults to UK English
  },
  
  // Map locales to currencies
  currencyMap: {
    'en-us': 'USD',
    'fr': 'EUR',
    'pt': 'EUR', 
    'es': 'EUR',
    'en-uk': 'GBP'
  },
  
  // Regional tiers for pack availability
  regionTiers: {
    tier1: ['US', 'UK', 'GB', 'CA', 'AU'],
    tier2: ['FR', 'DE', 'IT', 'NL', 'BE', 'CH', 'AT'],
    tier3: ['PT', 'ES'],
    rest: ['*'] // Fallback for all other countries
  },
  
  // Language names for the locale switcher
  localeNames: {
    'en-us': 'English (US)',
    'fr': 'Français',
    'pt': 'Português',
    'es': 'Español', 
    'en-uk': 'English (UK)'
  },
  
  // Currency symbols for display
  currencySymbols: {
    'USD': '$',
    'EUR': '€',
    'GBP': '£'
  }
};

export default localeConfig; 