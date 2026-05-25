import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(__dirname, '..', 'src');
const RN = 'C:/Users/Yuvaraj B/Desktop/RescueNet/src';

const LIB_FILES = [
  'lib/sortAlerts.js',
  'lib/geoUtils.js',
  'lib/coordinatorFeed.js',
  'lib/geoErrors.js',
  'lib/ipGeolocation.js',
  'lib/firebase.js',
  'lib/leafletIcon.js',
];

const COMP_FILES = [
  'components/GeoTagEmergency.jsx',
  'components/LiveMap.jsx',
  'components/MapUpdater.jsx',
  'components/MapClickSetLocation.jsx',
  'components/RealtimeAlerts.jsx',
  'components/SafetyInstructions.jsx',
  'components/HeatmapPlaceholder.jsx',
  'components/AnalyticsDashboard.jsx',
];

const HOOK_FILES = ['hooks/useLiveGeolocation.js'];

function theme(content) {
  return (
    content
      .replace(/\.\.\/lib\//g, '../lib/sentinelx/')
      .replace(/\.\.\/hooks\//g, '../hooks/')
      .replace(/from '\.\.\/lib\/firebase'/g, "from '../lib/sentinelx/firebase'")
      .replace(/from '\.\.\/lib\/geoUtils'/g, "from '../lib/sentinelx/geoUtils'")
      .replace(/from '\.\.\/lib\/coordinatorFeed'/g, "from '../lib/sentinelx/coordinatorFeed'")
      .replace(/from '\.\.\/lib\/sortAlerts'/g, "from '../lib/sentinelx/sortAlerts'")
      .replace(/from '\.\.\/lib\/leafletIcon'/g, "from '../lib/sentinelx/leafletIcon'")
      .replace(/from '\.\.\/hooks\/useLiveGeolocation'/g, "from '../hooks/useLiveGeolocation'")
      .replace(/from '\.\/LiveMap'/g, "from './LiveMap'")
      .replace(/from '\.\/MapUpdater'/g, "from './MapUpdater'")
      .replace(/from '\.\/MapClickSetLocation'/g, "from './MapClickSetLocation'")
      .replace(/from '\.\.\/hooks\/useLiveGeolocation'/g, "from '../../hooks/useLiveGeolocation'")
      .replace(/import '\.\.\/lib\/leafletIcon'/g, "import '../../lib/sentinelx/leafletIcon'")
      .replace(/from '\.\.\/hooks\/useLiveGeolocation'/g, "from '../../hooks/useLiveGeolocation'")
      .replace(/DEFAULT_MAP_CENTER } from '\.\.\/hooks\/useLiveGeolocation'/g, "DEFAULT_MAP_CENTER } from '../../hooks/useLiveGeolocation'")
      // RescueNet color scheme
      .replace(/border-cyan-500/g, 'border-secondary')
      .replace(/border-cyan-400/g, 'border-secondary')
      .replace(/text-cyan-400/g, 'text-secondary')
      .replace(/text-cyan-300/g, 'text-secondary')
      .replace(/text-cyan-200/g, 'text-primary')
      .replace(/text-cyan-700/g, 'text-primary')
      .replace(/bg-cyan-500/g, 'bg-secondary')
      .replace(/bg-cyan-400/g, 'bg-secondary')
      .replace(/from-cyan-/g, 'from-secondary-')
      .replace(/to-cyan-/g, 'to-secondary-')
      .replace(/hover:bg-cyan-/g, 'hover:bg-secondary/')
      .replace(/hover:border-cyan-/g, 'hover:border-secondary/')
      .replace(/focus:border-cyan-/g, 'focus:border-secondary/')
      .replace(/focus:ring-cyan-/g, 'focus:ring-secondary/')
      .replace(/shadow-\[0_0_[^\]]*34,211,238[^\]]*\]/g, 'shadow-soft')
      .replace(/bg-zinc-950\/50/g, 'bg-slate-surface')
      .replace(/bg-zinc-950\/40/g, 'bg-slate-muted')
      .replace(/bg-black\/50/g, 'bg-white')
      .replace(/bg-black\/40/g, 'bg-slate-muted')
      .replace(/bg-black\/30/g, 'bg-slate-muted')
      .replace(/border-zinc-800/g, 'border-primary/10')
      .replace(/border-zinc-600/g, 'border-primary/20')
      .replace(/text-zinc-200/g, 'text-primary')
      .replace(/text-zinc-400/g, 'text-secondary')
      .replace(/text-zinc-500/g, 'text-secondary')
      .replace(/text-zinc-600/g, 'text-secondary')
      .replace(/text-white/g, 'text-primary')
      .replace(/placeholder-zinc-600/g, 'placeholder:text-secondary-muted')
      .replace(/rgba\(34, 211, 238/g, 'rgba(84, 122, 149')
      .replace(/#22d3ee/g, '#547A95')
      .replace(/#22c55e/g, '#547A95')
      .replace(/backdrop-blur-xl/g, '')
      .replace(/animate-pulse-glow/g, 'ring-2 ring-secondary/20')
      .replace(/animate-sos-pulse/g, 'animate-pulse')
  );
}

function writeFile(rel, content) {
  const dest = rel.includes('components/')
    ? path.join(RN, 'components/sentinelx', path.basename(rel))
    : rel.includes('hooks/')
      ? path.join(RN, rel)
      : path.join(RN, 'lib/sentinelx', path.basename(rel));
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, content);
  console.log('wrote', dest);
}

for (const f of [...LIB_FILES, ...HOOK_FILES]) {
  const raw = fs.readFileSync(path.join(SRC, f), 'utf8');
  let c = theme(raw);
  if (f.startsWith('hooks/')) writeFile(f, c);
  else if (f.startsWith('lib/')) writeFile(f, c);
}

for (const f of COMP_FILES) {
  let raw = fs.readFileSync(path.join(SRC, f), 'utf8');
  if (f === 'components/GeoTagEmergency.jsx') {
    raw = raw.replace("from './LiveMap'", "from './LiveMap'");
    raw = raw.replace("from '../hooks/useLiveGeolocation'", "from '../../hooks/useLiveGeolocation'");
    raw = raw.replace("import '../lib/leafletIcon'", "import '../../lib/sentinelx/leafletIcon'");
  }
  if (f === 'components/LiveMap.jsx') {
    raw = raw.replace("from '../hooks/useLiveGeolocation'", "from '../../hooks/useLiveGeolocation'");
    raw = raw.replace("from '../lib/sentinelx/leafletIcon'", "from '../../lib/sentinelx/leafletIcon'");
    raw = raw.replace("from './MapUpdater'", "from './MapUpdater'");
    raw = raw.replace("from './MapClickSetLocation'", "from './MapClickSetLocation'");
  }
  writeFile(f, theme(raw));
}

// Severity heatmap rename
const heatPath = path.join(RN, 'components/sentinelx/HeatmapPlaceholder.jsx');
if (fs.existsSync(heatPath)) {
  let h = fs.readFileSync(heatPath, 'utf8');
  h = h.replace('HeatmapPlaceholder', 'SeverityHeatmap').replace('export default function HeatmapPlaceholder', 'export default function SeverityHeatmap');
  fs.writeFileSync(path.join(RN, 'components/sentinelx/SeverityHeatmap.jsx'), h);
  fs.unlinkSync(heatPath);
}

const analyticsPath = path.join(RN, 'components/sentinelx/AnalyticsDashboard.jsx');
if (fs.existsSync(analyticsPath)) {
  let a = fs.readFileSync(analyticsPath, 'utf8');
  a = a.replace('AnalyticsDashboard', 'LiveAnalytics').replace('export default function AnalyticsDashboard', 'export default function LiveAnalytics');
  fs.writeFileSync(path.join(RN, 'components/sentinelx/LiveAnalytics.jsx'), a);
  fs.unlinkSync(analyticsPath);
}

// EmergencyGeoSection for RescueNet paths
const sectionSrc = fs.readFileSync(path.join(SRC, 'sections/EmergencyGeoSection.jsx'), 'utf8');
const sectionRn = theme(
  sectionSrc
    .replace("from '../components/GeoTagEmergency'", "from '../components/sentinelx/GeoTagEmergency'")
    .replace("from '../components/RealtimeAlerts'", "from '../components/sentinelx/RealtimeAlerts'")
    .replace("from '../components/SafetyInstructions'", "from '../components/sentinelx/SafetyInstructions'")
    .replace("from '../components/SeverityHeatmap'", "from '../components/sentinelx/SeverityHeatmap'")
    .replace("from '../components/LiveAnalytics'", "from '../components/sentinelx/LiveAnalytics'")
    .replace("from '../lib/coordinatorFeed'", "from '../lib/sentinelx/coordinatorFeed'")
    .replace("from '../lib/sortAlerts'", "from '../lib/sentinelx/sortAlerts'")
);
const sectionDest = path.join(RN, 'sections/EmergencyGeoSection.jsx');
fs.mkdirSync(path.dirname(sectionDest), { recursive: true });
fs.writeFileSync(sectionDest, sectionRn);
console.log('wrote', sectionDest);

console.log('Done. Run: node scripts/patch-rescuenet-dashboard.mjs');
