import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { MapPin, Phone } from 'lucide-react';
import { useLang } from '../lib/LanguageContext';
import { t } from '../lib/i18n';
import { loadIndiaFacilities, getFacilitiesSync } from '../lib/facilitiesData';
import { facilitiesNearby, geocodeLocation } from '../lib/geoSearch';
import { FacilityIcon } from '../lib/iconMaps';
import MapFacilityMarkers from '../components/MapFacilityMarkers';
import SearchInput from '../components/SearchInput';
import '../lib/leafletIcon';

function MapFlyTo({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (lat != null && lng != null) map.flyTo([lat, lng], 8, { duration: 1.2 });
  }, [lat, lng, map]);
  return null;
}

function FitIndia() {
  const map = useMap();
  useEffect(() => {
    map.fitBounds([[8, 68], [37.5, 97.5]], { padding: [20, 20] });
  }, [map]);
  return null;
}

const TYPE_FILTERS = [
  { id: 'all', label: 'map_all', color: '#547a95' },
  { id: 'shelter', label: 'map_shelters', color: '#2a5f8f' },
  { id: 'hospital', label: 'map_hospitals', color: '#c0392b' },
  { id: 'relief', label: 'map_relief', color: '#27ae60' },
];

export default function LiveMapPage({ searchResults, searchLocation }) {
  const { lang } = useLang();
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [localResults, setLocalResults] = useState([]);
  const [flyTarget, setFlyTarget] = useState(null);
  const [allFacilities, setAllFacilities] = useState(getFacilitiesSync());
  const [counts, setCounts] = useState({ shelter: 0, hospital: 0, relief: 0 });

  useEffect(() => {
    loadIndiaFacilities().then((list) => {
      setAllFacilities(list);
      setCounts({
        shelter: list.filter((f) => f.type === 'shelter').length,
        hospital: list.filter((f) => f.type === 'hospital').length,
        relief: list.filter((f) => f.type === 'relief').length,
      });
    });
  }, []);

  const baseList =
    localResults.length > 0
      ? localResults
      : searchResults?.length > 0
        ? searchResults
        : allFacilities;

  const filtered =
    filter === 'all' ? baseList : baseList.filter((f) => f.type === filter);

  const listPreview = filtered.slice(0, 80);

  const clearMapSearch = () => {
    setSearchQuery('');
    setLocalResults([]);
    setFlyTarget(null);
    setSelected(null);
  };

  const handleSearch = async (q) => {
    if (!q.trim()) {
      setLocalResults([]);
      setFlyTarget(null);
      return;
    }
    setSearching(true);
    try {
      const results = await geocodeLocation(q);
      if (results?.length > 0) {
        const { lat, lon } = results[0];
        const nearby = facilitiesNearby(allFacilities, parseFloat(lat), parseFloat(lon), 120);
        setLocalResults(nearby.slice(0, 100));
        setFlyTarget({ lat: parseFloat(lat), lng: parseFloat(lon) });
      } else setLocalResults([]);
    } catch {
      setLocalResults([]);
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => handleSearch(searchQuery), 600);
    return () => clearTimeout(timer);
  }, [searchQuery, allFacilities]);

  useEffect(() => {
    if (searchResults?.length > 0 && searchLocation) {
      setLocalResults(searchResults);
      setFlyTarget({
        lat: parseFloat(searchLocation.lat),
        lng: parseFloat(searchLocation.lon),
      });
    }
  }, [searchResults, searchLocation]);

  return (
    <div className="mx-auto max-w-6xl pb-4">
      <div className="mb-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-secondary">
          {allFacilities.length}+ {t(lang, 'map_facilities_count')}
        </p>
        <h1 className="text-xl font-bold text-primary md:text-2xl">{t(lang, 'map_title')}</h1>
        <p className="text-sm text-muted">{t(lang, 'map_subtitle')}</p>
        <p className="mt-1 text-xs text-muted">
          {counts.shelter}+ {t(lang, 'map_shelters')} · {counts.hospital}+ {t(lang, 'map_hospitals')} ·{' '}
          {counts.relief}+ {t(lang, 'map_relief')}
        </p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="min-w-[200px] flex-1 max-w-sm">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            onClear={clearMapSearch}
            placeholder={t(lang, 'map_search_area')}
            searching={searching}
            inputClassName={`rn-input pl-11 ${searchQuery.trim() || searching ? 'pr-20' : 'pr-4'}`}
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                filter === f.id
                  ? 'border-primary bg-primary text-white'
                  : 'border-primary/10 bg-white text-muted'
              }`}
            >
              {t(lang, f.label)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rn-card overflow-hidden p-0">
            <div className="relative h-[50vh] min-h-[320px] md:h-[520px]">
              <MapContainer center={[22.5, 82.5]} zoom={5} scrollWheelZoom className="h-full w-full">
                <TileLayer
                  attribution="© OpenStreetMap"
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <FitIndia />
                {flyTarget && <MapFlyTo lat={flyTarget.lat} lng={flyTarget.lng} />}
                <MapFacilityMarkers
                  facilities={localResults.length > 0 || searchResults?.length > 0 ? filtered : allFacilities}
                  filter={filter}
                  onSelect={setSelected}
                />
              </MapContainer>
              <div className="absolute bottom-3 left-3 z-[999] rounded-xl border border-primary/10 bg-white/95 px-3 py-2 shadow-soft backdrop-blur">
                {TYPE_FILTERS.filter((f) => f.id !== 'all').map((l) => (
                  <div key={l.id} className="mb-1 flex items-center gap-2 last:mb-0">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: l.color }} />
                    <span className="text-[10px] text-muted">{t(lang, l.label)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-bold text-primary">
            {listPreview.length}
            {filtered.length > listPreview.length ? ` / ${filtered.length}` : ''}{' '}
            {t(lang, filter === 'all' ? 'map_all' : TYPE_FILTERS.find((f) => f.id === filter)?.label)}
          </h3>
          {(localResults.length > 0 || searchResults?.length > 0) && (
            <span className="text-[10px] text-muted">{t(lang, 'map_near_search')}</span>
          )}
          <div className="max-h-[50vh] space-y-2 overflow-y-auto md:max-h-[520px]">
            {(selected ? [selected, ...listPreview.filter((f) => f.id !== selected.id)] : listPreview).map(
              (f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setSelected(f)}
                  className={`w-full rounded-xl border p-3 text-left transition ${
                    selected?.id === f.id
                      ? 'border-secondary/40 bg-secondary/10'
                      : 'border-primary/8 bg-white hover:border-secondary/25'
                  }`}
                >
                  <div className="flex gap-2">
                    <FacilityIcon type={f.type} className="h-5 w-5 shrink-0 text-secondary" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-primary">{f.name}</p>
                      <p className="truncate text-[10px] text-muted">{f.address}</p>
                      <p className="mt-1 text-[10px] text-muted">
                        <span className="font-semibold text-emerald-600">{f.available}</span>/{f.capacity}
                      </p>
                      {f.distance != null && (
                        <p className="inline-flex items-center gap-0.5 text-[10px] text-secondary">
                          <MapPin size={10} />
                          {f.distance.toFixed(1)} {t(lang, 'map_km')}
                        </p>
                      )}
                      {f.phone && (
                        <p className="mt-1 flex items-center gap-1 text-[10px] text-muted">
                          <Phone size={10} />
                          {f.phone}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
