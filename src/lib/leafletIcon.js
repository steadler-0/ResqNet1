import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

/** Highly visible pulsing marker for citizen location */
export const userLocationIcon = L.divIcon({
  className: 'user-location-marker-wrapper',
  html: `
    <div class="user-location-marker">
      <span class="user-location-pulse"></span>
      <span class="user-location-dot"></span>
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

export const emergencyIcon = new L.Icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: 'custom-marker',
});

export default L;
