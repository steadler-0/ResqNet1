# SentinelX — Disaster Response Coordination Platform

Modern futuristic disaster response dashboard with geo-tagged citizen emergency reporting, live Leaflet maps, and Firebase-ready backend placeholders.

## Tech Stack

- **React 19** + **Vite**
- **Tailwind CSS v4**
- **React Leaflet** + **Leaflet.js** (OpenStreetMap)
- **Firebase** (optional — placeholders included)

## Quick Start

Node.js lives at **`D:\Node`** (on system PATH). If PowerShell says `node` is not recognized, **close and reopen the terminal** (or restart Cursor), then:

```powershell
cd D:\cu
.\setup.ps1   # optional: refreshes PATH for current session
npm install
npm run dev
```

```bash
npm install
npm run dev
npm run build
```

Open `http://localhost:5173` and **allow location permissions** for GPS geo-tagging.

## NPM Packages

```bash
npm install react react-dom leaflet react-leaflet firebase
npm install -D vite @vitejs/plugin-react tailwindcss @tailwindcss/vite
```

## Folder Structure

```
src/
├── components/
│   ├── GeoTagEmergency.jsx    # Main feature: geo-tagged emergency reporting
│   ├── LiveMap.jsx            # React Leaflet map (zoom 15, OSM tiles)
│   ├── HeroSection.jsx
│   ├── StatusCards.jsx
│   ├── RealtimeAlerts.jsx
│   ├── SafetyInstructions.jsx # AI multilingual placeholder
│   ├── ResourceCards.jsx
│   ├── HeatmapPlaceholder.jsx
│   ├── AnalyticsDashboard.jsx
│   └── LoadingOverlay.jsx
├── lib/
│   ├── firebase.js            # Firebase Auth + Firestore placeholders
│   └── leafletIcon.js         # Fixes default Leaflet marker icons
├── App.jsx
├── main.jsx
└── index.css                  # Tailwind + animation utilities
```

## Features

- Citizen emergency reporting with browser Geolocation API
- Live latitude/longitude display
- Emergency types: Flood, Fire, Earthquake, Medical Emergency
- Severity: Low, Medium, High, Critical
- SOS button with pulse animation
- Live map with dynamic marker at GPS coordinates
- Real-time alerts feed (local state + Firebase hook)
- AI safety instructions placeholder (multilingual tabs)
- Resource availability cards
- Heatmap & analytics placeholders
- Active incidents & emergency request counters
- Dark cyber UI with cyan neon glassmorphism

## Firebase Integration

1. Create a project at [Firebase Console](https://console.firebase.google.com)
2. Enable **Authentication** and **Firestore**
3. Copy config into `src/lib/firebase.js`
4. Uncomment the Firebase imports and functions

## Supabase Alternative

Replace `src/lib/firebase.js` with Supabase client:

```bash
npm install @supabase/supabase-js
```

Use `supabase.from('emergencies').insert()` and Realtime subscriptions.

## Browser Notes

- HTTPS or `localhost` required for Geolocation API
- Leaflet marker icons are fixed via `src/lib/leafletIcon.js`

## License

MIT — Hackathon-ready starter project.
