import { Routes, Route, useLocation } from 'react-router-dom';
import React, { Suspense, lazy, useEffect, useState, useRef } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ErrorBoundary from './components/ErrorBoundary';
import KeyboardShortcuts from './components/KeyboardShortcuts';
import TutorialOverlay from './components/TutorialOverlay';
import BackToTop from './components/BackToTop';
import QuickSearch from './components/QuickSearch';

const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Problems = lazy(() => import('./pages/Problems'));
const ProblemDetail = lazy(() => import('./pages/ProblemDetail'));
const Submissions = lazy(() => import('./pages/Submissions'));
const Admin = lazy(() => import('./pages/Admin'));
const AdminProblemForm = lazy(() => import('./pages/AdminProblemForm'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const Profile = lazy(() => import('./pages/Profile'));
const NotFound = lazy(() => import('./pages/NotFound'));
const SystemHealth = lazy(() => import('./pages/SystemHealth'));
const ApiDocs = lazy(() => import('./pages/ApiDocs'));

export default function App() {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState('enter');
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (location.pathname !== displayLocation.pathname) {
      setTransitionStage('exit');
      timeoutRef.current = setTimeout(() => {
        setDisplayLocation(location);
        setTransitionStage('enter');
      }, 150);
    }
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [location, displayLocation]);

  return (
    <div className="min-h-screen bg-dark-950">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ErrorBoundary>
          <Suspense fallback={
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        }>
          <div
            className="transition-all duration-150 ease-out"
            style={{
              opacity: transitionStage === 'enter' ? 1 : 0,
              transform: transitionStage === 'enter' ? 'translateY(0)' : 'translateY(8px)',
            }}
          >
            <Routes location={displayLocation}>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/problems" element={<Problems />} />
              <Route path="/problems/:id" element={<ProblemDetail />} />
              <Route path="/submissions" element={<Submissions />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/admin/problems/new" element={<AdminProblemForm />} />
              <Route path="/admin/problems/:id/edit" element={<AdminProblemForm />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/system" element={<SystemHealth />} />
              <Route path="/api-docs" element={<ApiDocs />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </Suspense>
        </ErrorBoundary>
        <Footer />
      </main>
        <KeyboardShortcuts />
        <TutorialOverlay />
        <BackToTop />
        <QuickSearch />
      </div>
  );
}
