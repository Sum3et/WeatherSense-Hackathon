import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Public pages
import Home          from './pages/Home';
import Weather       from './pages/Weather';
import Predictions   from './pages/Predictions';
import Report        from './pages/Report';
import Reports       from './pages/Reports';
import About         from './pages/About';

// Admin pages
import AdminLogin     from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminReports   from './pages/AdminReports';
import AdminMap       from './pages/AdminMap';
import AdminAnalytics from './pages/AdminAnalytics';
import AdminSettings  from './pages/AdminSettings';

// Auth guard
import { useAuth } from './hooks/useAuth';

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf6ee] flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4" style={{ width: 40, height: 40, borderWidth: 3 }} />
          <p className="text-slate-600 text-sm font-medium">Authenticating...</p>
        </div>
      </div>
    );
  }
  return user ? children : <Navigate to="/admin/login" replace />;
}

// Layout wrapper for public pages
function PublicLayout({ children }) {
  return (
    <div className="min-h-screen bg-transparent flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

// Admin layout (no footer, different navbar mode)
function AdminLayout({ children }) {
  return (
    <div className="min-h-screen bg-transparent flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
    </div>
  );
}

import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('WeatherSense runtime error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#faf6ee] flex items-center justify-center p-6 text-center">
          <div className="max-w-md bg-white border border-sky-200 rounded-2xl p-8 shadow-xl">
            <div className="w-12 h-12 bg-amber-500/20 text-amber-600 rounded-xl flex items-center justify-center mx-auto mb-4 text-2xl">
              ⚠️
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Notice</h2>
            <p className="text-slate-600 text-sm mb-6">
              {this.state.error?.message || 'Something went wrong.'}
            </p>
            <button
              onClick={() => { this.setState({ hasError: false }); window.location.href = '/'; }}
              className="bg-sky-500 hover:bg-sky-600 text-white font-semibold px-6 py-2.5 rounded-xl transition shadow-md"
            >
              Reload WeatherSense
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1e293b',
            color: '#e2e8f0',
            border: '1px solid #334155',
          },
        }}
      />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
        <Route path="/weather" element={<PublicLayout><Weather /></PublicLayout>} />
        <Route path="/predictions" element={<PublicLayout><Predictions /></PublicLayout>} />
        <Route path="/report" element={<PublicLayout><Report /></PublicLayout>} />
        <Route path="/reports" element={<PublicLayout><Reports /></PublicLayout>} />
        <Route path="/about" element={<PublicLayout><About /></PublicLayout>} />

        {/* Admin auth */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Protected admin routes */}
        <Route path="/admin/dashboard" element={
          <RequireAuth><AdminLayout><AdminDashboard /></AdminLayout></RequireAuth>
        } />
        <Route path="/admin/reports" element={
          <RequireAuth><AdminLayout><AdminReports /></AdminLayout></RequireAuth>
        } />
        <Route path="/admin/map" element={
          <RequireAuth><AdminLayout><AdminMap /></AdminLayout></RequireAuth>
        } />
        <Route path="/admin/analytics" element={
          <RequireAuth><AdminLayout><AdminAnalytics /></AdminLayout></RequireAuth>
        } />
        <Route path="/admin/settings" element={
          <RequireAuth><AdminLayout><AdminSettings /></AdminLayout></RequireAuth>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </ErrorBoundary>
  );
}
