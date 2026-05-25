# Merge SentinelX into RescueNet (Desktop app)

## Option A — Preview merged UI in `d:\cu` (ready now)

```powershell
cd d:\cu
npm run dev
```

Open http://localhost:5173 — **RescueNet** colors + dashboard + geo-tag section below.

## Option B — Copy into `C:\Users\Yuvaraj B\Desktop\RescueNet`

### 1. Copy SentinelX files

```powershell
$RN = "C:\Users\Yuvaraj B\Desktop\RescueNet\src"
$CU = "d:\cu\src"

New-Item -ItemType Directory -Force "$RN\sections", "$RN\components\sentinelx", "$RN\lib\sentinelx", "$RN\hooks" | Out-Null

Copy-Item "$CU\sections\EmergencyGeoSection.jsx" "$RN\sections\" -Force
Copy-Item "$CU\hooks\useLiveGeolocation.js" "$RN\hooks\" -Force
Copy-Item "$CU\lib\sortAlerts.js", "$CU\lib\geoUtils.js", "$CU\lib\coordinatorFeed.js", "$CU\lib\geoErrors.js", "$CU\lib\ipGeolocation.js", "$CU\lib\firebase.js", "$CU\lib\leafletIcon.js" "$RN\lib\sentinelx\" -Force
Copy-Item "$CU\components\GeoTagEmergency.jsx", "$CU\components\LiveMap.jsx", "$CU\components\MapUpdater.jsx", "$CU\components\MapClickSetLocation.jsx", "$CU\components\RealtimeAlerts.jsx", "$CU\components\SafetyInstructions.jsx", "$CU\components\HeatmapPlaceholder.jsx", "$CU\components\AnalyticsDashboard.jsx" "$RN\components\sentinelx\" -Force
```

Fix imports in `sentinelx` files: change `../hooks/` → `../../hooks/`, `../lib/` → `../../lib/sentinelx/`, `import '../lib/leafletIcon'` → `import '../../lib/sentinelx/leafletIcon'`.

Or run: `node d:\cu\scripts\merge-to-rescuenet.mjs`

### 2. Add to `DashboardPage.jsx`

```jsx
import EmergencyGeoSection from '../sections/EmergencyGeoSection';

// Before closing </div> of page:
<EmergencyGeoSection />
```

### 3. Add CSS to `src/index.css` (marker + leaflet — from `d:\cu\src\index.css` bottom section)

### 4. `main.jsx` already has `leaflet/dist/leaflet.css`

## RescueNet colors used

| Token | Hex |
|-------|-----|
| Background | `#E8EDF2` |
| Surface | `#FFFFFF` |
| Primary text | `#2C3947` |
| Secondary | `#547A95` |
| Accent | `#C2A56D` |

## Features merged

- Geo-tagged emergency reporting
- Live GPS tracking & coordinator feed (newest on top)
- Severity Heatmap
- Live Analytics
- SOS + optional description
