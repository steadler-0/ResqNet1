import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import { AlertTriangle } from 'lucide-react';
import { useLang } from '../lib/LanguageContext';
import { t } from '../lib/i18n';
import { INDIA_STATE_DISASTER_DATA } from '../data/rescueNetMock';
import '../lib/leafletIcon';

function intensityToColor(v) {
  if (v >= 80) return { fill: '#1a3a5c', border: '#0f2840', opacity: 0.92 };
  if (v >= 60) return { fill: '#2a5f8f', border: '#1e4a70', opacity: 0.85 };
  if (v >= 40) return { fill: '#4a89b5', border: '#3a6e96', opacity: 0.78 };
  return { fill: '#8db8d4', border: '#7aa4c0', opacity: 0.65 };
}

const INDIA_STATES_GEOJSON_URL =
  'https://raw.githubusercontent.com/geohacker/india/master/state/india_telengana.geojson';

export default function DashboardPage() {
  const { lang } = useLang();
  const [tooltip, setTooltip] = useState(null);
  const [geoData, setGeoData] = useState(null);
  const [geoError, setGeoError] = useState(false);

  useEffect(() => {
    fetch(INDIA_STATES_GEOJSON_URL)
      .then(r => r.json())
      .then(d => setGeoData(d))
      .catch(() => setGeoError(true));
  }, []);

  const states = Object.entries(INDIA_STATE_DISASTER_DATA);
  const activeIncidents = states.reduce((sum, [, d]) => sum + d.incidents, 0);

  function onEachFeature(feature, layer) {
    const name = feature.properties?.NAME_1 || feature.properties?.ST_NM || '';
    const data = INDIA_STATE_DISASTER_DATA[name];
    if (!data) return;
    const col = intensityToColor(data.intensity);
    layer.setStyle({
      fillColor: col.fill,
      fillOpacity: col.opacity,
      color: col.border,
      weight: 1.2,
    });
    layer.on({
      mouseover(e) {
        e.target.setStyle({ weight: 2.5, color: '#c2a16d', fillOpacity: Math.min(col.opacity + 0.08, 1) });
        setTooltip({ name, ...data });
      },
      mouseout(e) {
        e.target.setStyle({ weight: 1.2, color: col.border, fillOpacity: col.opacity });
        setTooltip(null);
      },
    });
  }

  return (
    <div className="rn-fade-in max-w-6xl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-primary md:text-3xl">{t(lang, 'dash_title')}</h1>
        <p className="mt-1 text-sm text-muted">{t(lang, 'dash_subtitle')}</p>
      </header>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rn-card flex items-start gap-4 sm:max-w-xs">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary/10">
            <AlertTriangle size={20} className="text-secondary" strokeWidth={2} />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
              {t(lang, 'dash_active_incidents')}
            </p>
            <p className="mt-1 text-3xl font-bold text-primary">{activeIncidents}</p>
          </div>
        </div>
      </div>

      <div className="rn-card overflow-hidden p-0">
        <div className="border-b border-primary/5 px-5 py-4 md:px-6">
          <h2 className="text-lg font-bold text-primary">{t(lang, 'dash_heatmap_title')}</h2>
          <p className="mt-0.5 text-sm text-muted">{t(lang, 'dash_heatmap_subtitle')}</p>
        </div>

        <div className="relative h-[420px] md:h-[480px]">
          {tooltip && (
            <div className="absolute top-3 left-3 z-[999] min-w-[200px] rounded-xl border border-primary/10 bg-white/95 px-4 py-3 shadow-soft backdrop-blur">
              <p className="text-sm font-bold text-primary">{tooltip.name}</p>
              <div className="mt-2 space-y-1 text-xs">
                <div className="flex justify-between gap-6">
                  <span className="text-muted">{t(lang, 'dash_intensity')}</span>
                  <span className="font-bold text-primary">{tooltip.intensity}%</span>
                </div>
                <div className="flex justify-between gap-6">
                  <span className="text-muted">{t(lang, 'dash_incidents')}</span>
                  <span className="font-bold text-primary">{tooltip.incidents}</span>
                </div>
              </div>
            </div>
          )}

          {geoError ? (
            <FallbackGrid />
          ) : !geoData ? (
            <div className="flex h-full items-center justify-center bg-slate-muted/30">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-secondary border-t-transparent" />
            </div>
          ) : (
            <MapContainer center={[22.5, 82.5]} zoom={4} scrollWheelZoom className="h-full w-full">
              <TileLayer
                attribution='&copy; OpenStreetMap'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                opacity={0.3}
              />
              <GeoJSON data={geoData} onEachFeature={onEachFeature} />
            </MapContainer>
          )}
        </div>
      </div>
    </div>
  );
}

function FallbackGrid() {
  const states = Object.entries(INDIA_STATE_DISASTER_DATA).sort((a, b) => b[1].intensity - a[1].intensity);
  return (
    <div className="h-full overflow-y-auto p-4">
      <p className="mb-3 text-xs text-muted">Grid view · map data unavailable</p>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {states.map(([state, data]) => {
          const col = intensityToColor(data.intensity);
          return (
            <div
              key={state}
              className="rounded-lg p-2 text-center"
              style={{ background: `${col.fill}33`, border: `1px solid ${col.fill}` }}
            >
              <p className="truncate text-[9px] font-bold text-primary">{state.split(' ')[0]}</p>
              <p className="mt-0.5 text-xs font-black" style={{ color: col.fill }}>{data.intensity}%</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
