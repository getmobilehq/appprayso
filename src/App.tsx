import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';

const HomePage = lazy(() => import('./pages/HomePage').then(m => ({ default: m.HomePage })));
const PrayerWallPage = lazy(() => import('./pages/PrayerWallPage').then(m => ({ default: m.PrayerWallPage })));
const CirclesPage = lazy(() => import('./pages/CirclesPage').then(m => ({ default: m.CirclesPage })));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RoomDetailPage = lazy(() => import('./pages/RoomDetailPage').then(m => ({ default: m.RoomDetailPage })));
const CreateRoomPage = lazy(() => import('./pages/CreateRoomPage').then(m => ({ default: m.CreateRoomPage })));
const PrayerRequestDetailPage = lazy(() => import('./pages/PrayerRequestDetailPage').then(m => ({ default: m.PrayerRequestDetailPage })));
const CreatePrayerRequestPage = lazy(() => import('./pages/CreatePrayerRequestPage').then(m => ({ default: m.CreatePrayerRequestPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })));

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />
        <Route path="/" element={user ? <HomePage /> : <Navigate to="/login" />} />
        <Route path="/prayer-wall" element={user ? <PrayerWallPage /> : <Navigate to="/login" />} />
        <Route path="/circles" element={user ? <CirclesPage /> : <Navigate to="/login" />} />
        <Route path="/room/:id" element={user ? <RoomDetailPage /> : <Navigate to="/login" />} />
        <Route path="/create-room" element={user ? <CreateRoomPage /> : <Navigate to="/login" />} />
        <Route path="/prayer-request/:id" element={user ? <PrayerRequestDetailPage /> : <Navigate to="/login" />} />
        <Route path="/create-prayer-request" element={user ? <CreatePrayerRequestPage /> : <Navigate to="/login" />} />
        <Route path="/profile" element={user ? <ProfilePage /> : <Navigate to="/login" />} />
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
