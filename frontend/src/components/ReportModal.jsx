import { useState } from 'react';
import {
  CheckCircle, XCircle, Flag, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import StatusBadge from './StatusBadge';
import ConfidenceBadge from './ConfidenceBadge';
import { adminApi } from '../services/api';
import { formatDistanceToNow } from 'date-fns';

/**
 * ReportModal — Admin review and approval dialog for weather reports.
 */
export default function ReportModal({ report, onClose, onAction }) {
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState(report.admin_notes || '');

  const action = async (fn, label) => {
    setLoading(true);
    try {
      await fn();
      toast.success(`Report marked as ${label} successfully!`);
      onAction?.();
      onClose?.();
    } catch (err) {
      toast.error(err.message || `Failed to update report to ${label}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#1e293b] border border-slate-700 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-700">
          <div>
            <h2 className="font-bold text-white text-lg flex items-center gap-2">
              <span>Review Weather Report</span>
              <StatusBadge status={report.status} />
            </h2>
            <p className="text-slate-400 text-xs mt-0.5">ID: {report.id}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-slate-800"
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 text-sm bg-slate-800/40 p-3 rounded-xl border border-slate-700/50">
            {[
              { label: 'Event Category', value: report.event_category },
              { label: 'Status',         value: <StatusBadge status={report.status} /> },
              { label: 'Location',       value: `${report.city || '—'}, ${report.state || '—'}` },
              { label: 'Coordinates',    value: report.latitude ? `${report.latitude?.toFixed(4)}, ${report.longitude?.toFixed(4)}` : '—' },
              { label: 'Data Source',    value: report.source || 'citizen' },
              { label: 'Submitted',      value: (() => { try { return formatDistanceToNow(new Date(report.created_at), { addSuffix: true }); } catch { return '—'; } })() },
              { label: 'AI Predicted',   value: report.ai_category || '—' },
              { label: 'Confidence',     value: <ConfidenceBadge score={report.confidence_score} showBar /> },
            ].map(({ label, value }) => (
              <div key={label}>
                <div className="text-slate-400 text-xs mb-0.5">{label}</div>
                <div className="text-slate-200 font-medium text-sm">{value}</div>
              </div>
            ))}
          </div>

          {/* Description */}
          <div>
            <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1.5">Citizen Description</div>
            <p className="text-slate-200 text-sm leading-relaxed bg-slate-900/60 rounded-xl p-3.5 border border-slate-800 font-normal">
              {report.description || 'No description provided.'}
            </p>
          </div>

          {/* AI Reasoning */}
          {report.ai_reasoning && (
            <div>
              <div className="text-purple-300 text-xs font-semibold uppercase tracking-wider mb-1.5">AI Analysis & Reasoning</div>
              <p className="text-purple-200/90 text-sm bg-purple-950/30 border border-purple-800/40 rounded-xl p-3.5 leading-relaxed">
                {report.ai_reasoning}
              </p>
            </div>
          )}

          {/* Media (if any) */}
          {report.media_url && (
            <div>
              <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1.5">Attached Evidence</div>
              {report.media_type === 'video' ? (
                <video src={report.media_url} controls className="w-full rounded-xl max-h-56" />
              ) : (
                <img src={report.media_url} alt="Evidence" className="w-full rounded-xl max-h-56 object-cover border border-slate-700" />
              )}
            </div>
          )}

          {/* Admin Notes */}
          <div>
            <label className="label text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1.5" htmlFor="admin-notes">
              Internal Administrator Notes
            </label>
            <textarea
              id="admin-notes"
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Add optional notes about this verification..."
              className="input-field resize-none text-sm w-full bg-slate-900/60 border border-slate-700 rounded-xl p-3 text-slate-200"
            />
          </div>

          {/* Confidence Breakdown */}
          <div>
            <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Confidence Engine Breakdown</div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {[
                ['Metadata',  report.metadata_score],
                ['Location',  report.location_consistency_score],
                ['Weather',   report.weather_consistency_score],
                ['Duplicate', report.duplicate_score],
                ['AI Score',  report.ai_category_confidence],
                ['Source',    report.source_reliability_score],
              ].map(([label, score]) => (
                <div key={label} className="bg-slate-900/60 border border-slate-800 rounded-lg p-2 text-center">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">{label}</div>
                  <div className={`text-sm font-bold mt-0.5 ${
                    score >= 70 ? 'text-emerald-400' :
                    score >= 50 ? 'text-amber-400' : 'text-rose-400'
                  }`}>{score != null ? Math.round(score) : '—'}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-700">
            <div className="text-xs text-slate-400 mb-2">Select Moderation Action:</div>
            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => action(() => adminApi.verifyReport(report.id), 'VERIFIED')}
                disabled={loading || report.status === 'VERIFIED'}
                className="flex-1 min-w-[120px] bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-sm shadow-md transition-all cursor-pointer"
              >
                <CheckCircle size={16} />
                {report.status === 'VERIFIED' ? 'Already Verified' : 'Approve & Verify'}
              </button>

              <button
                type="button"
                onClick={() => action(() => adminApi.flagReport(report.id), 'FLAGGED')}
                disabled={loading || report.status === 'FLAGGED'}
                className="flex-1 min-w-[100px] bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-semibold py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 text-sm shadow-md transition-all cursor-pointer"
              >
                <Flag size={16} />
                Flag for Review
              </button>

              <button
                type="button"
                onClick={() => action(() => adminApi.markSpam(report.id), 'SPAM')}
                disabled={loading || report.status === 'SPAM'}
                className="flex-1 min-w-[100px] bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-semibold py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 text-sm shadow-md transition-all cursor-pointer"
              >
                <XCircle size={16} />
                Mark Spam
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
