import { Thermometer, Droplets, Wind, Eye, ArrowUp } from 'lucide-react';
import { CATEGORY_ICONS } from '../utils/constants';

/**
 * WeatherCard — Displays current weather data for a location.
 */
export default function WeatherCard({ city, state, weather, source = 'open_meteo', compact = false }) {
  if (!weather) return null;

  const {
    temperature, feels_like, humidity, wind_speed,
    wind_direction, weather_condition, precipitation,
    pressure, uv_index, visibility, cloud_cover,
  } = weather;

  const temp = temperature != null ? Math.round(temperature) : null;

  // Match condition to a category icon
  const conditionIcon = (() => {
    const c = (weather_condition || '').toLowerCase();
    if (c.includes('rain') || c.includes('drizzle') || c.includes('shower')) return '🌧️';
    if (c.includes('thunder')) return '⛈️';
    if (c.includes('snow')) return '🌨️';
    if (c.includes('fog') || c.includes('mist') || c.includes('haze')) return '🌫️';
    if (c.includes('cloud')) return '⛅';
    if (c.includes('clear') || c.includes('sunny')) return '☀️';
    return '🌤️';
  })();

  if (compact) {
    return (
      <div className="card hover:border-sky-400 transition-all duration-200">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-bold text-slate-900 text-sm">{city}</div>
            <div className="text-slate-500 text-xs">{state}</div>
          </div>
          <span className="text-3xl">{conditionIcon}</span>
        </div>
        <div className="flex items-end justify-between mt-3">
          <div className="text-3xl font-black text-sky-600 tabular-nums">
            {temp != null ? `${temp}°` : '—'}
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-600 font-medium">{weather_condition}</div>
            {humidity != null && (
              <div className="text-xs text-slate-500">💧 {humidity}%</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">{city}</h2>
          <p className="text-slate-600 text-sm">{state}</p>
          <p className="text-xs text-sky-700 mt-0.5 font-semibold uppercase tracking-wider">
            {source === 'open_meteo' ? 'Open-Meteo' : source === 'imd' ? 'IMD Official' : source}
          </p>
        </div>
        <span className="text-5xl">{conditionIcon}</span>
      </div>

      {/* Main temp */}
      <div className="flex items-end gap-3 mb-4">
        <div className="text-6xl font-black text-slate-900 tabular-nums">
          {temp != null ? `${temp}°C` : '—'}
        </div>
        {feels_like != null && (
          <div className="pb-2 text-slate-600 text-sm font-medium">
            Feels like {Math.round(feels_like)}°C
          </div>
        )}
      </div>

      <p className="text-slate-700 font-medium mb-4">{weather_condition}</p>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: Droplets,    label: 'Humidity',    value: humidity != null ? `${humidity}%` : '—' },
          { icon: Wind,        label: 'Wind',         value: wind_speed != null ? `${wind_speed} km/h` : '—' },
          { icon: Eye,         label: 'Visibility',   value: visibility != null ? `${visibility} km` : '—' },
          { icon: Thermometer, label: 'Pressure',     value: pressure != null ? `${Math.round(pressure)} hPa` : '—' },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-2.5 bg-sky-50/70 border border-sky-100/80 rounded-xl p-3">
            <Icon size={14} className="text-sky-600 flex-shrink-0" />
            <div>
              <div className="text-xs text-slate-500 font-medium">{label}</div>
              <div className="text-sm font-bold text-slate-800">{value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Extra stats */}
      <div className="flex gap-3 mt-3">
        {precipitation != null && (
          <div className="flex-1 bg-blue-500/10 border border-blue-500/20 rounded-lg p-2.5 text-center">
            <div className="text-xs text-slate-400">Rain</div>
            <div className="text-sm font-bold text-blue-400">{precipitation} mm</div>
          </div>
        )}
        {uv_index != null && (
          <div className="flex-1 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5 text-center">
            <div className="text-xs text-slate-400">UV Index</div>
            <div className="text-sm font-bold text-amber-400">{uv_index}</div>
          </div>
        )}
        {cloud_cover != null && (
          <div className="flex-1 bg-slate-500/10 border border-slate-500/20 rounded-lg p-2.5 text-center">
            <div className="text-xs text-slate-400">Cloud</div>
            <div className="text-sm font-bold text-slate-300">{cloud_cover}%</div>
          </div>
        )}
      </div>
    </div>
  );
}
