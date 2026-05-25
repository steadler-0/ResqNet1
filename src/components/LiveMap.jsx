import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline } from 'react-leaflet';
import { userLocationIcon } from '../lib/leafletIcon';
import { DEFAULT_MAP_CENTER } from '../hooks/useLiveGeolocation';
import MapUpdater from './MapUpdater';
import MapClickSetLocation from './MapClickSetLocation';

export default function LiveMap({
  latitude,
  longitude,
  emergencyType,
  severity,
  trail = [],
  accuracy,
  locationSource,
  loading = false,
  onMapClickPick,
  allowMapPick = true,
}) {
  const hasFix = latitude != null && longitude != null;
  const center = hasFix ? [latitude, longitude] : DEFAULT_MAP_CENTER;
  const isUnreliable = locationSource === 'ip' || (accuracy != null && accuracy > 200);

  const severityColors = {
    Low: '#22c55e',
    Medium: '#eab308',
    High: '#f97316',
    Critical: '#ef4444',
  };

  const accuracyRadius =
    locationSource === 'manual'
      ? 15
      : locationSource === 'gps' && accuracy != null && accuracy > 0
        ? Math.max(accuracy, 8)
        : locationSource === 'ip'
          ? 3000
          : 80;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-secondary/30 shadow-[0_0_30px_rgba(34,211,238,0.12)]">
      {loading && !hasFix && (
        <div className="absolute inset-0 z-[1001] flex items-center justify-center bg-primary/60 backdrop-blur-sm">
          <p className="animate-pulse text-sm font-medium text-secondary">Getting GPS…</p>
        </div>
      )}

      {isUnreliable && hasFix && (
        <div className="absolute left-2 right-2 top-2 z-[1002] rounded-lg border border-red-500/60 bg-red-950/90 px-3 py-2 text-center text-xs font-semibold text-red-200">
          ⚠ Location may be wrong — tap the map at your real position
        </div>
      )}

      {hasFix && (
        <div className="absolute bottom-10 left-2 z-[1001] max-w-[90%] rounded-lg border border-secondary/40 bg-primary/90 px-2 py-1 font-mono text-[10px] leading-tight text-secondary">
          {latitude.toFixed(6)}
          <br />
          {longitude.toFixed(6)}
        </div>
      )}

      <p className="absolute bottom-2 left-0 right-0 z-[1001] text-center text-[11px] font-medium text-secondary">
        👆 Tap map to place exact emergency location
      </p>

      <MapContainer
        center={center}
        zoom={hasFix ? 17 : 12}
        scrollWheelZoom
        className="h-[320px] w-full md:h-[400px]"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapUpdater
          latitude={latitude}
          longitude={longitude}
          accuracy={accuracy}
          locationSource={locationSource}
        />
        {onMapClickPick && (
          <MapClickSetLocation onPick={onMapClickPick} enabled={allowMapPick} />
        )}
        {trail.length > 1 && (
          <Polyline
            positions={trail}
            pathOptions={{ color: '#547A95', weight: 3, opacity: 0.7, dashArray: '8 8' }}
          />
        )}
        {hasFix && (
          <>
            <Marker position={center} icon={userLocationIcon}>
              <Popup>
                <div className="text-sm">
                  <strong>Emergency location</strong>
                  <br />
                  {latitude.toFixed(6)}, {longitude.toFixed(6)}
                  {accuracy != null && (
                    <>
                      <br />
                      ±{Math.round(accuracy)}m
                    </>
                  )}
                </div>
              </Popup>
            </Marker>
            <Circle
              center={center}
              radius={accuracyRadius}
              pathOptions={{
                color: isUnreliable ? '#ef4444' : severityColors[severity] || '#547A95',
                fillColor: isUnreliable ? '#ef4444' : severityColors[severity] || '#547A95',
                fillOpacity: 0.1,
                weight: 2,
                dashArray: isUnreliable ? '8 4' : undefined,
              }}
            />
          </>
        )}
      </MapContainer>
    </div>
  );
}
