import { useState, useEffect } from 'react';
import { LanguageProvider } from './lib/LanguageContext';
import { AuthProvider, useAuth, getDefaultPageForRole } from './lib/AuthContext';
import { geocodeLocation, facilitiesNearby } from './lib/geoSearch';
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
import AlertsPage from './pages/AlertsPage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';

function AppInner() {
  const { lang } = useLang();
  const { user, ready } = useAuth();
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLocation, setSearchLocation] = useState(null);
  const [searching, setSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [facilitiesReady, setFacilitiesReady] = useState(false);

  useEffect(() => {
    loadIndiaFacilities().then(() => setFacilitiesReady(true));
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const protectedPages = ['dashboard', 'sos', 'map', 'alerts', 'coordinator', 'profile'];

  useEffect(() => {
    if (!ready) return;
    if (user && page === 'login') {
      setPage(getDefaultPageForRole(user.role));
    }
    if (!user && protectedPages.includes(page)) {
      setPage('login');
    }
  }, [user, ready, page]);

  useEffect(() => {
    const run = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }
      setSearching(true);
      try {
        const results = await geocodeLocation(searchQuery);
        const facilities = getFacilitiesSync();
        if (results?.length > 0) {
          const { lat, lon } = results[0];
          const nearby = facilitiesNearby(facilities, parseFloat(lat), parseFloat(lon), 300);
          setSearchResults(nearby.slice(0, 50));
          setSearchLocation(results[0]);
        } else {
          setSearchResults([]);
        }
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    };
    const timer = setTimeout(run, 600);
    return () => clearTimeout(timer);
  }, [searchQuery, facilitiesReady]);

  if (loading || !ready) {
    return <LoadingOverlay message={t(lang, 'loading_app')} />;
  }

  if (page === 'login') {
    return (
      <div className="app-shell min-h-screen bg-slate-bg">
        <LoginPage setPage={setPage} />
      </div>
    );
  }

  const isLanding = page === 'home' && !user;

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
          onSelectResult={() => {
            setPage('map');
            setSearchOpen(false);
          }}
        />
        <main className="page-transition flex-1 overflow-auto px-4 py-4 md:px-6 md:py-6">
          {page === 'dashboard' && <DashboardPage />}
          {page === 'sos' && <SOSPage />}
          {page === 'map' && (
            <LiveMapPage searchResults={searchResults} searchLocation={searchLocation} />
          )}
          {page === 'alerts' && <AlertsPage />}
          {page === 'coordinator' && <CoordinatorPage />}
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
