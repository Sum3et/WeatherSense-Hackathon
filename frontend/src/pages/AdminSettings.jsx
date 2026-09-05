import { Settings, Database, Zap, AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react';

export default function AdminSettings() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <Settings size={22} className="text-sky-400" />
          Platform Settings
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Configuration and integration status for WeatherSense
        </p>
      </div>

      {/* Firebase */}
      <div className="card mb-5">
        <h2 className="font-bold text-white mb-4 flex items-center gap-2">
          <Database size={16} className="text-sky-400" /> Firebase Configuration
        </h2>
        <div className="space-y-3 text-sm">
          {[
            ['Firestore', 'Real-time database for reports'],
            ['Firebase Auth', 'Admin authentication'],
            ['Firebase Storage', 'Photo/video evidence storage'],
          ].map(([name, desc]) => (
            <div key={name} className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
              <div>
                <div className="text-slate-200 font-medium">{name}</div>
                <div className="text-slate-500 text-xs">{desc}</div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">
                <CheckCircle size={11} /> Configured via .env
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Data sources */}
      <div className="card mb-5">
        <h2 className="font-bold text-white mb-4 flex items-center gap-2">
          <Zap size={16} className="text-amber-400" /> Data Source Integrations
        </h2>
        <div className="space-y-3 text-sm">
          {[
            { name: 'Open-Meteo API', desc: 'Real-time weather + 7-day forecast', status: 'live', link: 'https://open-meteo.com' },
            { name: 'IMD Official API', desc: 'India Meteorological Department', status: 'stub', note: 'Requires API credentials (MAUSAM_API_KEY)' },
            { name: 'Google Gemini AI', desc: 'Report classification + confidence scoring', status: 'configured', note: 'Set GEMINI_API_KEY in .env' },
            { name: 'Reddit API', desc: 'India weather subreddit monitoring', status: 'stub', note: 'Requires Reddit OAuth credentials' },
            { name: 'Meta Graph API', desc: 'Facebook/Instagram weather posts', status: 'stub', note: 'Requires Meta App credentials' },
            { name: 'Public Web RSS', desc: 'News feeds (NDTV, Weather.com, etc.)', status: 'live', note: 'No credentials needed' },
          ].map(({ name, desc, status, note, link }) => (
            <div key={name} className="flex items-start justify-between py-2.5 border-b border-slate-800 last:border-0 gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-slate-200 font-medium">{name}</span>
                  {link && (
                    <a href={link} target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-sky-400 transition-colors">
                      <ExternalLink size={11} />
                    </a>
                  )}
                </div>
                <div className="text-slate-500 text-xs mt-0.5">{desc}</div>
                {note && <div className="text-slate-600 text-xs mt-0.5 italic">{note}</div>}
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${
                status === 'live'        ? 'bg-emerald-500/15 text-emerald-400' :
                status === 'configured' ? 'bg-sky-500/15 text-sky-400' :
                                          'bg-amber-500/15 text-amber-400'
              }`}>
                {status === 'live' ? '● LIVE' : status === 'configured' ? '● CONFIGURED' : '○ STUB'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Environment variables guide */}
      <div className="card mb-5 bg-navy-950">
        <h2 className="font-bold text-white mb-4 text-sm">Required Environment Variables</h2>
        <div className="space-y-1 font-mono text-xs">
          {[
            ['FIREBASE_PROJECT_ID', 'Firebase project ID'],
            ['FIREBASE_SERVICE_ACCOUNT_KEY', 'Path to service account JSON'],
            ['GEMINI_API_KEY', 'Google AI Studio API key'],
            ['MAUSAM_API_KEY', 'IMD Mausam portal API key (optional)'],
            ['REDDIT_CLIENT_ID', 'Reddit app client ID (optional)'],
            ['REDDIT_CLIENT_SECRET', 'Reddit app secret (optional)'],
          ].map(([key, desc]) => (
            <div key={key} className="flex gap-2 py-1 border-b border-slate-900 last:border-0">
              <span className="text-sky-400 min-w-[280px]">{key}</span>
              <span className="text-slate-500"># {desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Simulation */}
      <div className="card bg-amber-500/5 border-amber-500/20">
        <div className="flex items-start gap-3">
          <AlertTriangle size={18} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-amber-400 mb-2">Demo Simulation</h3>
            <p className="text-slate-300 text-sm leading-relaxed mb-3">
              Run the simulation script to populate the database with realistic demo reports:
            </p>
            <code className="block bg-navy-950 border border-slate-800 rounded-lg px-4 py-3 text-xs font-mono text-sky-300">
              python -m backend.scripts.simulate_reports --count 50
            </code>
            <p className="text-slate-500 text-xs mt-2">
              Options: <code>--count N</code> (number of reports), <code>--delay S</code> (seconds between batches)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
