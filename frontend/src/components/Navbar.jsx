import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Cloud, Map, FileText, BarChart3, Settings, LogOut, Shield, Activity, Sparkles } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const NAV_LINKS = [
  { to: '/',            label: 'Home',        icon: null },
  { to: '/weather',     label: 'Weather',     icon: null },
  { to: '/predictions', label: 'Predictions', badge: 'AI', icon: Sparkles },
  { to: '/reports',     label: 'Reports',     icon: null },
  { to: '/about',       label: 'About',       icon: null },
];

const ADMIN_LINKS = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: Activity },
  { to: '/admin/reports',   label: 'Reports',   icon: FileText },
  { to: '/admin/map',       label: 'Live Map',  icon: Map },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/admin/settings',  label: 'Settings',  icon: Settings },
];

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut, isAdmin } = useAuth();
  const isAdminPage = location.pathname.startsWith('/admin');

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  if (isAdminPage && isAdmin) {
    return (
      <nav className="bg-[#faf6ee]/95 backdrop-blur-md border-b border-sky-200/70 sticky top-0 z-50 shadow-sm shadow-sky-900/5">
        <div className="max-w-full px-6">
          <div className="flex items-center justify-between h-14">
            {/* Brand */}
            <Link to="/admin/dashboard" className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-sky-500 rounded-lg flex items-center justify-center">
                <Shield size={14} className="text-white" />
              </div>
              <div>
                <span className="font-bold text-slate-900 text-sm">WeatherSense</span>
                <span className="text-xs text-amber-700 font-semibold ml-2 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 rounded">
                  COMMAND CENTER
                </span>
              </div>
            </Link>

            {/* Admin nav */}
            <div className="flex items-center gap-1">
              {ADMIN_LINKS.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className={location.pathname === to ? 'nav-link-active flex items-center gap-1.5' : 'nav-link flex items-center gap-1.5'}
                >
                  {Icon && <Icon size={14} />}
                  {label}
                </Link>
              ))}
            </div>

            {/* User info + sign out */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="live-dot" />
                <span className="text-xs text-slate-400">{user?.email}</span>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 text-slate-400 hover:text-red-400 text-sm transition-colors px-2 py-1.5 rounded-lg hover:bg-red-500/10"
                aria-label="Sign out"
              >
                <LogOut size={14} />
                Sign Out
              </button>
              <Link to="/" className="text-xs text-slate-500 hover:text-sky-400 transition-colors">
                Public Site
              </Link>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-[#faf6ee]/90 backdrop-blur-md border-b border-sky-200/70 sticky top-0 z-50 shadow-sm shadow-sky-900/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-sky-500/20">
              <Cloud size={18} className="text-white" />
            </div>
            <div>
              <div className="font-black text-slate-900 text-lg tracking-tight leading-none">WeatherSense</div>
              <div className="text-xs text-sky-700 font-semibold leading-none mt-0.5">National Weather Intelligence</div>
            </div>
          </Link>

          {/* Public nav */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ to, label, badge, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={location.pathname === to ? 'nav-link-active flex items-center gap-1.5' : 'nav-link flex items-center gap-1.5'}
              >
                {Icon && <Icon size={13} className="text-amber-500" />}
                <span>{label}</span>
                {badge && (
                  <span className="text-[10px] font-black bg-gradient-to-r from-amber-500 to-orange-500 text-white px-1.5 py-0.2 rounded-full uppercase tracking-wider shadow-xs">
                    {badge}
                  </span>
                )}
              </Link>
            ))}
          </div>

          {/* CTA & Taskbar Prediction Widget */}
          <div className="flex items-center gap-3">
            {/* Live AI Prediction Ticker in Taskbar */}
            <Link
              to="/predictions"
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-50 to-sky-50 border border-amber-200/80 hover:border-sky-300 hover:shadow-sm transition-all text-xs font-bold group"
              title="Real-Time AI Weather & Disaster Predictions"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
              </span>
              <span className="text-slate-700 group-hover:text-slate-900 flex items-center gap-1">
                <Sparkles size={12} className="text-amber-500" />
                <span className="font-extrabold text-amber-900">AI Predictions</span>
              </span>
              <span className="text-[10px] bg-sky-100 text-sky-800 font-semibold px-1.5 py-0.5 rounded-md">
                LIVE
              </span>
            </Link>

            <Link
              to="/report"
              className="btn-primary text-sm py-2 px-4 shadow-sm"
            >
              <Activity size={14} />
              Report Weather
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
