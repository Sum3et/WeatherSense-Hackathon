import { useState, useEffect } from 'react';
import {
  Activity, FileText, CheckCircle, AlertTriangle, XCircle,
  Cloud, RefreshCw, Zap, Server, Database
} from 'lucide-react';
import StatCard from '../components/StatCard';
import ReportCard from '../components/ReportCard';
import ReportModal from '../components/ReportModal';
import { useAllReports } from '../hooks/useReports';
import { adminApi } from '../services/api';

export default function AdminDashboard() {
  const { reports, loading, counts, refetch } = useAllReports(200);
  const [systemStatus, setSystemStatus] = useState(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  const fetchStatus = async () => {
    try {
      const summary = await adminApi.getDashboardSummary();
      setSystemStatus(summary);
    } catch (err) {
      console.warn('Status fetch failed:', err);
    } finally {
      setStatusLoading(false);
    }
  };

  useEffect(() => { fetchStatus(); }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchStatus(), refetch?.()]);
    setTimeout(() => setRefreshing(false), 600);
  };

  const recentPending = reports.filter(r => r.status === 'PENDING').slice(0, 6);

  return (
    <div className="max-w-full px-6 py-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">Admin Dashboard</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            WeatherSense Command Center — SIH 2026
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="btn-secondary text-sm py-2"
          aria-label="Refresh dashboard"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-4 mb-6">
        <StatCard title="Total Reports"    value={counts.total}    icon={FileText}    color="sky"     loading={loading} />
        <StatCard title="Pending Review"   value={counts.pending}  icon={Activity}    color="amber"   loading={loading} />
        <StatCard title="Verified"         value={counts.verified} icon={CheckCircle} color="emerald" loading={loading} />
        <StatCard title="Flagged"          value={counts.flagged}  icon={AlertTriangle} color="orange" loading={loading} />
        <StatCard title="Spam"             value={counts.spam}     icon={XCircle}     color="red"     loading={loading} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Pending reports queue */}
        <div className="xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title flex items-center gap-2">
              <Activity size={16} className="text-amber-400" />
              Pending Review Queue
            </h2>
            <span className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full font-semibold">
              {counts.pending} waiting
            </span>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[0,1,2].map(i => <div key={i} className="card animate-pulse h-32" />)}
            </div>
          ) : recentPending.length === 0 ? (
            <div className="card text-center py-12">
              <CheckCircle size={40} className="text-emerald-500 mx-auto mb-3" />
              <p className="text-slate-300 font-medium">All caught up!</p>
              <p className="text-slate-500 text-sm mt-1">No pending reports at this time.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentPending.map(report => (
                <div key={report.id} className="relative group">
                  <ReportCard
                    report={report}
                    showAdmin={true}
                    onClick={() => setSelectedReport(report)}
                  />
                  <div className="absolute right-4 bottom-3 opacity-90 group-hover:opacity-100 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedReport(report);
                      }}
                      className="text-xs bg-sky-500 hover:bg-sky-400 text-white font-medium px-3 py-1.5 rounded-lg shadow-sm transition-all"
                    >
                      Review & Verify →
                    </button>
                  </div>
                </div>
              ))}
              {counts.pending > 6 && (
                <a
                  href="/admin/reports"
                  className="block text-center text-sky-400 text-sm hover:text-sky-300 py-2 transition-colors"
                >
                  View all {counts.pending} pending reports in Reports Portal →
                </a>
              )}
            </div>
          )}
        </div>

        {/* Modal for approval / verification */}
        {selectedReport && (
          <ReportModal
            report={selectedReport}
            onClose={() => setSelectedReport(null)}
            onAction={() => {
              setSelectedReport(null);
              refetch();
            }}
          />
        )}

        {/* System Status */}
        <div>
          <h2 className="section-title flex items-center gap-2 mb-4">
            <Server size={16} className="text-sky-400" />
            System Status
          </h2>

          <div className="card space-y-3">
            {statusLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex justify-between animate-pulse">
                  <div className="h-4 w-24 bg-slate-700 rounded" />
                  <div className="h-4 w-20 bg-slate-700 rounded" />
                </div>
              ))
            ) : systemStatus ? (
              Object.entries(systemStatus.system_status || {}).map(([service, status]) => (
                <div key={service} className="flex items-center justify-between py-1.5 border-b border-slate-800 last:border-0">
                  <span className="text-slate-300 text-sm capitalize">{service.replace('_', ' ')}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    (status === 'CONNECTED' || status === 'AVAILABLE')
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : status === 'STUB' || status === 'DEGRADED'
                      ? 'bg-amber-500/15 text-amber-400'
                      : 'bg-red-500/15 text-red-400'
                  }`}>
                    {typeof status === 'string' ? status : status.status || 'UNKNOWN'}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-slate-500 text-sm text-center py-4">
                Status unavailable — backend not connected
              </div>
            )}
          </div>

          {/* Quick stats */}
          <div className="mt-4 card">
            <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
              <Database size={14} className="text-sky-400" />
              Report Breakdown
            </h3>
            {['PENDING', 'VERIFIED', 'FLAGGED', 'SPAM'].map(status => {
              const count = reports.filter(r => r.status === status).length;
              const pct = counts.total > 0 ? (count / counts.total) * 100 : 0;

              const color =
                status === 'VERIFIED' ? 'bg-emerald-500' :
                status === 'PENDING'  ? 'bg-amber-500' :
                status === 'FLAGGED'  ? 'bg-orange-500' : 'bg-red-500';

              return (
                <div key={status} className="mb-2">
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>{status}</span>
                    <span>{count}</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5">
                    <div className={`${color} h-1.5 rounded-full transition-all duration-500`}
                         style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
