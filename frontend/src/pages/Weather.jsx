import { useState, useMemo } from 'react';
import {
  Search, MapPin, Thermometer, Droplets, Wind, Eye, Cloud,
  BarChart3, AlertTriangle, Flame, Snowflake, Compass, Radio,
  TrendingUp, Sparkles, Filter
} from 'lucide-react';
import WeatherCard from '../components/WeatherCard';
import WeatherMap from '../components/WeatherMap';
import LiveWeatherGraphs from '../components/LiveWeatherGraphs';
import { useCitiesWeather, useCurrentWeather, useForecast } from '../hooks/useWeather';
import { MAJOR_CITIES } from '../utils/constants';
import { formatDistanceToNow, format } from 'date-fns';

const WEATHER_ICONS_BY_CODE = (code) => {
  if (code == null) return '🌤️';
  if ([0, 1].includes(code)) return '☀️';
  if ([2, 3].includes(code)) return '⛅';
  if ([45, 48].includes(code)) return '🌫️';
  if (code >= 51 && code <= 67) return '🌧️';
  if (code >= 71 && code <= 77) return '🌨️';
  if (code >= 80 && code <= 82) return '🌦️';
  if (code >= 95) return '⛈️';
  return '🌤️';
};

const REGIONS = [
  'All India', 'North', 'South', 'West', 'East', 'Central', 'Northeast', 'Islands'
];

