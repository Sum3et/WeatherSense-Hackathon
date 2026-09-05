import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Cloud, Activity, Shield, Users, Map, BarChart3,
  ArrowRight, CheckCircle, AlertTriangle, Zap, Globe, Sparkles, MapPin
} from 'lucide-react';
import WeatherMap from '../components/WeatherMap';
import WeatherCard from '../components/WeatherCard';
import ReportCard from '../components/ReportCard';
import StatCard from '../components/StatCard';
import LiveWeatherGraphs from '../components/LiveWeatherGraphs';
import AIPredictions from '../components/AIPredictions';
import { useCitiesWeather } from '../hooks/useWeather';
import { useVerifiedReports } from '../hooks/useReports';
import { reportsApi } from '../services/api';

// Major Indian Metros for Quick Hero Switcher
const MAJOR_CITIES = ['Delhi', 'Mumbai', 'Bengaluru', 'Kolkata', 'Chennai', 'Hyderabad'];

const DEFAULT_CITIES_WEATHER = {
  Delhi: { city: 'Delhi', state: 'Delhi', temperature: 29, feels_like: 30, humidity: 58, wind_speed: 11, weather_condition: 'Partly Cloudy', precipitation: 0, pressure: 1012, uv_index: 6, visibility: 8, source: 'open_meteo' },
  Mumbai: { city: 'Mumbai', state: 'Maharashtra', temperature: 28, feels_like: 31, humidity: 78, wind_speed: 14, weather_condition: 'Light Drizzle', precipitation: 1.2, pressure: 1010, uv_index: 5, visibility: 7, source: 'open_meteo' },
  Bengaluru: { city: 'Bengaluru', state: 'Karnataka', temperature: 27, feels_like: 28, humidity: 62, wind_speed: 9, weather_condition: 'Partly Cloudy', precipitation: 0, pressure: 1014, uv_index: 7, visibility: 9, source: 'open_meteo' },
  Kolkata: { city: 'Kolkata', state: 'West Bengal', temperature: 31, feels_like: 36, humidity: 75, wind_speed: 8, weather_condition: 'Thunderstorm', precipitation: 3.5, pressure: 1008, uv_index: 4, visibility: 6, source: 'open_meteo' },
  Chennai: { city: 'Chennai', state: 'Tamil Nadu', temperature: 33, feels_like: 37, humidity: 70, wind_speed: 12, weather_condition: 'Mainly Clear', precipitation: 0, pressure: 1011, uv_index: 8, visibility: 10, source: 'open_meteo' },
  Hyderabad: { city: 'Hyderabad', state: 'Telangana', temperature: 30, feels_like: 33, humidity: 65, wind_speed: 10, weather_condition: 'Scattered Clouds', precipitation: 0.2, pressure: 1012, uv_index: 6, visibility: 8, source: 'open_meteo' },
};

