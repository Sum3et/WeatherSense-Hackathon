import { Cloud, Globe, Users, Shield, Activity, ExternalLink, CheckCircle } from 'lucide-react';

export default function About() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 animate-fade-in">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 bg-sky-50 text-sky-700 border border-sky-200 rounded-full px-4 py-1.5 mb-6 font-semibold shadow-sm">
          <span className="text-sm">SIH 2026 Problem Statement SIH26069</span>
        </div>
        <h1 className="text-4xl font-black text-slate-900 mb-4">About WeatherSense</h1>
        <p className="text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
          National Weather Big Data Analytics Platform — a centralized intelligence platform
          for India combining official meteorological data, real-time forecasts, and verified
          citizen observations.
        </p>
      </div>

      {/* Problem Statement */}
      <div className="card mb-8 bg-white/90 shadow-sm border border-sky-100">
        <h2 className="section-title mb-4 flex items-center gap-2">
          <Activity size={18} className="text-amber-600" />
          Problem Statement
        </h2>
        <p className="text-slate-700 leading-relaxed">
          India faces significant challenges in weather-related disaster management due to fragmented
          data sources and lack of a unified platform. The Ministry of Earth Sciences requires a
          centralized system that integrates official IMD data, real-time forecasts, social media signals,
          and ground-truth citizen reports to provide early warnings and improved situational awareness.
        </p>
      </div>

      {/* Technical Architecture */}
      <div className="card mb-8 bg-white/90 shadow-sm border border-sky-100">
        <h2 className="section-title mb-6 flex items-center gap-2">
          <Globe size={18} className="text-sky-600" />
          Technical Architecture
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            {
              title: 'Frontend',
              items: ['React.js 18 with Vite', 'Tailwind CSS', 'Leaflet + OpenStreetMap', 'Recharts visualizations', 'Firebase Realtime listeners'],
              color: 'sky',
            },
            {
              title: 'Backend',
              items: ['Python FastAPI', 'Google Firebase Firestore', 'Firebase Cloud Storage', 'Open-Meteo API', 'IMD API Integration'],
              color: 'emerald',
            },
            {
              title: 'AI/ML',
              items: ['Google Gemini AI classification', 'Multi-factor confidence scoring', 'Duplicate detection', 'Keyword fallback system', 'Location consistency checks'],
              color: 'purple',
            },
            {
              title: 'Data Sources',
              items: ['India Met Dept (IMD)', 'Open-Meteo (free, open)', 'OpenStreetMap (geocoding)', 'Reddit India subreddits', 'Public web RSS feeds'],
              color: 'amber',
            },
          ].map(({ title, items, color }) => (
            <div key={title}>
              <h3 className={`font-bold text-sm mb-3 ${
                color === 'sky' ? 'text-sky-700' :
                color === 'emerald' ? 'text-emerald-700' :
                color === 'purple' ? 'text-purple-700' : 'text-amber-700'
              }`}>
                {title}
              </h3>
              <ul className="space-y-1.5">
                {items.map(item => (
                  <li key={item} className="flex items-center gap-2 text-sm text-slate-700">
                    <CheckCircle size={12} className="text-emerald-600 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Key Features */}
      <div className="card mb-8 bg-white/90 shadow-sm border border-sky-100">
        <h2 className="section-title mb-6 flex items-center gap-2">
          <Shield size={18} className="text-emerald-600" />
          Key Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            'Anonymous citizen weather reporting',
            'GPS-based location detection',
            'AI-powered event classification (Gemini)',
            'Multi-factor confidence scoring',
            'Admin verification workflow',
            'Duplicate report detection',
            'Firebase real-time updates',
            'Interactive Leaflet map with clustering',
            'IMD official data integration point',
            'Open-Meteo 7-day forecast',
            'Social media ingestion (Reddit, Meta stubs)',
            'Public RSS news feed monitoring',
            'Admin analytics dashboard',
            'Media/photo evidence support',
          ].map(feature => (
            <div key={feature} className="flex items-center gap-2.5 text-sm text-slate-700">
              <CheckCircle size={14} className="text-emerald-600 flex-shrink-0" />
              {feature}
            </div>
          ))}
        </div>
      </div>

      {/* Organization */}
      <div className="card bg-gradient-to-br from-white via-sky-50/50 to-amber-50/40 border border-sky-200 shadow-sm">
        <h2 className="section-title mb-4 flex items-center gap-2">
          <Users size={18} className="text-sky-600" />
          Organization
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          {[
            ['Theme', 'Disaster Management'],
            ['Organization', 'Ministry of Earth Sciences (MoES)'],
            ['Problem ID', 'SIH26069'],
            ['Event', 'Smart India Hackathon 2026'],
            ['Category', 'Software'],
            ['Data License', 'Open-Meteo CC BY 4.0'],
          ].map(([key, val]) => (
            <div key={key}>
              <div className="text-slate-500 text-xs mb-0.5">{key}</div>
              <div className="text-slate-800 font-semibold">{val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mt-8 p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
        <p className="text-amber-400/80 text-sm leading-relaxed">
          <strong className="text-amber-400">Disclaimer:</strong> WeatherSense is a prototype application
          built for SIH 2026. Weather data is sourced from Open-Meteo (free, open-source API).
          IMD integration requires official API access credentials. Citizen reports are for demonstration only.
          This system should not be used for real emergency response without proper validation.
        </p>
      </div>
    </div>
  );
}