export default function Weather() {
  const [selectedCity, setSelectedCity] = useState(MAJOR_CITIES[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('All India');

  const { cities, loading: citiesLoading } = useCitiesWeather();
  const { weather, loading: weatherLoading } = useCurrentWeather(
    selectedCity.lat, selectedCity.lon, selectedCity.city, selectedCity.state
  );
  const { forecast, loading: forecastLoading } = useForecast(
    selectedCity.lat, selectedCity.lon, selectedCity.city, 7
  );

  // Compute National Telemetry Extremes across all active stations
  const nationalExtremes = useMemo(() => {
    if (!cities || cities.length === 0) return null;

    const validTemps = cities.filter(c => typeof c.temperature === 'number');
    const validPrecip = cities.filter(c => typeof c.precipitation === 'number');
    const validWind = cities.filter(c => typeof c.wind_speed === 'number');

    const hottest = validTemps.length ? validTemps.reduce((max, c) => c.temperature > max.temperature ? c : max, validTemps[0]) : null;
    const coldest = validTemps.length ? validTemps.reduce((min, c) => c.temperature < min.temperature ? c : min, validTemps[0]) : null;
    const rainiest = validPrecip.length ? validPrecip.reduce((max, c) => c.precipitation > max.precipitation ? c : max, validPrecip[0]) : null;
    const windiest = validWind.length ? validWind.reduce((max, c) => c.wind_speed > max.wind_speed ? c : max, validWind[0]) : null;

    return { hottest, coldest, rainiest, windiest };
  }, [cities]);

  // Filter stations by region and search query
  const filteredCities = useMemo(() => {
    return MAJOR_CITIES.filter(c => {
      const matchesRegion = selectedRegion === 'All India' || c.region === selectedRegion;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        c.city.toLowerCase().includes(q) ||
        c.state.toLowerCase().includes(q) ||
        (c.region && c.region.toLowerCase().includes(q));
      return matchesRegion && matchesSearch;
    });
  }, [selectedRegion, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 animate-fade-in space-y-8">
      {/* Header & Observatories Counter */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-sky-100/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-800 border border-sky-200 shadow-sm">
              <Radio size={12} className="text-sky-600 animate-pulse" />
              Pan-India Live Observatories Network
            </span>
            <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-semibold">
              75 Synoptic Stations Active
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            National Weather Telemetry
          </h1>
          <p className="text-slate-600 mt-1 text-sm sm:text-base">
            Real-time multi-variable meteorological sensor streams across all 28 States and 8 Union Territories
          </p>
        </div>

        {/* Region stats counter */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 bg-white/80 backdrop-blur border border-sky-100 px-3.5 py-2 rounded-xl shadow-xs">
          <MapPin size={14} className="text-sky-500" />
          <span>Active View: <strong className="text-slate-800">{filteredCities.length}</strong> of {MAJOR_CITIES.length} Stations</span>
        </div>
      </div>

      {/* National Extremes Real-Time Ticker */}
      {nationalExtremes && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          <div className="card p-3.5 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border-amber-200/60 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center shrink-0">
              <Flame size={20} />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Hottest Station</div>
              <div className="text-sm font-extrabold text-slate-900 truncate">
                {nationalExtremes.hottest?.city} <span className="text-xs text-slate-500 font-medium">({nationalExtremes.hottest?.state})</span>
              </div>
              <div className="text-base font-black text-amber-600 tabular-nums">
                {nationalExtremes.hottest?.temperature != null ? `${Math.round(nationalExtremes.hottest.temperature)}°C` : '—'}
              </div>
            </div>
          </div>

          <div className="card p-3.5 bg-gradient-to-br from-sky-500/10 via-sky-500/5 to-transparent border-sky-200/60 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/15 text-sky-600 flex items-center justify-center shrink-0">
              <Snowflake size={20} />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-bold text-sky-700 uppercase tracking-wider">Coldest Station</div>
              <div className="text-sm font-extrabold text-slate-900 truncate">
                {nationalExtremes.coldest?.city} <span className="text-xs text-slate-500 font-medium">({nationalExtremes.coldest?.state})</span>
              </div>
              <div className="text-base font-black text-sky-600 tabular-nums">
                {nationalExtremes.coldest?.temperature != null ? `${Math.round(nationalExtremes.coldest.temperature)}°C` : '—'}
              </div>
            </div>
          </div>

          <div className="card p-3.5 bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent border-blue-200/60 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-600 flex items-center justify-center shrink-0">
              <Droplets size={20} />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Wettest / Peak Rain</div>
              <div className="text-sm font-extrabold text-slate-900 truncate">
                {nationalExtremes.rainiest?.city} <span className="text-xs text-slate-500 font-medium">({nationalExtremes.rainiest?.state})</span>
              </div>
              <div className="text-base font-black text-blue-600 tabular-nums">
                {nationalExtremes.rainiest?.precipitation != null ? `${nationalExtremes.rainiest.precipitation} mm` : '0 mm'}
              </div>
            </div>
          </div>

          <div className="card p-3.5 bg-gradient-to-br from-teal-500/10 via-teal-500/5 to-transparent border-teal-200/60 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/15 text-teal-600 flex items-center justify-center shrink-0">
              <Wind size={20} />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-bold text-teal-700 uppercase tracking-wider">Strongest Wind</div>
              <div className="text-sm font-extrabold text-slate-900 truncate">
                {nationalExtremes.windiest?.city} <span className="text-xs text-slate-500 font-medium">({nationalExtremes.windiest?.state})</span>
              </div>
              <div className="text-base font-black text-teal-600 tabular-nums">
                {nationalExtremes.windiest?.wind_speed != null ? `${Math.round(nationalExtremes.windiest.wind_speed)} km/h` : '—'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Regional Zone Selector Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        {REGIONS.map(reg => {
          const isSelected = selectedRegion === reg;
          const count = reg === 'All India'
            ? MAJOR_CITIES.length
            : MAJOR_CITIES.filter(c => c.region === reg).length;

          return (
            <button
              key={reg}
              onClick={() => setSelectedRegion(reg)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 shadow-xs ${
                isSelected
                  ? 'bg-sky-600 text-white shadow-sky-600/20 shadow-md font-extrabold scale-[1.02]'
                  : 'bg-white/80 hover:bg-white text-slate-600 hover:text-slate-900 border border-sky-100/80'
              }`}
            >
              <span>{reg}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                isSelected ? 'bg-sky-700/50 text-sky-100' : 'bg-slate-100 text-slate-500'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left sidebar — city search & filterable station list */}
        <div className="lg:col-span-1 space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={`Search in ${selectedRegion} (${filteredCities.length} stations)...`}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="input-field pl-10 pr-4 py-2.5 text-sm bg-white/90 shadow-xs border-sky-100 focus:border-sky-400"
              aria-label="Search city"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>

          {/* Station list with scroll */}
          <div className="card p-0 overflow-hidden bg-white/90 shadow-sm border border-sky-100">
            <div className="p-3 bg-slate-50/70 border-b border-sky-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin size={13} className="text-sky-500" />
                Select Observatory
              </span>
              <span className="text-[11px] text-slate-400 font-semibold">
                Showing {filteredCities.length}
              </span>
            </div>
            <div className="divide-y divide-sky-100/70 max-h-[460px] overflow-y-auto scrollbar-thin">
              {filteredCities.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs">
                  No stations found matching &quot;{searchQuery}&quot; in {selectedRegion}.
                </div>
              ) : (
                filteredCities.map(city => {
                  const cityData = cities.find(c => c.city === city.city);
                  const isSelected = selectedCity.city === city.city;

                  return (
                    <button
                      key={city.city}
                      onClick={() => setSelectedCity(city)}
                      className={`w-full flex items-center justify-between px-4 py-3 text-left transition-all duration-150 ${
                        isSelected
                          ? 'bg-sky-50/90 border-l-4 border-sky-500 font-semibold'
                          : 'hover:bg-sky-50/40 border-l-4 border-transparent'
                      }`}
                      aria-pressed={isSelected}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-sm font-semibold truncate ${isSelected ? 'text-sky-800' : 'text-slate-800'}`}>
                            {city.city}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-medium">
                            {city.region}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                          <span>{city.state}</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0 flex items-center gap-2">
                        {cityData?.weather_code != null && (
                          <span className="text-base" title={cityData.weather_condition}>
                            {WEATHER_ICONS_BY_CODE(cityData.weather_code)}
                          </span>
                        )}
                        {cityData?.temperature != null ? (
                          <div className={`text-base font-black tabular-nums ${isSelected ? 'text-sky-600' : 'text-slate-700'}`}>
                            {Math.round(cityData.temperature)}°
                          </div>
                        ) : (
                          <div className="text-xs text-slate-400">—</div>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* IMD Official Bridge status */}
          <div className="card bg-sky-50/50 border-sky-200/60 p-3.5">
            <div className="flex items-start gap-2.5">
              <Radio size={15} className="text-sky-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-sky-800 uppercase tracking-wide">Synoptic Grid Status</div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Full 75-station telemetry synchronized via high-speed parallel chunking. Auto-refreshes every 10 minutes.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Current weather card */}
          {weatherLoading ? (
            <div className="card animate-pulse h-56" />
          ) : weather ? (
            <WeatherCard
              city={selectedCity.city}
              state={`${selectedCity.state} (${selectedCity.region} Zone)`}
              weather={weather}
              source="open_meteo"
            />
          ) : (
            <div className="card text-center py-10">
              <Cloud size={40} className="text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">Weather data unavailable. Check backend connection.</p>
            </div>
          )}

          {/* 7-day forecast */}
          {forecast && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="section-title">7-Day Forecast — {selectedCity.city}</h2>
                <span className="text-xs text-slate-500 font-semibold">ECMWF / Open-Meteo</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                {forecast.daily?.slice(0, 7).map((day, i) => {
                  const date = new Date(day.timestamp);
                  return (
                    <div key={i} className="card p-3 text-center bg-white/90 shadow-sm border border-sky-100 hover:border-sky-300 transition-colors">
                      <div className="text-xs text-slate-500 mb-1 font-semibold">
                        {i === 0 ? 'Today' : format(date, 'EEE')}
                      </div>
                      <div className="text-2xl mb-1">{WEATHER_ICONS_BY_CODE(day.weather_code)}</div>
                      <div className="text-sm font-extrabold text-slate-900">
                        {day.temperature_max != null ? Math.round(day.temperature_max) : '—'}°
                      </div>
                      <div className="text-xs text-slate-500 font-medium">
                        {day.temperature_min != null ? Math.round(day.temperature_min) : '—'}°
                      </div>
                      {day.precipitation_sum > 0 && (
                        <div className="text-[11px] text-blue-600 font-bold mt-1 bg-blue-50 rounded px-1">
                          {day.precipitation_sum}mm
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Map for selected city */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title">Station Geographic Radar & Coordinates</h2>
              <span className="text-xs text-slate-500 font-mono">
                {selectedCity.lat.toFixed(4)}° N, {selectedCity.lon.toFixed(4)}° E
              </span>
            </div>
            <WeatherMap
              reports={[]}
              cities={cities.filter(c => c.city === selectedCity.city)}
              height="320px"
              showCities={true}
            />
          </div>
        </div>
      </div>

      {/* Real-Time Telemetry & Curves Section */}
      <div className="pt-2">
        <LiveWeatherGraphs />
      </div>

      {/* All Cities Comparison Grid */}
      <div className="pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h2 className="section-title">Regional Weather Comparison — {selectedRegion}</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Showing live synoptic observations across {filteredCities.length} meteorological stations
            </p>
          </div>
          <span className="text-xs text-sky-700 bg-sky-100/70 border border-sky-200 px-3 py-1 rounded-full font-bold self-start sm:self-auto">
            Parallel Batch Synced
          </span>
        </div>

        {citiesLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="card animate-pulse h-28" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {filteredCities.map(city => {
              const cityData = cities.find(c => c.city === city.city);
              const isSelected = selectedCity.city === city.city;

              return (
                <button
                  key={city.city}
                  onClick={() => {
                    setSelectedCity(city);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`text-left rounded-xl transition-all duration-150 transform hover:-translate-y-0.5 ${
                    isSelected ? 'ring-2 ring-sky-500 shadow-md' : 'hover:shadow-sm'
                  }`}
                  aria-label={`Select ${city.city}`}
                >
                  <WeatherCard
                    city={city.city}
                    state={city.state}
                    weather={cityData || { city: city.city, state: city.state }}
                    compact={true}
                  />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
