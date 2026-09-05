import { STATUS_CONFIG } from '../utils/constants';

/**
 * StatusBadge — Displays a coloured badge for report status.
 */
export default function StatusBadge({ status, size = 'sm' }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  const sizeClass = size === 'lg' ? 'px-3 py-1.5 text-sm' : 'px-2 py-0.5 text-xs';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold border
      ${config.bg} ${config.text} ${config.border} ${sizeClass}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.text.replace('text-', 'bg-')}`} />
      {config.label}
    </span>
  );
}
