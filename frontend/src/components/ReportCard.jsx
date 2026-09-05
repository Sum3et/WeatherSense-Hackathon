import { SOURCE_CONFIG, CATEGORY_ICONS } from '../utils/constants';
import StatusBadge from './StatusBadge';
import ConfidenceBadge from './ConfidenceBadge';
import { MapPin, Clock, Camera, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

/**
 * ReportCard — Displays a weather report summary card.
 */
export default function ReportCard({ report, onClick, showAdmin = false }) {
  const {
    event_category, description, city, state,
    source, status, created_at, media_url, media_type,
    confidence_score, ai_category,
  } = report;

  const sourceConf = SOURCE_CONFIG[source] || SOURCE_CONFIG.citizen;
  const icon = CATEGORY_ICONS[event_category] || '🔆';

  const timeAgo = (() => {
    try {
      return formatDistanceToNow(new Date(created_at), { addSuffix: true });
    } catch {
      return 'recently';
    }
  })();

  return (
    <div
      className="card hover:border-sky-400 hover:shadow-md transition-all duration-200 cursor-pointer group"
      onClick={() => onClick?.(report)}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.(report)}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="w-10 h-10 bg-sky-100/80 border border-sky-200/80 rounded-xl flex items-center justify-center text-xl flex-shrink-0 shadow-sm">
          {icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-slate-900 text-sm">{event_category || 'Weather Event'}</span>
              {status && <StatusBadge status={status} />}
            </div>
            {showAdmin && confidence_score !== undefined && (
              <ConfidenceBadge score={confidence_score} />
            )}
          </div>

          {/* Location */}
          <div className="flex items-center gap-1.5 mt-1">
            <MapPin size={11} className="text-slate-400 flex-shrink-0" />
            <span className="text-slate-500 text-xs truncate">
              {[city, state].filter(Boolean).join(', ') || 'Location not specified'}
            </span>
          </div>

          {/* Description */}
          <p className="text-slate-700 text-sm mt-2 line-clamp-2 leading-relaxed">
            {description}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-sky-100">
            <div className="flex items-center gap-3">
              {/* Source badge */}
              <span className={`source-badge ${sourceConf.color} ${sourceConf.border} ${sourceConf.bg}`}>
                {sourceConf.label}
              </span>

              {/* Media indicator */}
              {media_url && (
                <span className="flex items-center gap-1 text-xs text-slate-500">
                  <Camera size={10} />
                  {media_type === 'video' ? 'Video' : 'Photo'}
                </span>
              )}

              {/* AI category (admin) */}
              {showAdmin && ai_category && ai_category !== event_category && (
                <span className="text-xs text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">
                  AI: {ai_category}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Clock size={10} />
              {timeAgo}
            </div>
          </div>
        </div>

        {/* Arrow indicator */}
        {onClick && (
          <Eye size={14} className="text-slate-600 group-hover:text-sky-400 transition-colors flex-shrink-0 mt-1" />
        )}
      </div>
    </div>
  );
}
