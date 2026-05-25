import { useState, useEffect } from 'react';
import { LanguageProvider } from './lib/LanguageContext';
import { AuthProvider, useAuth, getDefaultPageForRole } from './lib/AuthContext';
import { searchFacilitiesForQueryAsync } from './lib/geoSearch';
import { loadIndiaFacilities, getFacilitiesSync } from './lib/facilitiesData';
import { useLang } from './lib/LanguageContext';
import { t } from './lib/i18n';
import LoadingOverlay from './components/LoadingOverlay';
import LandingNav from './components/LandingNav';
import AppSidebar from './components/AppSidebar';
import DashboardTopBar from './components/DashboardTopBar';
import MobileBottomNav from './components/MobileBottomNav';
import SiteFooter from './components/SiteFooter';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import SOSPage from './pages/SOSPage';
import LiveMapPage from './pages/LiveMapPage';
import CoordinatorPage from './pages/CoordinatorPage';
import ResponderPage from './pages/ResponderPage';
import AlertsPage from './pages/AlertsPage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import { parseHashRoute, setHashRoute } from './lib/routing';

function AppInner() {
  const { lang } = useLang();
  const { user, ready } = useAuth();
  const [loading, setLoading] = useState(true);
  const [page, setPageState] = useState('home');
  const [loginRoleHint, setLoginRoleHint] = useState(null);

  const setPage = (next) => {
    setPageState(next);
    setHashRoute(next, next === 'login' ? loginRoleHint : null);
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLocation, setSearchLocation] = useState(null);
  const [searchPlace, setSearchPlace] = useState(null);
  const [searchPlaceTick, setSearchPlaceTick] = useState(0);
  const [searching, setSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [facilitiesReady, setFacilitiesReady] = useState(false);

  useEffect(() => {
    loadIndiaFacilities().then(() => setFacilitiesReady(true));
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const protectedPages = {
    coordinator: ['alerts', 'coordinator'],
    responder: ['responder'],
  };

  /* URL hash → page (shareable test links) */
  useEffect(() => {
    const applyHash = () => {
      const { page: hashPage, role } = parseHashRoute();
      if (role) setLoginRoleHint(role);
      if (!hashPage) return;

      if (hashPage === 'responder') {
        if (user?.role === 'responder') setPageState('responder');
        else {
          setLoginRoleHint('responder');
          setPageState('login');
        }
        return;
      }

      if (hashPage === 'login') {
        setPageState('login');
        return;
      }

      const needsAuth = protectedPages.coordinator.includes(hashPage);
      if (needsAuth && !user) {
        setLoginRoleHint('coordinator');
        setPageState('login');
        return;
      }
      setPageState(hashPage);
    };

    applyHash();
    window.addEventListener('hashchange', applyHash);
    return () => window.removeEventListener('hashchange', applyHash);
  }, [user, ready]);

  useEffect(() => {
    if (!ready) return;
    if (user && page === 'login') {
      const target = getDefaultPageForRole(user.role);
      setPageState(target);
      setHashRoute(target);
    }
    if (!user && [...protectedPages.coordinator, ...protectedPages.responder].includes(page)) {
      setLoginRoleHint(page === 'responder' ? 'responder' : 'coordinator');
      setPageState('login');
      setHashRoute('login', page === 'responder' ? 'responder' : 'coordinator');
    }
    if (user?.role === 'responder' && protectedPages.coordinator.includes(page)) {
      setPageState('responder');
      setHashRoute('responder');
    }
    if (user?.role === 'coordinator' && page === 'responder') {
      setPageState('alerts');
      setHashRoute('alerts');
    }
    if (user?.role === 'responder' && page === 'dashboard') {
      setPageState('responder');
      setHashRoute('responder');
    }
    if (!user && page === 'dashboard') {
      setPageState('sos');
      setHashRoute('sos');
    }
    if (user?.role !== 'coordinator' && user?.role !== 'responder' && page === 'dashboard') {
      setPageState('sos');
      setHashRoute('sos');
    }
  }, [user, ready, page]);

  useEffect(() => {
    const run = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        setSearchLocation(null);
        setSearchPlace(null);
        return;
      }
      setSearching(true);
      try {
        await loadIndiaFacilities();
        const facilities = getFacilitiesSync();
        const { place, facilities: found } = await searchFacilitiesForQueryAsync(
          facilities,
          searchQuery,
          150
        );
        setSearchResults(found);
        if (place) {
          setSearchPlace(place);
          setSearchLocation({ lat: String(place.lat), lon: String(place.lng), display_name: place.label });
        } else {
          setSearchPlace(null);
          setSearchLocation(null);
        }
      } catch {
        setSearchResults([]);
        setSearchPlace(null);
        setSearchLocation(null);
      } finally {
        setSearching(false);
      }
    };
    const timer = setTimeout(run, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, facilitiesReady]);

  const applySearchPlace = (place) => {
    if (place?.lat == null || place?.lng == null) return;
    setSearchPlace(place);
    setSearchLocation({ lat: String(place.lat), lon: String(place.lng), display_name: place.label });
    setSearchPlaceTick((n) => n + 1);
    setSearchOpen(false);
  };

  if (loading || !ready) {
    return <LoadingOverlay message={t(lang, 'loading_app')} />;
  }

  if (page === 'login') {
    return (
      <div className="app-shell min-h-screen bg-slate-bg">
        <LoginPage setPage={setPage} initialRole={loginRoleHint || 'coordinator'} />
      </div>
    );
  }

  const isLanding = page === 'home';

  if (isLanding) {
    return (
      <div className="app-shell flex min-h-screen flex-col bg-slate-bg">
        <LandingNav setPage={setPage} />
        <HomePage setPage={setPage} />
        <SiteFooter setPage={setPage} />
      </div>
    );
  }

  return (
    <div className="app-shell flex min-h-screen bg-slate-bg">
      <div className="hidden md:flex">
        <AppSidebar page={page} setPage={setPage} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0">
        <DashboardTopBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searching={searching}
          searchResults={searchResults}
          searchOpen={searchOpen}
          setSearchOpen={setSearchOpen}
          searchPlace={searchPlace}
          onClearSearch={() => {
            setSearchQuery('');
            setSearchResults([]);
            setSearchLocation(null);
            setSearchPlace(null);
            setSearchOpen(false);
          }}
          onSelectPlace={(place) => applySearchPlace(place)}
          onSelectResult={(facility) => {
            applySearchPlace({
              lat: facility.lat,
              lng: facility.lng,
              label: facility.name || facility.address,
            });
            if (page !== 'sos' && page !== 'responder') setPage('map');
            setSearchOpen(false);
          }}
        />
        <main className="page-transition flex-1 overflow-auto px-4 py-4 md:px-6 md:py-6">
          {page === 'dashboard' && <DashboardPage />}
          {page === 'sos' && (
            <SOSPage searchPlace={searchPlace} searchPlaceTick={searchPlaceTick} />
          )}
          {page === 'map' && (
            <LiveMapPage searchResults={searchResults} searchLocation={searchLocation} />
          )}
          {page === 'alerts' && <AlertsPage />}
          {page === 'coordinator' && <CoordinatorPage />}
          {page === 'responder' && (
            <ResponderPage searchPlace={searchPlace} searchPlaceTick={searchPlaceTick} />
          )}
          {page === 'profile' && <ProfilePage setPage={setPage} />}
          {page === 'home' && <HomePage setPage={setPage} />}
        </main>
      </div>
      <MobileBottomNav page={page} setPage={setPage} />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppInner />
      </AuthProvider>
    </LanguageProvider>
  );
}
