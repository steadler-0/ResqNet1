/**
 * Builds src/lib/i18n/localePacks.js from en keys + per-language overrides
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const enPath = path.join(root, 'src/lib/i18n/enKeys.js');
const enSrc = fs.readFileSync(enPath, 'utf8');
const match = enSrc.match(/export const EN_KEYS = (\{[\s\S]*?\});/);
if (!match) throw new Error('EN_KEYS not found');
const EN_KEYS = eval(`(${match[1]})`);

const LANG_META = [
  { code: 'hi', label: 'हिन्दी' },
  { code: 'bn', label: 'বাংলা' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'mr', label: 'मराठी' },
  { code: 'gu', label: 'ગુજરાતી' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
  { code: 'ml', label: 'മലയാളം' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ' },
  { code: 'or', label: 'ଓଡ଼ିଆ' },
  { code: 'as', label: 'অসমীয়া' },
  { code: 'ur', label: 'اردو' },
  { code: 'kok', label: 'कोंकणी' },
  { code: 'mai', label: 'मैथिली' },
  { code: 'ne', label: 'नेपाली' },
  { code: 'sd', label: 'سنڌي' },
  { code: 'ks', label: 'کٲشُر' },
  { code: 'doi', label: 'डोगरी' },
  { code: 'mni', label: 'মৈতৈলোন্' },
  { code: 'bo', label: 'बड़ो' },
  { code: 'sat', label: 'ᱥᱟᱱᱛᱟᱲᱤ' },
  { code: 'sa', label: 'संस्कृतम्' },
];

/** Phrase-level overrides per language (merged on EN_KEYS) */
const OVERRIDES = {
  hi: {
    nav_home: 'होम', nav_dashboard: 'डैशबोर्ड', nav_sos: 'SOS', nav_sos_send: 'SOS भेजें',
    nav_map: 'लाइव मैप', nav_alerts: 'अलर्ट', nav_resources: 'संसाधन', nav_profile: 'प्रोफ़ाइल',
    nav_coordinator: 'समन्वयक', nav_login: 'लॉगिन', nav_logout: 'लॉगआउट',
    landing_title: 'भारत का रियल-टाइम आपदा प्रतिक्रिया मंच',
    landing_subtitle: 'अलर्ट ट्रैक करें, आश्रय खोजें, SOS भेजें और समन्वय करें।',
    auth_login_title: 'ResqNet में लॉगिन', auth_citizen: 'नागरिक', auth_coordinator: 'समन्वयक',
    profile_title: 'मेरी प्रोफ़ाइल', footer_about: 'हमारे बारे में',
    alerts_title: 'अलर्ट डैशबोर्ड', alerts_live: 'लाइव अलर्ट',
  },
  bn: {
    nav_home: 'হোম', nav_dashboard: 'ড্যাশবোর্ড', nav_map: 'লাইভ ম্যাপ', nav_alerts: 'সতর্কতা',
    nav_profile: 'প্রোফাইল', nav_login: 'লগইন', landing_title: 'ভারতের রিয়েল-টাইম দুর্যোগ প্ল্যাটফর্ম',
    auth_login_title: 'ResqNet লগইন', profile_title: 'আমার প্রোফাইল', alerts_title: 'সতর্কতা ড্যাশবোর্ড',
  },
  ta: {
    nav_home: 'முகப்பு', nav_dashboard: 'டாஷ்போர்டு', nav_map: 'நேரடி வரைபடம்', nav_alerts: 'எச்சரிக்கை',
    nav_profile: 'சுயவிவரம்', nav_login: 'உள்நுழை', landing_title: 'இந்தியா நேரடி பேரிடர் மேடை',
    auth_login_title: 'ResqNet உள்நுழைவு', profile_title: 'என் சுயவிவரம்', alerts_title: 'எச்சரிக்கை டாஷ்போர்டு',
  },
  te: {
    nav_home: 'హోమ్', nav_dashboard: 'డాష్‌బోర్డ్', nav_map: 'లైవ్ మ్యాప్', nav_alerts: 'హెచ్చరికలు',
    nav_profile: 'ప్రొఫైల్', nav_login: 'లాగిన్', landing_title: 'భారత రియల్-టైమ్ విపత్తు వేదిక',
    auth_login_title: 'ResqNet లాగిన్', profile_title: 'నా ప్రొఫైల్', alerts_title: 'హెచ్చరికల డాష్‌బోర్డ్',
  },
};

function expandFromHi(code, label) {
  const hi = { ...EN_KEYS, ...OVERRIDES.hi };
  const o = OVERRIDES[code] || {};
  return { ...hi, ...o, nav_brand: 'ResqNet', lang_name: label };
}

const packs = {};
for (const { code, label } of LANG_META) {
  if (OVERRIDES[code]) {
    packs[code] = { ...EN_KEYS, ...OVERRIDES[code], lang_name: label };
  } else {
    packs[code] = expandFromHi(code, label);
  }
}

const out = `/** Auto-generated — run: node scripts/build-locale-packs.mjs */\nexport const LOCALE_PACKS = ${JSON.stringify(packs, null, 0)};\n`;
fs.writeFileSync(path.join(root, 'src/lib/i18n/localePacks.js'), out);
console.log('Built locale packs for', Object.keys(packs).length, 'languages');
