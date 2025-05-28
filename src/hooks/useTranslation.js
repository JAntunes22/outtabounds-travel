import { useState, useEffect } from 'react';
import { useLocale } from '../contexts/LocaleContext';

const translationCache = new Map();

export const useTranslation = () => {
  const { currentLocale } = useLocale();
  const [translations, setTranslations] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadTranslations = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Check cache first
        if (translationCache.has(currentLocale)) {
          setTranslations(translationCache.get(currentLocale));
          setIsLoading(false);
          return;
        }

        // Dynamically import the translation file
        const translationModule = await import(`../locales/${currentLocale}/common.json`);
        const translationData = translationModule.default || translationModule;

        // Cache the translations
        translationCache.set(currentLocale, translationData);
        setTranslations(translationData);
      } catch (err) {
        console.error(`Failed to load translations for locale ${currentLocale}:`, err);
        setError(err);
        
        // Fallback to English if available
        if (currentLocale !== 'en-us') {
          try {
            const fallbackModule = await import('../locales/en-us/common.json');
            const fallbackData = fallbackModule.default || fallbackModule;
            setTranslations(fallbackData);
          } catch (fallbackErr) {
            console.error('Failed to load fallback translations:', fallbackErr);
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadTranslations();
  }, [currentLocale]);

  // Translation function with nested key support
  const t = (key, defaultValue = key) => {
    if (!key) return defaultValue;

    const keys = key.split('.');
    let value = translations;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return defaultValue;
      }
    }

    return typeof value === 'string' ? value : defaultValue;
  };

  return {
    t,
    translations,
    isLoading,
    error,
    currentLocale
  };
}; 