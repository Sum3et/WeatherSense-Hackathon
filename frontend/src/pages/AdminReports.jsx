import { useState, useCallback } from 'react';
import {
  Search, Filter, CheckCircle, XCircle, AlertTriangle,
  Flag, Trash2, ChevronDown, ChevronUp, RefreshCw, Eye
} from 'lucide-react';
import toast from 'react-hot-toast';
import ReportCard from '../components/ReportCard';
import StatusBadge from '../components/StatusBadge';
import ConfidenceBadge from '../components/ConfidenceBadge';
import ReportModal from '../components/ReportModal';
import { useAllReports } from '../hooks/useReports';
import { adminApi } from '../services/api';
import { EVENT_CATEGORIES } from '../utils/constants';
import { formatDistanceToNow } from 'date-fns';

const STATUS_TABS = ['ALL', 'PENDING', 'VERIFIED', 'FLAGGED', 'SPAM'];

export default function AdminReports() {
  const { reports, loading, refetch } = useAllReports(500);
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [sortField, setSortField] = useState('created_at');
  const [sortDir, setSortDir] = useState('desc');

  const filtered = reports.filter(r => {
    const matchStatus = activeTab === 'ALL' || r.status === activeTab;
    const matchSearch = !searchQuery ||
      r.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.event_category?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = !categoryFilter || r.event_category === categoryFilter;
    return matchStatus && matchSearch && matchCat;
  }).sort((a, b) => {
    const av = a[sortField], bv = b[sortField];
    if (!av && !bv) return 0;
    if (!av) return 1;
    if (!bv) return -1;
    return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
  });

  const tabCount = (tab) => tab === 'ALL'
    ? reports.length
    : reports.filter(r => r.status === tab).length;

  return (
    <div className="px-6 py-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">Report Management</h1>
          <p className="text-slate-400 text-sm mt-0.5">{reports.length} total reports</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-5 overflow-x-auto pb-1">
        {STATUS_TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap flex items-center gap-2 transition-all ${
              activeTab === tab
                ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
            aria-pressed={activeTab === tab}
          >
            {tab}
            <span className={`text-xs rounded-full px-1.5 py-0.5 ${
              activeTab === tab ? 'bg-sky-500/30 text-sky-300' : 'bg-slate-700 text-slate-500'
            }`}>
              {tabCount(tab)}
            </span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
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
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="input-field py-2 w-auto"
          aria-label="Filter by category"
        >
          <option value="">All Categories</option>
          {EVENT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        {(searchQuery || categoryFilter) && (
          <button onClick={() => { setSearchQuery(''); setCategoryFilter(''); }}
                  className="text-slate-400 hover:text-white text-sm px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors">
            Clear
          </button>
        )}
        <span className="ml-auto text-xs text-slate-500 self-center">{filtered.length} results</span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({length:8}).map((_,i) => (
            <div key={i} className="h-12 bg-slate-800/50 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  {[
                    ['event_category', 'Category'],
                    ['city', 'Location'],
                    ['source', 'Source'],
                    ['status', 'Status'],
                    ['confidence_score', 'Confidence'],
                    ['created_at', 'Submitted'],
                  ].map(([field, label]) => (
                    <th key={field}
                        className="text-left px-4 py-3 text-slate-500 text-xs font-semibold uppercase tracking-wider cursor-pointer hover:text-slate-300 select-none"
                        onClick={() => { setSortField(field); setSortDir(d => d === 'asc' ? 'desc' : 'asc'); }}>
                      <span className="flex items-center gap-1">
                        {label}
                        {sortField === field && (sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                      </span>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-slate-500 text-xs font-semibold uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-500">No reports found.</td>
                  </tr>
                ) : filtered.map(report => {
                  const timeAgo = (() => { try { return formatDistanceToNow(new Date(report.created_at), { addSuffix: true }); } catch { return '—'; } })();
                  return (
                    <tr
                      key={report.id}
                      onClick={() => setSelectedReport(report)}
                      className="hover:bg-slate-800/50 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-200">{report.event_category}</div>
                        <div className="text-slate-500 text-xs line-clamp-1 max-w-xs mt-0.5">{report.description}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-300 whitespace-nowrap">
                        {report.city || '—'}{report.state ? `, ${report.state}` : ''}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-slate-400 capitalize">{report.source}</span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={report.status} />
                      </td>
                      <td className="px-4 py-3">
                        <ConfidenceBadge score={report.confidence_score} />
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{timeAgo}</td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedReport(report)}
                          className="flex items-center gap-1.5 bg-sky-500/15 hover:bg-sky-500/30 text-sky-400 px-2.5 py-1 rounded-md text-xs font-medium transition-colors"
                          aria-label={`Review report ${report.id}`}
                        >
                          <Eye size={12} /> Review & Verify
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Report detail modal */}
      {selectedReport && (
        <ReportModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
          onAction={() => {
            setSelectedReport(null);
            refetch?.();
          }}
        />
      )}
    </div>
  );
}
