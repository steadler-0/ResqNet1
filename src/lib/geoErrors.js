/** User-friendly messages for Geolocation API errors */
export function getGeolocationErrorMessage(error) {
  if (!error) return 'Unable to get your location.';

  switch (error.code) {
    case 1: // PERMISSION_DENIED
      return 'Location permission denied. Click the lock icon in the address bar → Allow location, then refresh.';
    case 2: // POSITION_UNAVAILABLE
      return 'GPS unavailable. Turn on Windows Location (Settings → Privacy → Location), allow browser access, then retry.';
    case 3: // TIMEOUT
      return 'Location request timed out. Move near a window, disable VPN, or use Demo Location below.';
    default:
      if (error.message?.includes('network service')) {
        return 'Windows location service failed. Enable Location in Windows Settings, restart the browser, or use Demo Location.';
      }
      return error.message || 'Unable to get your location.';
  }
}
