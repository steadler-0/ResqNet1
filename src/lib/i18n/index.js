import { EN_KEYS } from './enKeys.js';

/** 22 scheduled Indian languages + English */
export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
  { code: 'bn', label: 'Bengali', native: 'বাংলা' },
  { code: 'te', label: 'Telugu', native: 'తెలుగు' },
  { code: 'mr', label: 'Marathi', native: 'मराठी' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
  { code: 'ur', label: 'Urdu', native: 'اردو' },
  { code: 'gu', label: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'ml', label: 'Malayalam', native: 'മലയാളം' },
  { code: 'or', label: 'Odia', native: 'ଓଡ଼ିଆ' },
  { code: 'pa', label: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
  { code: 'as', label: 'Assamese', native: 'অসমীয়া' },
  { code: 'mai', label: 'Maithili', native: 'मैथिली' },
  { code: 'sat', label: 'Santali', native: 'ᱥᱟᱱᱛᱟᱲᱤ' },
  { code: 'ks', label: 'Kashmiri', native: 'کٲشُر' },
  { code: 'ne', label: 'Nepali', native: 'नेपाली' },
  { code: 'kok', label: 'Konkani', native: 'कोंकणी' },
  { code: 'sd', label: 'Sindhi', native: 'سنڌي' },
  { code: 'doi', label: 'Dogri', native: 'डोगरी' },
  { code: 'mni', label: 'Manipuri', native: 'মৈতৈলোন্' },
  { code: 'bo', label: 'Bodo', native: 'बड़ो' },
  { code: 'sa', label: 'Sanskrit', native: 'संस्कृतम्' },
];

import { LOCALE_PACKS } from './localePacks.js';

/** Every locale inherits English keys, then applies its own overrides */
export const translations = {
  en: EN_KEYS,
  ...Object.fromEntries(
    Object.entries(LOCALE_PACKS).map(([code, pack]) => [code, { ...EN_KEYS, ...pack }])
  ),
};

export function t(lang, key, vars = {}) {
  const pack = translations[lang] || translations.en;
  let str = pack[key] ?? translations.en[key] ?? key;
  Object.entries(vars).forEach(([k, v]) => {
    str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
  });
  return str;
}

export function useTranslation(lang) {
  return (key, vars) => t(lang, key, vars);
}