export default function Home() {
  const { cities, loading: citiesLoading } = useCitiesWeather();
  const { reports: verifiedReports, loading: reportsLoading } = useVerifiedReports(6);

  const [counts, setCounts] = useState({
    total: 0,
    verified: 0,
    pending: 0,
    flagged: 0,
  });

  useEffect(() => {
    reportsApi.getPublicStats()
      .then(res => {
        if (res) {
          setCounts(res);
        } else {
          setCounts({
            total: verifiedReports.length,
            verified: verifiedReports.length,
            pending: 0,
            flagged: 0,
          });
        }
      })
      .catch(() => {
        setCounts({
          total: verifiedReports.length,
          verified: verifiedReports.length,
          pending: 0,
          flagged: 0,
        });
      });
  }, [verifiedReports.length]);

  const [selectedCity, setSelectedCity] = useState('Delhi');

  const activeCity =
    cities.find(c => c.city?.toLowerCase() === selectedCity.toLowerCase()) ||
    DEFAULT_CITIES_WEATHER[selectedCity] ||
    DEFAULT_CITIES_WEATHER.Delhi;

  return (
    <div className="animate-fade-in">

      {/* ── Hero ─────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#faf6ee] via-[#f3f8fd] to-[#e8f2fc] border-b border-sky-100">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-sky-400/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-amber-400/10 rounded-full blur-3xl" />
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 opacity-[0.025]"
               style={{backgroundImage: 'linear-gradient(rgba(14,165,233,1) 1px, transparent 1px), linear-gradient(90deg, rgba(14,165,233,1) 1px, transparent 1px)', backgroundSize: '60px 60px'}} />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-12 md:pt-8 md:pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
            {/* Left — Hero text */}
            <div className="lg:col-span-7 relative z-10 pt-1">
              {/* SIH badge */}
              <div className="inline-flex items-center gap-2 bg-sky-500/10 border border-sky-500/25 rounded-full px-3.5 py-1 mb-3 shadow-xs">
                <div className="live-dot" />
                <span className="text-sky-800 text-xs font-bold uppercase tracking-wider">
                  SIH 2026 — Ministry of Earth Sciences
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-[3.4rem] font-black text-slate-900 leading-[1.08] tracking-tight">
                Weather<span className="text-sky-600">Sense</span>
              </h1>
              <p className="text-lg sm:text-xl font-bold text-slate-800 mt-2 mb-3">
                Real-Time Weather Intelligence for a Safer India
              </p>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-xl mb-6">
                Combining official IMD weather data, real-time Open-Meteo forecasts,
                verified citizen reports and AI-powered analysis into one centralized
                national weather intelligence platform.
              </p>

              {/* CTA buttons */}
              <div className="flex flex-wrap items-center gap-3">
                <Link to="/weather" className="btn-primary text-sm sm:text-base px-5 py-2.5 shadow-sm">
                  <Cloud size={17} />
                  View Live Weather
                </Link>
                <Link
                  to="/predictions"
                  className="btn-secondary text-sm sm:text-base px-4 py-2.5 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 hover:border-amber-300 text-amber-900 font-bold hover:shadow-sm"
                >
                  <Sparkles size={16} className="text-amber-600" />
                  AI Predictions
                </Link>
                <Link to="/report" className="btn-secondary text-sm sm:text-base px-4 py-2.5">
                  <Activity size={16} />
                  Report Weather
                </Link>
              </div>

              {/* Trust indicators */}
              <div className="flex flex-wrap gap-5 mt-7 pt-5 border-t border-sky-100/80">
                {[
                  { icon: Shield,   label: 'AI Verification' },
                  { icon: Globe,    label: 'India-Focused' },
                  { icon: Zap,      label: 'Real-Time Telemetry' },
                  { icon: Users,    label: 'Citizen Network' },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-600 font-medium">
                    <Icon size={14} className="text-sky-600" />
                    {label}
                  </div>
                ))}
              </div>

              {/* Live National Intelligence & Latest Verified Report Cards (Stacked One Above the Other) */}
              <div className="mt-6 pt-5 border-t border-sky-100/90 flex flex-col gap-3.5">
                {/* Card 1: Latest Verified Community Alert (Full Width Horizontal Card) */}
                <div className="bg-white/90 backdrop-blur-sm border border-sky-200/90 rounded-2xl p-4 shadow-sm hover:border-sky-300 transition-all">
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                      </span>
                      <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Latest Verified Citizen Alert</span>
                    </div>
                    <span className="text-[10px] text-emerald-700 bg-emerald-100/90 font-bold px-2 py-0.5 rounded-full border border-emerald-200/70">
                      LIVE VERIFIED
                    </span>
                  </div>

                  {verifiedReports.length > 0 ? (
                    <Link to="/reports" className="block group">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/80 p-3 rounded-xl border border-sky-100/80 group-hover:border-sky-300 transition-all">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold text-slate-900 group-hover:text-sky-600 transition-colors flex items-center gap-2 flex-wrap">
                            <span>{verifiedReports[0].event_category || 'Weather Alert'}</span>
                            <span className="text-xs text-slate-500 font-normal">
                              • {verifiedReports[0].city || 'India'}{verifiedReports[0].state ? `, ${verifiedReports[0].state}` : ''}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 line-clamp-1 mt-1 leading-relaxed">
                            "{verifiedReports[0].description}"
                          </p>
                        </div>
                        {verifiedReports[0].confidence_score != null && (
                          <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1 flex-shrink-0">
                            <span className="text-xs font-bold text-emerald-700 bg-emerald-100/70 border border-emerald-200 px-2 py-0.5 rounded-lg">
                              {Math.round(verifiedReports[0].confidence_score)}% Score
                            </span>
                            <span className="text-[11px] text-sky-600 font-semibold group-hover:underline">
                              View in Feed →
                            </span>
                          </div>
                        )}
                      </div>
                    </Link>
                  ) : (
                    <p className="text-xs text-slate-500 italic py-2">
                      Weather monitoring active. No active critical citizen advisories.
                    </p>
                  )}
                </div>

                {/* Card 2: Platform Telemetry & AI Status (Full Width Horizontal Card) */}
                <div className="bg-white/90 backdrop-blur-sm border border-sky-200/90 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Zap size={13} className="text-amber-500" />
                      <span>National Telemetry & AI Engines</span>
                    </span>
                    <span className="text-[10px] text-sky-700 font-semibold bg-sky-100/90 px-2.5 py-0.5 rounded-full border border-sky-200/60">
                      Active 24/7
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div className="bg-slate-50/90 border border-sky-100 rounded-xl p-2.5">
                      <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Verification Engine</div>
                      <div className="text-xs font-bold text-purple-700 mt-1 flex items-center gap-1">
                        <Sparkles size={12} className="text-purple-600 flex-shrink-0" />
                        <span>Google Gemini AI</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Multi-modal cross-check</div>
                    </div>

                    <div className="bg-slate-50/90 border border-sky-100 rounded-xl p-2.5">
                      <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Numerical Model</div>
                      <div className="text-xs font-bold text-sky-800 mt-1 flex items-center gap-1">
                        <Cloud size={12} className="text-sky-600 flex-shrink-0" />
                        <span>Open-Meteo Ensemble</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">7-Day live forecast</div>
                    </div>

                    <div className="bg-slate-50/90 border border-sky-100 rounded-xl p-2.5">
                      <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Ground Telemetry</div>
                      <div className="text-xs font-bold text-emerald-700 mt-1 flex items-center gap-1">
                        <Globe size={12} className="text-emerald-600 flex-shrink-0" />
                        <span>Doppler Radar Sync</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Pan-India coverage</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right — Hero city weather + city selector + mini map */}
            <div className="lg:col-span-5 relative z-10 space-y-3.5">
              {/* Major Metro Cities Quick Switcher */}
              <div className="bg-white/85 backdrop-blur-md border border-sky-200/80 rounded-2xl p-3 shadow-sm">
                <div className="flex items-center justify-between gap-2 mb-2 px-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
                    <MapPin size={13} className="text-sky-600" />
                    <span>Major Metro Cities</span>
                  </div>
                  <span className="text-[11px] text-sky-700 font-semibold bg-sky-100/90 px-2 py-0.5 rounded-full border border-sky-200/60">
                    Live Open-Meteo
                  </span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                  {MAJOR_CITIES.map(cityName => {
                    const cData = cities.find(c => c.city?.toLowerCase() === cityName.toLowerCase()) || DEFAULT_CITIES_WEATHER[cityName];
                    const temp = cData?.temperature != null ? `${Math.round(cData.temperature)}°` : null;
                    const isSelected = selectedCity.toLowerCase() === cityName.toLowerCase();
                    return (
                      <button
                        key={cityName}
                        type="button"
                        onClick={() => setSelectedCity(cityName)}
                        className={`py-1.5 px-2 rounded-xl text-xs transition-all duration-200 flex flex-col items-center justify-center cursor-pointer ${
                          isSelected
                            ? 'bg-sky-600 text-white font-bold shadow-md ring-2 ring-sky-300 scale-[1.03]'
                            : 'bg-slate-50/90 hover:bg-sky-50 text-slate-700 border border-slate-200/80 hover:border-sky-300'
                        }`}
                      >
                        <span className="font-semibold truncate w-full text-center">{cityName}</span>
                        {temp && (
                          <span className={`text-[10px] mt-0.5 ${
                            isSelected ? 'text-sky-100 font-bold' : 'text-slate-500 font-medium'
                          }`}>
                            {temp}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Current weather for Selected City */}
              <div className="transition-all duration-300">
                <WeatherCard
                  city={activeCity.city}
                  state={activeCity.state}
                  weather={activeCity}
                  source={activeCity.source || "open_meteo"}
                />
              </div>

              {/* Mini map preview */}
              <div className="relative">
                <WeatherMap
                  reports={verifiedReports.slice(0, 20)}
                  cities={cities}
                  height="240px"
                  showCities={true}
                />
                <Link
                  to="/weather"
                  className="absolute bottom-3 right-3 bg-white/95 backdrop-blur border border-sky-200
                             text-slate-800 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm
                             hover:bg-sky-50 transition-colors flex items-center gap-1.5"
                >
                  <Map size={12} className="text-sky-600" />
                  Explore Full Map
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Live Stats ─────────────────────────────── */}
      <section className="bg-white/60 backdrop-blur-sm border-y border-sky-200/60 shadow-inner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Reports',    value: counts.total,    color: 'sky' },
              { label: 'Verified Reports', value: counts.verified, color: 'emerald' },
              { label: 'Pending Review',   value: counts.pending,  color: 'amber' },
              { label: 'Flagged',          value: counts.flagged,  color: 'orange' },
            ].map(({ label, value, color }) => (
              <div key={label} className="text-center">
                <div className={`text-3xl font-black tabular-nums ${
                  color === 'sky' ? 'text-sky-600' :
                  color === 'emerald' ? 'text-emerald-600' :
                  color === 'amber' ? 'text-amber-600' : 'text-orange-600'
                }`}>
                  {value ?? 0}
                </div>
                <div className="text-slate-600 font-medium text-sm mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── City Weather Strip ─────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="section-title">Live City Weather</h2>
            <p className="text-muted mt-1">Real-time data from Open-Meteo API</p>
          </div>
          <Link to="/weather" className="btn-secondary text-sm py-2 px-4">
            All Cities <ArrowRight size={14} />
          </Link>
        </div>

        {citiesLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="h-20 bg-sky-200/60 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {cities.slice(0, 10).map(city => (
              <WeatherCard
                key={city.city}
                city={city.city}
                state={city.state}
                weather={city}
                source="open_meteo"
                compact={true}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Live Weather Telemetry Graphs ───────────── */}
      <LiveWeatherGraphs />

      {/* ── AI Weather & Disaster Predictions ───────── */}
      <div id="predictions">
        <AIPredictions />
      </div>

      {/* ── Recent Verified Reports ─────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="section-title">Recent Verified Reports</h2>
            <p className="text-muted mt-1">Reviewed and confirmed by WeatherSense administrators</p>
          </div>
          <Link to="/reports" className="btn-secondary text-sm py-2 px-4">
            All Reports <ArrowRight size={14} />
          </Link>
        </div>

        {reportsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="card animate-pulse h-40" />
            ))}
          </div>
        ) : verifiedReports.length === 0 ? (
          <div className="card text-center py-12">
            <Cloud size={48} className="text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No verified weather reports yet.</p>
            <p className="text-slate-500 text-sm mt-1">
              Be the first to <Link to="/report" className="text-sky-400 hover:underline">report weather</Link> in your area.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {verifiedReports.map(report => (
              <ReportCard key={report.id} report={report} />
            ))}
          </div>
        )}
      </section>

      {/* ── Platform Features ─────────────────────── */}
      <section className="bg-gradient-to-b from-[#faf6ee] via-[#edf5fd] to-[#faf6ee] border-y border-sky-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-slate-900 mb-3">How WeatherSense Works</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              A multi-source weather intelligence platform designed to support disaster management
              and provide real-time awareness for India.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Globe, color: 'emerald',
                title: 'Official IMD Data',
                desc: 'Integration with India Meteorological Department for authoritative weather observations, forecasts, and warnings.',
              },
              {
                icon: Cloud, color: 'sky',
                title: 'Open-Meteo API',
                desc: 'High-resolution real-time weather data and 7-day forecasts for every location across India.',
              },
              {
                icon: Users, color: 'amber',
                title: 'Citizen Reports',
                desc: 'Anonymous weather event reporting with GPS location, photo evidence, and instant submission.',
              },
              {
                icon: Shield, color: 'purple',
                title: 'AI Verification',
                desc: 'Gemini AI classifies reports, calculates confidence scores, and flags suspicious submissions for admin review.',
              },
            ].map(({ icon: Icon, color, title, desc }) => (
              <div key={title} className="card hover:border-sky-400 bg-white/90 text-center shadow-sm">
                <div className={`w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center ${
                  color === 'emerald' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/60' :
                  color === 'sky' ? 'bg-sky-50 text-sky-600 border border-sky-200/60' :
                  color === 'amber' ? 'bg-amber-50 text-amber-600 border border-amber-200/60' : 'bg-purple-50 text-purple-600 border border-purple-200/60'
                }`}>
                  <Icon size={22} />
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Report CTA ─────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 text-center">
        <div className="bg-gradient-to-br from-sky-100/70 to-amber-50/70 border border-sky-200 rounded-3xl p-12 shadow-sm">
          <Activity size={48} className="text-sky-600 mx-auto mb-4" />
          <h2 className="text-3xl font-black text-slate-900 mb-3">
            Observed a Weather Event?
          </h2>
          <p className="text-slate-600 max-w-lg mx-auto mb-6">
            Help build India's largest crowdsourced weather observation network.
            Your report takes less than a minute and helps communities prepare for disasters.
          </p>
          <Link to="/report" className="btn-primary text-base px-8 py-3 inline-flex">
            <Activity size={18} />
            Report Weather Now
          </Link>
          <p className="text-slate-500 text-sm mt-4">
            No registration required. All reports are verified before public display.
          </p>
        </div>
      </section>
    </div>
  );
}
