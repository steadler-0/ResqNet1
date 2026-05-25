import { useMapEvents } from 'react-leaflet';

/** Tap map to place pin when GPS is inaccurate */
export default function MapClickSetLocation({ onPick, enabled }) {
  useMapEvents({
    click(e) {
      if (!enabled) return;
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}
