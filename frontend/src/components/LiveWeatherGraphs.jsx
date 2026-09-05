import { useState, useEffect, useMemo } from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import {
  Activity, Zap, CloudRain, Wind, Compass, Gauge,
  Sun, Droplets, RefreshCw, Radio, MapPin, AlertCircle,
  ArrowUp, ArrowDown, Eye, Sliders, CheckSquare, Square,
  Thermometer, CloudLightning, ShieldAlert, Sparkles, Clock
} from 'lucide-react';
import { weatherApi } from '../services/api';

const FEATURED_CITIES = [
  { city: 'Delhi', state: 'Delhi', lat: 28.6139, lon: 77.2090 },
  { city: 'Mumbai', state: 'Maharashtra', lat: 19.0760, lon: 72.8777 },
  { city: 'Bengaluru', state: 'Karnataka', lat: 12.9716, lon: 77.5946 },
  { city: 'Kolkata', state: 'West Bengal', lat: 22.5726, lon: 88.3639 },
  { city: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lon: 80.2707 },
  { city: 'Hyderabad', state: 'Telangana', lat: 17.3850, lon: 78.4867 },
  { city: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lon: 75.7873 },
  { city: 'Kochi', state: 'Kerala', lat: 9.9312, lon: 76.2673 },
];

export default function LiveWeatherGraphs() {
  const [selectedCity, setSelectedCity] = useState(FEATURED_CITIES[0]);
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isLiveStreaming, setIsLiveStreaming] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30); // seconds
  const [countdown, setCountdown] = useState(30);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Interactive Controls
  const [horizonHours, setHorizonHours] = useState(24); // 12 | 24 | 48
  const [activeTab, setActiveTab] = useState('all-in-one'); // 'all-in-one' | 'temp-rain' | 'wind-pressure'
  const [hoveredData, setHoveredData] = useState(null);
  const [pinnedData, setPinnedData] = useState(null);

  // Metric line visibility toggles
  const [visibleMetrics, setVisibleMetrics] = useState({
    temperature: true,
    feels_like: true,
    precipitation: true,
    rainProb: true,
    wind_speed: true,
    pressure: true,
  });

  const toggleMetric = (key) => {
    setVisibleMetrics(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Fetch forecast data with hourly readings
  const fetchLiveData = async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      setError(null);
      const resp = await weatherApi.getForecast(
        selectedCity.lat,
        selectedCity.lon,
        selectedCity.city,
        3 // 3 days
      );
      
      const forecast = resp?.data || resp;
      setForecastData(forecast);
      setLastUpdated(new Date());
      setCountdown(refreshInterval);
    } catch (err) {
      console.error('Failed to fetch live weather telemetry:', err);
      setError('Live telemetry temporarily unavailable. Displaying local dynamic synthesis.');
    } finally {
      setLoading(false);
      if (isManual) {
        setTimeout(() => setIsRefreshing(false), 600);
      }
    }
  };

  // Trigger fetch when city changes
  useEffect(() => {
    setLoading(true);
    setHoveredData(null);
    setPinnedData(null);
    fetchLiveData();
  }, [selectedCity]);

  // Live Auto-Refresh ticker
  useEffect(() => {
    if (!isLiveStreaming || refreshInterval <= 0) return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          fetchLiveData();
          return refreshInterval;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isLiveStreaming, refreshInterval, selectedCity]);

  // Parse hourly data for Recharts based on horizonHours
  const fullChartData = useMemo(() => {
    if (!forecastData?.hourly || forecastData.hourly.length === 0) {
      const baseTemp = 28.5;
      return Array.from({ length: 48 }).map((_, idx) => {
        const hour = idx % 24;
        const dayLabel = idx < 24 ? 'Today' : 'Tomorrow';
        const timeStr = `${hour.toString().padStart(2, '0')}:00`;
        const temp = Math.round((baseTemp + Math.sin((hour - 8) / 3.8) * 6) * 10) / 10;
        const rainProb = hour >= 13 && hour <= 19 ? 82 : 12;
        const rainMm = hour >= 15 && hour <= 18 ? 8.4 : 0;
        return {
          time: timeStr,
          hour: `${timeStr} ${dayLabel}`,
          rawTime: timeStr,
          temperature: temp,
          feels_like: Math.round((temp + (temp > 30 ? 4.2 : 2.0)) * 10) / 10,
          precipitation: rainMm,
          precipitation_probability: rainProb,
          humidity: Math.round(78 - Math.sin((hour - 6) / 3.8) * 22),
          wind_speed: Math.round((14 + Math.sin(hour / 2) * 8) * 10) / 10,
          pressure: Math.round((1006 - Math.sin(hour / 4) * 6) * 10) / 10,
          uv_index: hour >= 10 && hour <= 16 ? Math.round(Math.sin((hour - 10) / 3) * 9 * 10) / 10 : 0,
        };
      });
    }

    return forecastData.hourly.map((item, idx) => {
      let label = '';
      try {
        const d = new Date(item.time);
        const dayPrefix = idx < 24 ? '' : '+1d ';
        label = dayPrefix + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
      } catch {
        label = item.time?.split('T')[1]?.slice(0, 5) || item.time;
      }
      return {
        ...item,
        hour: label,
        rawTime: item.time,
        temperature: item.temperature !== null ? Math.round(item.temperature * 10) / 10 : null,
        feels_like: item.feels_like !== null ? Math.round(item.feels_like * 10) / 10 : null,
        precipitation: item.precipitation !== null ? Math.max(0, item.precipitation) : 0,
        precipitation_probability: item.precipitation_probability || 0,
        wind_speed: item.wind_speed !== null ? Math.round(item.wind_speed * 10) / 10 : 0,
        pressure: item.pressure !== null ? Math.round(item.pressure * 10) / 10 : 1010,
        humidity: item.humidity !== null ? Math.round(item.humidity) : 60,
        uv_index: item.uv_index !== null ? Math.round(item.uv_index * 10) / 10 : 0,
      };
    });
  }, [forecastData]);

  // Sliced data based on selected horizon
  const displayData = useMemo(() => {
    return fullChartData.slice(0, horizonHours);
  }, [fullChartData, horizonHours]);

  // Overall extrema metrics
  const extrema = useMemo(() => {
    if (!displayData || displayData.length === 0) return {};
    const temps = displayData.map(d => d.temperature).filter(t => t !== null);
    const maxTempItem = displayData.reduce((prev, curr) => (curr.temperature > prev.temperature ? curr : prev), displayData[0]);
    const minTempItem = displayData.reduce((prev, curr) => (curr.temperature < prev.temperature ? curr : prev), displayData[0]);
    const maxRainItem = displayData.reduce((prev, curr) => ((curr.precipitation || 0) > (prev.precipitation || 0) ? curr : prev), displayData[0]);
    const minPressureItem = displayData.reduce((prev, curr) => ((curr.pressure || 1020) < (prev.pressure || 1020) ? curr : prev), displayData[0]);

    return {
      maxTemp: maxTempItem,
      minTemp: minTempItem,
      maxRain: maxRainItem,
      minPressure: minPressureItem,
    };
  }, [displayData]);

  // Active highlighted point (either pinned or hovered, defaulting to current first item)
  const activeFocus = pinnedData || hoveredData || displayData[0] || {};

  return (
    <section className="py-12 px-4 sm:px-6 max-w-7xl mx-auto animate-fade-in">
      {/* ── Section Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="relative flex h-3 w-3">
              {isLiveStreaming && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              )}
              <span className={`relative inline-flex rounded-full h-3 w-3 ${isLiveStreaming ? 'bg-cyan-400' : 'bg-slate-500'}`} />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Radio size={13} className={isLiveStreaming ? 'animate-pulse text-cyan-300' : ''} />
              Interactive Atmospheric Telemetry & Dynamics
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Live Weather <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-cyan-300 to-blue-400">Interactive Telemetry Charts</span>
          </h2>
          <p className="text-slate-400 text-sm mt-1 max-w-2xl">
            Real-time multi-dimensional weather curves for {selectedCity.city}. Hover across the timeline or click any hour to scrub and inspect atmospheric micro-telemetry.
          </p>
        </div>

        {/* Live Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Live countdown */}
          {isLiveStreaming && (
            <div className="glass-card px-3 py-1.5 rounded-xl text-xs text-slate-300 flex items-center gap-2">
              <span className="text-slate-400">Sync:</span>
              <span className="font-mono text-cyan-400 font-semibold">{countdown}s</span>
              <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-400 transition-all duration-1000"
                  style={{ width: `${(countdown / refreshInterval) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Toggle Live Stream */}
          <button
            onClick={() => setIsLiveStreaming(!isLiveStreaming)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
              isLiveStreaming
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30'
                : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Zap size={13} />
            {isLiveStreaming ? 'Auto-Sync Active' : 'Auto-Sync Paused'}
          </button>

          {/* Manual Refresh */}
          <button
            onClick={() => fetchLiveData(true)}
            disabled={isRefreshing}
            className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50"
            title="Refresh telemetry immediately"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin text-sky-400' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* ── City Selector Pills ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 no-scrollbar">
        {FEATURED_CITIES.map(c => {
          const isSelected = selectedCity.city === c.city;
          return (
            <button
              key={c.city}
              onClick={() => setSelectedCity(c)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition border ${
                isSelected
                  ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white border-sky-400 shadow-md shadow-sky-500/25 scale-105'
                  : 'glass-card text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              {c.city}
            </button>
          );
        })}
      </div>

      {/* ── INTERACTIVE TIMELINE SCRUBBER INSPECTOR ── */}
      <div className="glass-card p-5 rounded-3xl border border-sky-200/80 bg-gradient-to-r from-white/95 via-[#faf6ee]/90 to-[#edf5fd]/95 shadow-md mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          {/* Left: Time & Sky preview */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-100 to-blue-100 border border-sky-200 flex items-center justify-center text-3xl shadow-sm flex-shrink-0">
              {activeFocus.precipitation > 2 ? '⛈️' : activeFocus.precipitation > 0 ? '🌧️' : activeFocus.temperature > 32 ? '☀️' : '🌤️'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-sky-700 uppercase tracking-wider flex items-center gap-1">
                  <Clock size={13} /> Time Horizon: {activeFocus.hour || 'Now'}
                </span>
                {pinnedData && (
                  <span className="text-[10px] bg-amber-500/20 text-amber-700 px-2 py-0.5 rounded-full border border-amber-500/30 font-semibold">
                    PINNED HOUR
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-3xl font-black text-slate-900 tracking-tight">
                  {activeFocus.temperature ?? '--'}°C
                </span>
                <span className="text-sm font-semibold text-amber-600">
                  Feels {activeFocus.feels_like ?? '--'}°C
                </span>
              </div>
              <p className="text-xs text-slate-600">
                {activeFocus.precipitation > 0
                  ? `Rainfall: ${activeFocus.precipitation} mm/h (${activeFocus.precipitation_probability}% probability)`
                  : `Dry conditions with ${activeFocus.humidity ?? 50}% relative humidity`}
              </p>
            </div>
          </div>

          {/* Center/Right: Key Micro-telemetry values */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white/90 border border-sky-200/80 rounded-2xl p-3 text-center shadow-sm">
              <span className="text-[11px] text-slate-500 font-medium block mb-0.5">Wind Velocity</span>
              <span className="text-base font-bold text-cyan-700">{activeFocus.wind_speed ?? '--'} km/h</span>
            </div>
            <div className="bg-white/90 border border-sky-200/80 rounded-2xl p-3 text-center shadow-sm">
              <span className="text-[11px] text-slate-500 font-medium block mb-0.5">Barometer</span>
              <span className="text-base font-bold text-purple-700">{activeFocus.pressure ?? '--'} hPa</span>
            </div>
            <div className="bg-white/90 border border-sky-200/80 rounded-2xl p-3 text-center shadow-sm">
              <span className="text-[11px] text-slate-500 font-medium block mb-0.5">Precip Chance</span>
              <span className="text-base font-bold text-sky-700">{activeFocus.precipitation_probability ?? 0}%</span>
            </div>
            <div className="bg-white/90 border border-sky-200/80 rounded-2xl p-3 text-center shadow-sm">
              <span className="text-[11px] text-slate-500 font-medium block mb-0.5">Solar UV Index</span>
              <span className="text-base font-bold text-amber-700">{activeFocus.uv_index ?? 0}</span>
            </div>
          </div>

          {/* Reset pin button if pinned */}
          {pinnedData && (
            <button
              onClick={() => setPinnedData(null)}
              className="text-xs text-slate-400 hover:text-white underline self-start lg:self-center"
            >
              Unpin Hour
            </button>
          )}
        </div>

        {/* Extrema Highlights Bar */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1 text-emerald-400">
              <ArrowUp size={12} /> Hottest: <strong className="text-slate-200">{extrema.maxTemp?.temperature}°C</strong> ({extrema.maxTemp?.hour})
            </span>
            <span className="flex items-center gap-1 text-sky-400">
              <ArrowDown size={12} /> Coolest: <strong className="text-slate-200">{extrema.minTemp?.temperature}°C</strong> ({extrema.minTemp?.hour})
            </span>
            {extrema.maxRain?.precipitation > 0 && (
              <span className="flex items-center gap-1 text-blue-400">
                <CloudRain size={12} /> Peak Rain: <strong className="text-slate-200">{extrema.maxRain?.precipitation} mm</strong> ({extrema.maxRain?.hour})
              </span>
            )}
            <span className="flex items-center gap-1 text-purple-400">
              <Gauge size={12} /> Lowest Barometer: <strong className="text-slate-200">{extrema.minPressure?.pressure} hPa</strong>
            </span>
          </div>
          <span className="text-slate-500 text-[11px]">Hover graph to preview any hour</span>
        </div>
      </div>

      {/* ── INTERACTIVE GRAPH CONTROLS BAR ── */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-4">
        {/* Metric Visibility Toggle Chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-slate-400 font-semibold mr-1 flex items-center gap-1">
            <Sliders size={12} /> Layers:
          </span>

          <button
            onClick={() => toggleMetric('temperature')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition border flex items-center gap-1.5 ${
              visibleMetrics.temperature
                ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                : 'bg-slate-900/60 text-slate-500 border-slate-800 line-through'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-sky-400" /> Temp
          </button>

          <button
            onClick={() => toggleMetric('feels_like')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition border flex items-center gap-1.5 ${
              visibleMetrics.feels_like
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-900/60 text-slate-500 border-slate-800 line-through'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400" /> Feels Like
          </button>

          <button
            onClick={() => toggleMetric('precipitation')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition border flex items-center gap-1.5 ${
              visibleMetrics.precipitation
                ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                : 'bg-slate-900/60 text-slate-500 border-slate-800 line-through'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-blue-400" /> Rain (mm)
          </button>

          <button
            onClick={() => toggleMetric('rainProb')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition border flex items-center gap-1.5 ${
              visibleMetrics.rainProb
                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                : 'bg-slate-900/60 text-slate-500 border-slate-800 line-through'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-indigo-400" /> Rain %
          </button>

          <button
            onClick={() => toggleMetric('wind_speed')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition border flex items-center gap-1.5 ${
              visibleMetrics.wind_speed
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                : 'bg-slate-900/60 text-slate-500 border-slate-800 line-through'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400" /> Wind
          </button>

          <button
            onClick={() => toggleMetric('pressure')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition border flex items-center gap-1.5 ${
              visibleMetrics.pressure
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                : 'bg-slate-900/60 text-slate-500 border-slate-800 line-through'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-purple-400" /> Pressure
          </button>
        </div>

        {/* Horizon Range Selector */}
        <div className="flex bg-white/90 border border-sky-200 rounded-xl p-1 gap-1 self-end md:self-auto shadow-sm">
          {[
            { hours: 12, label: '12 Hours' },
            { hours: 24, label: '24 Hours' },
            { hours: 48, label: '48 Hours' },
          ].map(h => (
            <button
              key={h.hours}
              onClick={() => setHorizonHours(h.hours)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                horizonHours === h.hours
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {h.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main Interactive Chart Container ── */}
      <div className="glass-card p-5 sm:p-6 rounded-3xl border border-sky-200/80 bg-white/90 shadow-lg backdrop-blur-md">
        {loading ? (
          <div className="h-[400px] flex items-center justify-center">
            <div className="text-center">
              <div className="w-10 h-10 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-slate-400 text-xs tracking-wide">Processing live atmospheric telemetry...</p>
            </div>
          </div>
        ) : error ? (
          <div className="h-[400px] flex items-center justify-center">
            <div className="text-center max-w-sm text-slate-400">
              <AlertCircle size={32} className="text-amber-400 mx-auto mb-2" />
              <p className="text-sm text-slate-300 font-semibold mb-1">Telemetry Alert</p>
              <p className="text-xs">{error}</p>
              <button
                onClick={() => fetchLiveData(true)}
                className="mt-4 px-4 py-2 bg-sky-500 text-white text-xs font-bold rounded-xl"
              >
                Retry Stream
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                Live Atmosphere Telemetry Curve ({horizonHours}h Horizon)
              </h3>
              <span className="text-xs text-slate-400">
                Click any point on graph to pin details
              </span>
            </div>

            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={displayData}
                  margin={{ top: 15, right: 15, left: -20, bottom: 0 }}
                  onMouseMove={(e) => {
                    if (e && e.activePayload && e.activePayload.length > 0) {
                      setHoveredData(e.activePayload[0].payload);
                    }
                  }}
                  onClick={(e) => {
                    if (e && e.activePayload && e.activePayload.length > 0) {
                      setPinnedData(e.activePayload[0].payload);
                    }
                  }}
                >
                  <defs>
                    <linearGradient id="tempGradientLive" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="rainGradientLive" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.4} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="hour" stroke="#64748b" tick={{ fontSize: 11 }} />
                  
                  {/* Left Y Axis: Temperature (°C) */}
                  <YAxis yAxisId="temp" stroke="#38bdf8" tick={{ fontSize: 11 }} domain={['dataMin - 3', 'dataMax + 3']} />
                  
                  {/* Right Y Axis: Precipitation (mm) & Probability (%) */}
                  <YAxis yAxisId="rain" orientation="right" stroke="#60a5fa" tick={{ fontSize: 11 }} />

                  {/* Secondary Y Axis: Wind Speed (km/h) */}
                  <YAxis yAxisId="wind" orientation="right" hide={true} />

                  {/* Secondary Y Axis: Pressure (hPa) */}
                  <YAxis yAxisId="pressure" hide={true} domain={['dataMin - 5', 'dataMax + 5']} />

                  <Tooltip content={<CustomInteractiveTooltip />} />

                  {/* Threshold Line for Intense Rain (10mm/h) */}
                  <ReferenceLine yAxisId="rain" y={10} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Heavy Rain Threshold', fill: '#f87171', fontSize: 10, position: 'top' }} />

                  {/* Rain Bar Chart */}
                  {visibleMetrics.precipitation && (
                    <Bar yAxisId="rain" dataKey="precipitation" name="Rainfall (mm)" fill="url(#rainGradientLive)" radius={[4, 4, 0, 0]} maxBarSize={24} />
                  )}

                  {/* Rain Probability Line */}
                  {visibleMetrics.rainProb && (
                    <Line yAxisId="rain" type="monotone" dataKey="precipitation_probability" name="Rain Prob (%)" stroke="#818cf8" strokeWidth={1.5} dot={false} strokeDasharray="3 3" />
                  )}

                  {/* Temperature Area Chart */}
                  {visibleMetrics.temperature && (
                    <Area yAxisId="temp" type="monotone" dataKey="temperature" name="Temp (°C)" stroke="#38bdf8" strokeWidth={3} fill="url(#tempGradientLive)" dot={{ r: 2 }} activeDot={{ r: 6, stroke: '#38bdf8', strokeWidth: 2, fill: '#fff' }} />
                  )}

                  {/* Feels Like Temperature Line */}
                  {visibleMetrics.feels_like && (
                    <Line yAxisId="temp" type="monotone" dataKey="feels_like" name="Feels Like (°C)" stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 4" dot={false} />
                  )}

                  {/* Wind Velocity Line */}
                  {visibleMetrics.wind_speed && (
                    <Line yAxisId="wind" type="monotone" dataKey="wind_speed" name="Wind (km/h)" stroke="#06b6d4" strokeWidth={2} dot={false} />
                  )}

                  {/* Atmospheric Pressure Line */}
                  {visibleMetrics.pressure && (
                    <Line yAxisId="pressure" type="monotone" dataKey="pressure" name="Pressure (hPa)" stroke="#c084fc" strokeWidth={2} dot={false} />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// Custom Glassmorphic Tooltip
function CustomInteractiveTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-white/98 border border-sky-300 rounded-2xl p-3.5 shadow-xl backdrop-blur-md text-xs min-w-[190px]">
      <div className="font-bold text-slate-900 border-b border-sky-100 pb-1.5 mb-2 flex items-center justify-between">
        <span>Timeline: {label}</span>
        <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
      </div>
      <div className="space-y-1.5">
        {payload.map((item, i) => (
          <div key={i} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color || item.fill }} />
              <span className="text-slate-600">{item.name}:</span>
            </div>
            <span className="font-bold text-slate-900 font-mono">
              {item.value !== null && item.value !== undefined ? item.value : '--'}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-2 pt-1.5 border-t border-sky-100 text-[10px] text-slate-400 text-center">
        Click point to lock inspector
      </div>
    </div>
  );
}
