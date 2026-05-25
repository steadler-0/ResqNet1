import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';

function zoomForAccuracy(accuracy, source) {
  if (source === 'ip') return 13;
  if (accuracy == null || accuracy > 500) return 14;
  if (accuracy > 150) return 15;
  if (accuracy > 50) return 16;
  if (accuracy > 20) return 17;
  return 18;
}

export default function MapUpdater({ latitude, longitude, accuracy, locationSource }) {
  const map = useMap();
  const firstPan = useRef(true);

  useEffect(() => {
    if (latitude == null || longitude == null) return;

    const center = [latitude, longitude];
    const zoom = zoomForAccuracy(accuracy, locationSource);
    const animate = !firstPan.current;
    firstPan.current = false;

    map.setView(center, zoom, { animate, duration: animate ? 0.4 : 0 });
  }, [map, latitude, longitude, accuracy, locationSource]);

  return null;
}
