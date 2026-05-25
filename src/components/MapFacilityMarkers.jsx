import { useEffect, useState } from 'react';
import { Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useLang } from '../lib/LanguageContext';
import { t } from '../lib/i18n';
import { FacilityIcon } from '../lib/iconMaps';
import { saveShelterToProfile } from '../pages/ProfilePage';

const COLORS = { shelter: '#2a5f8f', hospital: '#c0392b', relief: '#27ae60' };

function makeIcon(color) {
  return L.divIcon({
    className: '',
    html: `<div style="width:10px;height:10px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 1px 4px rgba(44,57,71,0.35)"></div>`,
    iconSize: [10, 10],
    iconAnchor: [5, 5],
  });
}

const ICONS = {
  shelter: makeIcon(COLORS.shelter),
  hospital: makeIcon(COLORS.hospital),
  relief: makeIcon(COLORS.relief),
};

function ViewportMarkers({ facilities, filter, onSelect }) {
  const map = useMap();
  const [visible, setVisible] = useState([]);

  useEffect(() => {
    const update = () => {
      const b = map.getBounds();
      const list = facilities.filter((f) => {
        if (filter !== 'all' && f.type !== filter) return false;
        return b.contains([f.lat, f.lng]);
      });
      setVisible(list.slice(0, 250));
    };
    update();
    map.on('moveend', update);
    map.on('zoomend', update);
    return () => {
      map.off('moveend', update);
      map.off('zoomend', update);
    };
  }, [map, facilities, filter]);

  const { lang } = useLang();

  return (
    <>
      {visible.map((facility) => (
        <Marker
          key={facility.id}
          position={[facility.lat, facility.lng]}
          icon={ICONS[facility.type] || ICONS.shelter}
          eventHandlers={{ click: () => onSelect(facility) }}
        >
          <Popup>
            <div className="min-w-[200px] py-1">
              <div className="mb-2 flex items-center gap-2">
                <FacilityIcon type={facility.type} className="h-4 w-4 text-secondary" />
                <strong className="text-sm text-primary">{facility.name}</strong>
              </div>
              <p className="mb-2 text-xs text-muted">{facility.address}</p>
              <p className="text-xs">
                <span className="text-muted">{t(lang, 'map_capacity')}:</span> {facility.capacity}
              </p>
              <p className="text-xs">
                <span className="text-muted">{t(lang, 'map_available')}:</span>{' '}
                <span className="font-semibold text-emerald-600">{facility.available}</span>
              </p>
              {facility.phone && (
                <p className="text-xs mt-1">
                  <span className="text-muted">{t(lang, 'map_phone')}:</span> {facility.phone}
                </p>
              )}
              {facility.contact && (
                <p className="text-xs">
                  <span className="text-muted">{t(lang, 'map_contact')}:</span> {facility.contact}
                </p>
              )}
              {facility.type === 'shelter' && (
                <button
                  type="button"
                  className="mt-2 text-[10px] font-bold text-secondary underline"
                  onClick={() => saveShelterToProfile(facility)}
                >
                  {t(lang, 'profile_shelters')}
                </button>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
}

export default function MapFacilityMarkers({ facilities, filter, onSelect }) {
  if (!facilities?.length) return null;
  return <ViewportMarkers facilities={facilities} filter={filter} onSelect={onSelect} />;
}
