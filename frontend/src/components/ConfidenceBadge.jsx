import { getConfidenceLevel } from '../utils/constants';

/**
 * ConfidenceBadge — Displays a 0–100 confidence score with colour coding.
 */
export default function ConfidenceBadge({ score, showBar = false }) {
  const level = getConfidenceLevel(score || 0);
  const pct = Math.round(score || 0);

  return (
    <div className="inline-flex flex-col gap-1 min-w-0">
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border
        ${level.bg} ${level.color} border-current/30`}
      >
        <span>{pct}</span>
        <span className="opacity-70 font-normal">/100</span>
      </div>
      {showBar && (
        <div className="w-full bg-slate-700 rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full transition-all duration-500 ${
              pct >= 80 ? 'bg-emerald-500' :
              pct >= 60 ? 'bg-yellow-500' :
              pct >= 40 ? 'bg-orange-500' : 'bg-red-500'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}
