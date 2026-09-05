import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts';
import { analyticsApi } from '../services/api';
import { RefreshCw, BarChart3 } from 'lucide-react';

const CHART_COLORS = [
  '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#f97316', '#06b6d4', '#84cc16', '#ec4899', '#6b7280',
  '#14b8a6', '#a855f7', '#fb923c', '#22d3ee',
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 shadow-lg text-sm">
      <p className="text-slate-300 font-semibold mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

export default function AdminAnalytics() {
  const [summary, setSummary] = useState(null);
  const [timeSeries, setTimeSeries] = useState([]);
  const [topLocations, setTopLocations] = useState([]);
  const [confidence, setConfidence] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = async () => {
    try {
      const [sumData, tsData, locData, confData] = await Promise.allSettled([
        analyticsApi.getSummary(),
        analyticsApi.getReportsOverTime(7),
        analyticsApi.getTopLocations(10),
        analyticsApi.getConfidenceDistribution(),
      ]);

      if (sumData.status === 'fulfilled') setSummary(sumData.value);
      if (tsData.status === 'fulfilled') setTimeSeries(tsData.value.data || []);
      if (locData.status === 'fulfilled') setTopLocations(locData.value.top_locations || []);
      if (confData.status === 'fulfilled') setConfidence(confData.value);
    } catch (err) {
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAll();
  };

  if (loading) {
    return (
      <div className="px-6 py-6">
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card animate-pulse h-64" />
          ))}
        </div>
      </div>
    );
  }

  // Prepare chart data
  const categoryData = Object.entries(summary?.category_distribution || {}).map(([name, count]) => ({ name, count }));
  const statusData = Object.entries(summary?.status_distribution || {}).map(([name, value]) => ({ name, value }));
  const sourceData = Object.entries(summary?.source_distribution || {}).map(([name, count]) => ({ name, count }));

  return (
    <div className="px-6 py-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <BarChart3 size={22} className="text-sky-400" />
            Analytics
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Report trends and distribution insights</p>
        </div>
        <button onClick={handleRefresh} disabled={refreshing} className="btn-secondary text-sm py-2">
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Summary stats */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Reports',   value: summary.total_reports,                    color: 'text-sky-400' },
            { label: 'Verified',        value: summary.status_distribution?.VERIFIED || 0, color: 'text-emerald-400' },
            { label: 'Categories',      value: Object.keys(summary.category_distribution || {}).length, color: 'text-purple-400' },
            { label: 'States Covered',  value: Object.keys(summary.state_distribution || {}).length,    color: 'text-amber-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="card text-center">
              <div className={`text-3xl font-black ${color} tabular-nums`}>{value}</div>
              <div className="text-slate-400 text-sm mt-1">{label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        {/* Reports over time */}
        <div className="card">
          <h2 className="font-bold text-slate-200 mb-4 text-sm">Reports Over Time (7 Days)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={timeSeries} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={d => d.slice(5)} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" fill="#0ea5e9" radius={[4, 4, 0, 0]} name="Reports" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status pie chart */}
        <div className="card">
          <h2 className="font-bold text-slate-200 mb-4 text-sm">Status Distribution</h2>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="55%" height={200}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                     dataKey="value" nameKey="name" paddingAngle={3}>
                  {statusData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-1.5">
              {statusData.map((entry, i) => (
                <div key={entry.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                          style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                    <span className="text-slate-400">{entry.name}</span>
                  </div>
                  <span className="text-slate-200 font-semibold">{entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Category bar chart */}
        <div className="card">
          <h2 className="font-bold text-slate-200 mb-4 text-sm">Reports by Category</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={categoryData} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} allowDecimals={false} />
              <YAxis dataKey="name" type="category" tick={{ fill: '#94a3b8', fontSize: 11 }} width={80} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} name="Reports">
                {categoryData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Source distribution */}
        <div className="card">
          <h2 className="font-bold text-slate-200 mb-4 text-sm">Reports by Source</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={sourceData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Reports" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top locations + confidence */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Top affected locations */}
        <div className="card">
          <h2 className="font-bold text-slate-200 mb-4 text-sm">Top Affected Locations</h2>
          <div className="space-y-2">
            {topLocations.slice(0, 10).map(({ location, count }, i) => {
              const max = topLocations[0]?.count || 1;
              return (
                <div key={location} className="flex items-center gap-3">
                  <span className="text-slate-600 text-xs w-4">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-slate-300 text-xs">{location}</span>
                      <span className="text-slate-400 text-xs font-semibold">{count}</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5">
                      <div className="bg-sky-500 h-1.5 rounded-full transition-all"
                           style={{ width: `${(count / max) * 100}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
            {topLocations.length === 0 && (
              <p className="text-slate-500 text-sm text-center py-6">No location data available.</p>
            )}
          </div>
        </div>

        {/* Confidence distribution */}
        <div className="card">
          <h2 className="font-bold text-slate-200 mb-4 text-sm">
            Confidence Score Distribution
            {confidence?.average != null && (
              <span className="ml-2 text-sky-400 font-normal">Avg: {confidence.average}/100</span>
            )}
          </h2>
          {confidence?.histogram ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={confidence.histogram} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                <XAxis dataKey="range" tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Reports" radius={[4, 4, 0, 0]}>
                  {confidence.histogram.map((entry, i) => {
                    const val = parseInt(entry.range);
                    const color = val >= 80 ? '#10b981' : val >= 60 ? '#f59e0b' : val >= 40 ? '#f97316' : '#ef4444';
                    return <Cell key={i} fill={color} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-slate-500 text-sm text-center py-6">No confidence data yet.</p>
          )}

          {/* Legend */}
          <div className="flex justify-center gap-4 mt-3">
            {[['#10b981', 'High (80+)'], ['#f59e0b', 'Moderate (60+)'], ['#f97316', 'Low (40+)'], ['#ef4444', 'Suspicious']].map(([color, label]) => (
              <div key={label} className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: color }} />
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
