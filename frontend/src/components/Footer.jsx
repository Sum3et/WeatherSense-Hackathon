import { Cloud, Github, Shield, AlertTriangle, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-gradient-to-b from-[#faf6ee] to-[#edf4fc] border-t border-sky-200/80 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 bg-sky-500/20 border border-sky-500/30 rounded-lg flex items-center justify-center">
                <Cloud size={16} className="text-sky-600" />
              </div>
              <span className="font-black text-slate-900">WeatherSense</span>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed">
              National Weather Big Data Analytics Platform.
              SIH 2026 — Ministry of Earth Sciences.
            </p>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-slate-900 font-semibold text-sm mb-4">Platform</h4>
            <ul className="space-y-2.5">
              {[
                ['/', 'Home'],
                ['/weather', 'Weather'],
                ['/reports', 'Public Reports'],
                ['/report', 'Report Weather'],
                ['/about', 'About'],
              ].map(([to, label]) => (
                <li key={to}>
                  <Link to={to} className="text-slate-400 hover:text-sky-400 text-sm transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Data Sources */}
          <div>
            <h4 className="text-slate-900 font-semibold text-sm mb-4">Data Sources</h4>
            <ul className="space-y-2.5">
              {[
                ['IMD Official Data', 'https://mausam.imd.gov.in'],
                ['Open-Meteo', 'https://open-meteo.com'],
                ['OpenStreetMap', 'https://openstreetmap.org'],
                ['Citizen Reports', '/report'],
              ].map(([label, href]) => (
                <li key={label}>
                  <a
                    href={href}
                    target={href.startsWith('http') ? '_blank' : undefined}
                    rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className="text-slate-600 hover:text-sky-600 text-sm transition-colors flex items-center gap-1"
                  >
                    {label}
                    {href.startsWith('http') && <ExternalLink size={10} className="opacity-50" />}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Admin — subtle, at bottom */}
          <div>
            <h4 className="text-slate-900 font-semibold text-sm mb-4 flex items-center gap-2">
              <Shield size={14} className="text-slate-500" />
              Admin Access
            </h4>
            <p className="text-slate-500 text-xs mb-4">
              Authorized WeatherSense administrators.
            </p>
            <Link
              to="/admin/login"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50
                         border border-sky-200 hover:border-sky-300 rounded-xl text-slate-700
                         hover:text-slate-900 text-sm font-medium shadow-sm transition-all duration-200"
            >
              <Shield size={13} />
              Admin Login
            </Link>

            <div className="mt-4 p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle size={12} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-amber-500/80 text-xs leading-relaxed">
                  This is a prototype system for demonstration purposes (SIH 2026).
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-slate-600 text-xs">
            © 2026 WeatherSense. Built for SIH 2026 — Ministry of Earth Sciences (MoES).
          </p>
          <div className="flex items-center gap-4">
            <span className="text-slate-600 text-xs">Open-Meteo data © open-meteo.com</span>
            <span className="text-slate-600 text-xs">Maps © OpenStreetMap contributors</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
