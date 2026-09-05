import WeatherMap from '../components/WeatherMap';
import { useAllReports } from '../hooks/useReports';
import { useCitiesWeather } from '../hooks/useWeather';
import { useState } from 'react';

const FILTER_OPTIONS = [
  { value: 'ALL',      label: 'All Reports' },
  { value: 'PENDING',  label: 'Pending' },
  { value: 'VERIFIED', label: 'Verified' },
  { value: 'FLAGGED',  label: 'Flagged' },
  { value: 'SPAM',     label: 'Spam' },
];

export default function AdminMap() {
  const { reports, loading } = useAllReports(500);
  const { cities, loading: citiesLoading } = useCitiesWeather();
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showCities, setShowCities] = useState(true);

  const filtered = statusFilter === 'ALL'
    ? reports
    : reports.filter(r => r.status === statusFilter);

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] animate-fade-in">
      {/* Controls bar */}
      <div className="px-6 py-3 border-b border-slate-800 bg-navy-900 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-lg p-1">
          {FILTER_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                statusFilter === opt.value
                  ? 'bg-sky-500 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
              aria-pressed={statusFilter === opt.value}
            >
              {opt.label}
              <span className="ml-1.5 opacity-70">
                ({opt.value === 'ALL' ? reports.length : reports.filter(r => r.status === opt.value).length})
              </span>
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-400 hover:text-white transition-colors">
          <input
            type="checkbox"
            checked={showCities}
            onChange={e => setShowCities(e.target.checked)}
            className="accent-sky-500"
          />
          City Weather Labels
        </label>

        <span className="ml-auto text-xs text-slate-500">
          {loading ? 'Loading...' : `${filtered.length} report markers`}
        </span>
      </div>

      {/* Full-height map */}
      <div className="flex-1">
        <WeatherMap
          reports={filtered}
          cities={showCities ? cities : []}
          height="100%"
          showCities={showCities}
          showReports={true}
          className="rounded-none border-0"
        />
      </div>
    </div>
  );
}
