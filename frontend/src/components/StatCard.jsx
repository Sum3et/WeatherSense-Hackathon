import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

/**
 * StatCard — KPI metric card for dashboard.
 */
export default function StatCard({ title, value, subtitle, icon: Icon, color = 'sky', trend, loading = false }) {
  const colorMap = {
    sky:     { bg: 'bg-sky-500/10',     text: 'text-sky-400',     icon: 'bg-sky-500/20' },
    amber:   { bg: 'bg-amber-500/10',   text: 'text-amber-400',   icon: 'bg-amber-500/20' },
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', icon: 'bg-emerald-500/20' },
    red:     { bg: 'bg-red-500/10',     text: 'text-red-400',     icon: 'bg-red-500/20' },
    orange:  { bg: 'bg-orange-500/10',  text: 'text-orange-400',  icon: 'bg-orange-500/20' },
    purple:  { bg: 'bg-purple-500/10',  text: 'text-purple-400',  icon: 'bg-purple-500/20' },
    slate:   { bg: 'bg-slate-500/10',   text: 'text-slate-400',   icon: 'bg-slate-500/20' },
  };

  const c = colorMap[color] || colorMap.sky;

  return (
    <div className={`stat-card ${c.bg} border-slate-800`}>
      <div className="flex items-start justify-between">
        {/* Icon */}
        <div className={`w-10 h-10 rounded-xl ${c.icon} flex items-center justify-center`}>
          {Icon && <Icon size={18} className={c.text} />}
        </div>

        {/* Trend */}
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-medium ${
            trend > 0 ? 'text-emerald-400' : trend < 0 ? 'text-red-400' : 'text-slate-500'
          }`}>
            {trend > 0 ? <TrendingUp size={12} /> : trend < 0 ? <TrendingDown size={12} /> : <Minus size={12} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>

      <div className="mt-4">
        {loading ? (
          <div className="h-8 w-16 bg-slate-700 rounded animate-pulse" />
        ) : (
          <div className={`text-3xl font-black ${c.text} tabular-nums`}>
            {value ?? '—'}
          </div>
        )}
        <div className="text-slate-300 font-semibold text-sm mt-1">{title}</div>
        {subtitle && <div className="text-slate-500 text-xs mt-0.5">{subtitle}</div>}
      </div>
    </div>
  );
}
