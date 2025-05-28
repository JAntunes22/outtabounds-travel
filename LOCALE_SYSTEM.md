# Locale Routing System Documentation

## Overview

This document describes the comprehensive locale routing system implemented for the OuttaBounds Travel website. The system provides path-based locale routing with automatic geo-detection, user preference persistence, and internationalization support.

## Features Implemented

### ✅ Core Infrastructure
- **Path-based routing**: URLs use locale prefixes (e.g., `/en-us/`, `/fr/`, `/de/`)
- **5 supported locales**: en-us, fr, pt, es, en-uk
- **Automatic geo-detection**: IP-based country detection with Accept-Language header parsing
- **User preference persistence**: localStorage + cookies for user locale overrides
- **SEO optimization**: Automatic hreflang meta tags for all locales

### ✅ Components & Context
- **LocaleContext**: React context providing locale state and utilities
- **LocaleRedirect**: Handles root path redirection with geo-detection
- **LocaleSwitcher**: Dropdown component showing language + currency
- **SEOHreflang**: Automatic hreflang meta tag injection
- **useTranslation**: Hook for dynamic translation loading with caching

### ✅ Backend Support
- **detectLocale API**: Firebase function for IP-based country detection
- **getPacksByLocale**: Callable function for region-filtered pack retrieval
- **Region tiers**: tier1, tier2, tier3, rest for content filtering

### ✅ Translation System
- **Dynamic loading**: Translation files loaded on-demand
- **Fallback support**: Falls back to English if translation fails
- **Caching**: Translations cached in memory for performance
- **Nested keys**: Support for nested translation keys (e.g., 'navigation.home')

## File Structure

```
src/
├── config/
│   └── localeConfig.js          # Central locale configuration
├── contexts/
│   └── LocaleContext.js         # React context for locale management
├── components/
│   ├── LocaleRedirect.js        # Root path redirection component
│   ├── LocaleSwitcher.js        # Language/currency switcher UI
│   ├── LocaleSwitcher.css       # Switcher styling
│   └── SEOHreflang.js          # SEO hreflang tags
├── utils/
│   └── localeUtils.js          # Utility functions for locale handling
├── hooks/
│   └── useTranslation.js       # Translation hook
└── locales/
    ├── en-us/common.json       # English (US) translations
    ├── fr/common.json          # French translations
    ├── pt/common.json          # Portuguese translations
    ├── es/common.json          # Spanish translations
    └── en-uk/common.json       # English (UK) translations

functions/
└── index.js                    # Firebase functions with locale detection
```

## Configuration

### Locale Configuration (`src/config/localeConfig.js`)

```javascript
const localeConfig = {
  locales: ['en-us', 'fr', 'pt', 'es', 'en-uk'],
  defaultLocale: 'en-us',
  
  // Country to locale mapping
  regionMap: {
    US: 'en-us',
    FR: 'fr', 
    PT: 'pt',
    ES: 'es',
    UK: 'en-uk',
    GB: 'en-uk',
    // ... more countries
  },
  
  // Locale to currency mapping
  currencyMap: {
    'en-us': 'USD',
    'fr': 'EUR',
    'pt': 'EUR', 
    'es': 'EUR',
    'en-uk': 'GBP'
  },
  
  // Region tiers for content filtering
  regionTiers: {
    tier1: ['US', 'UK', 'GB', 'CA', 'AU'],
    tier2: ['FR', 'DE', 'IT', 'NL', 'BE', 'CH', 'AT'],
    tier3: ['PT', 'ES'],
    rest: ['*']
  }
};
```

## Usage Examples

### Using the Locale Context

```javascript
import { useLocale } from '../contexts/LocaleContext';

function MyComponent() {
  const { 
    currentLocale, 
    currentCurrency, 
    changeLocale, 
    formatPrice,
    getLocalizedPath 
  } = useLocale();
  
  return (
    <div>
      <p>Current locale: {currentLocale}</p>
      <p>Price: {formatPrice(100)}</p>
      <Link to={getLocalizedPath('/about')}>About</Link>
    </div>
  );
}
```

### Using Translations

```javascript
import { useTranslation } from '../hooks/useTranslation';

function MyComponent() {
  const { t, isLoading } = useTranslation();
  
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <div>
      <h1>{t('navigation.home')}</h1>
      <p>{t('common.loading')}</p>
    </div>
  );
}
```

### Adding the LocaleSwitcher

```javascript
import LocaleSwitcher from './LocaleSwitcher';

function Header() {
  return (
    <header>
      <nav>
        {/* Other nav items */}
        <LocaleSwitcher className="header-locale-switcher" />
      </nav>
    </header>
  );
}
```

