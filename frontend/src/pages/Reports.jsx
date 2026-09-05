import { useState } from 'react';
import { MapPin, Filter, Search, Cloud } from 'lucide-react';
import ReportCard from '../components/ReportCard';
import WeatherMap from '../components/WeatherMap';
import { useVerifiedReports } from '../hooks/useReports';
import { EVENT_CATEGORIES } from '../utils/constants';

export default function Reports() {
  const { reports, loading } = useVerifiedReports(100);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [viewMode, setViewMode] = useState('list'); // list | map

  const states = [...new Set(reports.map(r => r.state).filter(Boolean))].sort();

  const filtered = reports.filter(r => {
    const matchSearch =
      !searchQuery ||
      r.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.state?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.event_category?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchCat = !categoryFilter || r.event_category === categoryFilter;
    const matchState = !stateFilter || r.state === stateFilter;

    return matchSearch && matchCat && matchState;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black text-white">Verified Reports</h1>
          <p className="text-slate-400 mt-1">
            {loading ? 'Loading...' : `${reports.length} verified weather reports across India`}
          </p>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-lg p-1">
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              viewMode === 'list' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white'
            }`}
            aria-label="List view"
          >
            List
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              viewMode === 'map' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white'
            }`}
            aria-label="Map view"
          >
            Map
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search reports..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="input-field pl-9 py-2"
            aria-label="Search reports"
          />
        </div>

        {/* Category filter */}
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="input-field py-2 w-auto cursor-pointer"
          aria-label="Filter by category"
        >
          <option value="">All Categories</option>
          {EVENT_CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        {/* State filter */}
        <select
          value={stateFilter}
          onChange={e => setStateFilter(e.target.value)}
          className="input-field py-2 w-auto cursor-pointer"
          aria-label="Filter by state"
        >
          <option value="">All States</option>
          {states.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        {/* Clear filters */}
        {(searchQuery || categoryFilter || stateFilter) && (
          <button
            onClick={() => { setSearchQuery(''); setCategoryFilter(''); setStateFilter(''); }}
            className="text-slate-400 hover:text-white text-sm px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Results count */}
      <div className="flex items-center gap-2 mb-4 text-sm text-slate-400">
        <Filter size={13} />
        Showing {filtered.length} of {reports.length} reports
      </div>

      {/* Content */}
      {viewMode === 'map' ? (
        <WeatherMap
          reports={filtered}
          cities={[]}
          height="600px"
          showCities={false}
        />
      ) : (
        <div>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="card animate-pulse h-44" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="card text-center py-16">
              <Cloud size={48} className="text-slate-600 mx-auto mb-4" />
              <h3 className="text-white font-semibold mb-2">No reports found</h3>
              <p className="text-slate-400 text-sm">
                {reports.length === 0
                  ? 'No verified reports yet. Reports will appear here after administrator review.'
                  : 'Try adjusting your search filters.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(report => (
                <ReportCard key={report.id} report={report} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