## URL Structure

The system uses path-based locale routing:

- `/` → Redirects to detected locale (e.g., `/en-us/`)
- `/en-us/` → English (US) home page
- `/fr/about` → French about page
- `/es/packs` → Spanish packs page
- `/en-uk/contact` → English (UK) contact page

## Geo-Detection Flow

1. User visits root path `/`
2. Check for saved locale preference (localStorage/cookie)
3. If no preference, call `detectLocale` API with IP and Accept-Language
4. API returns suggested locale based on country and browser language
5. Redirect to locale-specific path with 302 redirect
6. User preference is saved when they manually change locale

## Backend API

### detectLocale Function

**Endpoint**: `https://us-central1-outtabounds-travel.cloudfunctions.net/detectLocale`

**Response**:
```json
{
  "ip": "192.168.1.1",
  "country": "US",
  "suggestedLocale": "en-us",
  "currency": "USD",
  "regionTier": "tier1",
  "acceptLanguage": "en-US,en;q=0.9",
  "preferredLanguages": ["en-us", "en"]
}
```

### getPacksByLocale Function

**Usage**:
```javascript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const getPacksByLocale = httpsCallable(functions, 'getPacksByLocale');

const result = await getPacksByLocale({ 
  locale: 'fr', 
  regionTier: 'tier2' 
});
```

## SEO Implementation

The system automatically generates hreflang tags for all pages:

```html
<link rel="alternate" hreflang="en-us" href="https://outtaboundstravel.com/en-us/about" />
<link rel="alternate" hreflang="fr" href="https://outtaboundstravel.com/fr/about" />
<link rel="alternate" hreflang="pt" href="https://outtaboundstravel.com/pt/about" />
<link rel="alternate" hreflang="es" href="https://outtaboundstravel.com/es/about" />
<link rel="alternate" hreflang="en-uk" href="https://outtaboundstravel.com/en-uk/about" />
<link rel="alternate" hreflang="x-default" href="https://outtaboundstravel.com/en-us/about" />
```

## Testing

### Local Development

1. Start the Firebase emulators:
   ```bash
   firebase emulators:start
   ```

2. Start the React development server:
   ```bash
   npm start
   ```

3. Test locale detection by visiting `http://localhost:3000/`

### Testing Different Locales

- Visit `http://localhost:3000/fr/` for French
- Visit `http://localhost:3000/es/` for Spanish
- Visit `http://localhost:3000/pt/` for Portuguese
- Visit `http://localhost:3000/en-uk/` for English (UK)

### Testing Geo-Detection

The geo-detection will work in development mode using the Firebase emulator. The system will detect your IP and suggest an appropriate locale.

## Deployment

### Prerequisites

1. Upgrade Firebase project to Blaze (pay-as-you-go) plan
2. Enable required APIs:
   - Cloud Functions API
   - Cloud Build API
   - Artifact Registry API

### Deploy Functions

```bash
firebase deploy --only functions
```

### Deploy Hosting

```bash
npm run build
firebase deploy --only hosting
```

## Adding New Locales

1. Add locale to `localeConfig.js`:
   ```javascript
   locales: ['en-us', 'fr', 'pt', 'es', 'en-uk', 'de'],
   ```

2. Add country mapping:
   ```javascript
   regionMap: {
     DE: 'de',
     // ...
   }
   ```

3. Add currency mapping:
   ```javascript
   currencyMap: {
     'de': 'EUR',
     // ...
   }
   ```

4. Create translation file:
   ```
   src/locales/de/common.json
   ```

5. Add locale name:
   ```javascript
   localeNames: {
     'de': 'Deutsch',
     // ...
   }
   ```

## Performance Considerations

- **Translation caching**: Translations are cached in memory after first load
- **Dynamic imports**: Translation files are loaded on-demand
- **Lazy loading**: Only current locale translations are loaded
- **Bundle optimization**: Consider code splitting for large translation files

## Browser Support

- Modern browsers with ES6+ support
- Intl.NumberFormat for currency formatting
- localStorage and cookie support for preferences
- Fetch API for geo-detection

## Troubleshooting

### Common Issues

1. **Infinite redirect loops**: Check that locale paths are properly configured
2. **Translation not loading**: Verify translation files exist and are valid JSON
3. **Geo-detection failing**: Check Firebase functions deployment and API endpoints
4. **Currency formatting errors**: Ensure Intl.NumberFormat support in target browsers

### Debug Mode

Enable debug logging by setting:
```javascript
localStorage.setItem('locale_debug', 'true');
```

This will log locale detection and routing decisions to the console. 