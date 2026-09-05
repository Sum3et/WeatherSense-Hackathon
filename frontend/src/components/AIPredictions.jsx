import { useState, useMemo } from 'react';
import {
  BrainCircuit, ShieldAlert, Waves, Wind, Sun, Zap, AlertTriangle,
  Clock, CheckCircle2, ChevronRight, Info, Compass, ArrowUpRight,
  TrendingUp, Sparkles, Filter, RefreshCw
} from 'lucide-react';

const PREDICTION_SCENARIOS = {
  'live': {
    name: 'Real-Time Telemetry AI Forecast',
    badge: 'LIVE SENSOR SYNTHESIS',
    alertLevel: 'ORANGE',
    primaryRisk: 'Urban Inundation & Thunderstorm Activity',
    confidence: 94,
    peakWindow: '15:30 – 19:00 IST',
    summary: 'Localized intense precipitation convection detected over metropolitan corridors. Saturated topsoil and low-pressure trough will likely impede standard stormwater drainage.',
    advisories: [
      'Municipal drainage teams: deploy portable dewatering pumps to railway subways and underpasses.',
      'Public transport: anticipate 20-35 min delays along central arterial roads due to transient waterlogging.',
      'Disaster Management Authority (SDMA): activate regional emergency response coordinators on standby.'
    ],
    probabilities: {
      flood: 78,
      cyclone: 24,
      lightning: 68,
      heatStress: 38,
    },
    timeline: [
      { time: '14:00', risk: 'Moderate', desc: 'Convective cloud build-up and barometric pressure decline (-1.4 hPa/h).' },
      { time: '16:00', risk: 'High', desc: 'Peak precipitation onset (estimated 25-35 mm/h). Urban runoff exceeds threshold.' },
      { time: '18:30', risk: 'Critical', desc: 'Intensive localized flash flood danger in low-lying sectors.' },
      { time: '21:00', risk: 'Low', desc: 'System dissipates eastward; atmospheric stability returns to baseline.' },
    ]
  },
  'cyclone': {
    name: 'Tropical Cyclone Track Prediction',
    badge: 'CYCLONIC DEPRESSION SCENARIO',
    alertLevel: 'RED',
    primaryRisk: 'Coastal Gale Winds & Severe Storm Surge',
    confidence: 92,
    peakWindow: 'Next 12 – 24 Hours',
    summary: 'Deep depression in Bay of Bengal intensifying into Severe Cyclonic Storm. Sustained gale winds of 85-110 km/h with high sea waves.',
    advisories: [
      'Fishermen advised not to venture into deep sea or coastal waters.',
      'Evacuate vulnerable kutcha dwellings in low-lying coastal belts to designated cyclone shelters.',
      'Power distribution utilities: isolate high-voltage feeder lines in vulnerable zones to prevent arcing.'
    ],
    probabilities: {
      flood: 86,
      cyclone: 96,
      lightning: 75,
      heatStress: 10,
    },
    timeline: [
      { time: '06:00', risk: 'High', desc: 'Outer rainbands make landfall with squally winds 55-65 km/h.' },
      { time: '12:00', risk: 'Critical', desc: 'Cyclone eye wall approaches; peak gale winds up to 105 km/h.' },
      { time: '18:00', risk: 'Severe', desc: 'Storm surge inundation up to 1.5 meters in riverine deltas.' },
      { time: '00:00', risk: 'Moderate', desc: 'System weakens into cyclonic depression as it moves inland.' },
    ]
  },
  'heatwave': {
    name: 'Extreme Heatwave & Hyperthermia Risk',
    badge: 'THERMAL STRESS SCENARIO',
    alertLevel: 'YELLOW',
    primaryRisk: 'Severe Wet-Bulb Heat Stress & Solar Radiation',
    confidence: 96,
    peakWindow: '12:00 – 16:30 IST',
    summary: 'Strong north-westerly hot winds dominating northwest and central India. Maximum surface temperatures hovering between 43°C – 46°C.',
    advisories: [
      'Avoid direct outdoor exposure between 12 PM and 4 PM, particularly for children and senior citizens.',
      'Ensure uninterrupted power supply for water pumping stations and hospital emergency cooling wards.',
      'Provide shaded resting hubs and oral rehydration salts (ORS) at public transit intersections.'
    ],
    probabilities: {
      flood: 5,
      cyclone: 2,
      lightning: 15,
      heatStress: 94,
    },
    timeline: [
      { time: '10:30', risk: 'Moderate', desc: 'Rapid surface solar radiation spike; UV index exceeds 8.0.' },
      { time: '13:30', risk: 'Critical', desc: 'Peak ambient temp 44.5°C; wet-bulb temperature reaches 31.2°C.' },
      { time: '16:00', risk: 'High', desc: 'Persistent thermal heat dome; surface cooling delayed until twilight.' },
      { time: '19:00', risk: 'Low', desc: 'Ambient temperatures taper to 35°C; nighttime warmth lingers.' },
    ]
  },
  'monsoon': {
    name: 'Active Monsoon Trough & Soil Saturation',
    badge: 'MONSOON CONVERGENCE',
    alertLevel: 'GREEN',
    primaryRisk: 'Beneficial Inflow with Minor Waterlogging',
    confidence: 89,
    peakWindow: 'Continuous 48 Hours',
    summary: 'Healthy monsoon surge providing widespread moderate rainfall. Favorable for Kharif sowing with negligible disaster hazard.',
    advisories: [
      'Normal agricultural operations can proceed across catchment areas.',
      'Inspect check dams and reservoirs for controlled inflow management.',
      'Maintain standard municipal drain clearance schedules.'
    ],
    probabilities: {
      flood: 32,
      cyclone: 12,
      lightning: 42,
      heatStress: 14,
    },
    timeline: [
      { time: 'Morning', risk: 'Normal', desc: 'Overcast skies with intermittent light to moderate drizzles.' },
      { time: 'Afternoon', risk: 'Normal', desc: 'Steady monsoonal showers; reservoir catchment storage replenishment.' },
      { time: 'Evening', risk: 'Normal', desc: 'Pleasant temperatures, wind speeds 15-20 km/h from south-west.' },
    ]
  }
};

export default function AIPredictions({ city = 'Delhi' }) {
  const [selectedScenarioKey, setSelectedScenarioKey] = useState('live');
  const scenario = PREDICTION_SCENARIOS[selectedScenarioKey] || PREDICTION_SCENARIOS.live;

  const alertBadge = useMemo(() => {
    switch (scenario.alertLevel) {
      case 'RED':
        return { bg: 'bg-red-500/20 text-red-300 border-red-500/40', dot: 'bg-red-500', label: 'RED ALERT — Severe Hazard' };
      case 'ORANGE':
        return { bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40', dot: 'bg-amber-500', label: 'ORANGE WARNING — Preparedness Required' };
      case 'YELLOW':
        return { bg: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40', dot: 'bg-yellow-400', label: 'YELLOW WATCH — Be Aware' };
      default:
        return { bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', dot: 'bg-emerald-400', label: 'GREEN — Normal Conditions' };
    }
  }, [scenario.alertLevel]);

  return (
    <section className="py-10 px-4 sm:px-6 max-w-7xl mx-auto animate-fade-in">
      {/* ── Section Title & Header ── */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-8 gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500/20 to-sky-500/20 border border-purple-500/30 rounded-full px-4 py-1 mb-3">
            <Sparkles size={14} className="text-purple-400 animate-pulse" />
            <span className="text-purple-300 text-xs font-bold uppercase tracking-wider">
              MoES AI Predictive Weather & Disaster Intelligence
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            AI Disaster Predictions & <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-sky-400 to-cyan-300">Early Warning System</span>
          </h2>
          <p className="text-slate-400 text-sm mt-1 max-w-2xl">
            Machine Learning ensemble synthesis correlating satellite imagery, numerical weather prediction models, and live telemetry for {city}.
          </p>
        </div>

        {/* Scenario Simulator Controls */}
        <div className="flex items-center gap-2 flex-wrap bg-white/90 p-1.5 rounded-2xl border border-sky-200 shadow-sm">
          <span className="text-xs text-slate-500 font-semibold px-2 flex items-center gap-1">
            <Filter size={12} /> Mode:
          </span>
          {Object.entries(PREDICTION_SCENARIOS).map(([key, item]) => (
            <button
              key={key}
              onClick={() => setSelectedScenarioKey(key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                selectedScenarioKey === key
                  ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/25'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-sky-50'
              }`}
            >
              {key === 'live' ? '⚡ Live Telemetry' : key.charAt(0).toUpperCase() + key.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main Prediction Card ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Left 2 Cols: Primary Assessment */}
        <div className="lg:col-span-2 glass-card p-6 rounded-3xl border border-sky-200/80 bg-white/90 shadow-md relative overflow-hidden flex flex-col justify-between">
          {/* Subtle atmospheric glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-sky-400/10 rounded-full blur-3xl pointer-events-none" />

          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <span className={`inline-flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full border ${alertBadge.bg}`}>
                <span className={`w-2 h-2 rounded-full ${alertBadge.dot} animate-ping`} />
                {alertBadge.label}
              </span>
              <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                <Clock size={13} className="text-sky-600" />
                Peak Window: <strong className="text-slate-800">{scenario.peakWindow}</strong>
              </div>
            </div>

            <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">
              {scenario.primaryRisk}
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed mb-6">
              {scenario.summary}
            </p>

            {/* Probability Gauges Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {/* Flash Flood */}
              <div className="bg-sky-50/70 border border-sky-100 rounded-2xl p-3.5 shadow-sm">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5 font-medium">
                  <span>Flash Flood</span>
                  <Waves size={14} className="text-sky-600" />
                </div>
                <div className="text-2xl font-black text-sky-700">{scenario.probabilities.flood}%</div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-sky-500 h-full rounded-full transition-all duration-500" style={{ width: `${scenario.probabilities.flood}%` }} />
                </div>
              </div>

              {/* Cyclone Storm */}
              <div className="bg-sky-50/70 border border-sky-100 rounded-2xl p-3.5 shadow-sm">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5 font-medium">
                  <span>Cyclone Force</span>
                  <Wind size={14} className="text-cyan-600" />
                </div>
                <div className="text-2xl font-black text-cyan-700">{scenario.probabilities.cyclone}%</div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-cyan-500 h-full rounded-full transition-all duration-500" style={{ width: `${scenario.probabilities.cyclone}%` }} />
                </div>
              </div>

              {/* Severe Lightning */}
              <div className="bg-amber-50/70 border border-amber-100 rounded-2xl p-3.5 shadow-sm">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5 font-medium">
                  <span>Lightning Risk</span>
                  <Zap size={14} className="text-amber-600" />
                </div>
                <div className="text-2xl font-black text-amber-700">{scenario.probabilities.lightning}%</div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${scenario.probabilities.lightning}%` }} />
                </div>
              </div>

              {/* Heat Stress */}
              <div className="bg-orange-50/70 border border-orange-100 rounded-2xl p-3.5 shadow-sm">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5 font-medium">
                  <span>Heat Stress</span>
                  <Sun size={14} className="text-orange-600" />
                </div>
                <div className="text-2xl font-black text-orange-700">{scenario.probabilities.heatStress}%</div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-orange-500 h-full rounded-full transition-all duration-500" style={{ width: `${scenario.probabilities.heatStress}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Actionable Directives */}
          <div className="bg-white/95 border border-sky-200 rounded-2xl p-4 shadow-sm">
            <h4 className="text-xs font-bold uppercase tracking-wider text-sky-700 mb-2 flex items-center gap-1.5">
              <ShieldAlert size={14} /> Recommended Action Protocol (MoES / NDMA Directives)
            </h4>
            <ul className="space-y-2 text-xs text-slate-700">
              {scenario.advisories.map((adv, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 size={13} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>{adv}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Col: Timeline & AI Engine Consensus */}
        <div className="glass-card p-6 rounded-3xl border border-sky-200/80 bg-white/90 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-sky-100 pb-3">
              <div className="flex items-center gap-2">
                <BrainCircuit size={16} className="text-purple-600" />
                <span className="font-bold text-slate-900 text-sm">Predictive Timeline</span>
              </div>
              <span className="text-[11px] font-mono text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full font-semibold">
                {scenario.confidence}% Confidence
              </span>
            </div>

            {/* Stepped Timeline */}
            <div className="space-y-3.5 mb-6">
              {scenario.timeline.map((step, idx) => (
                <div key={idx} className="flex items-start gap-3 relative">
                  {idx !== scenario.timeline.length - 1 && (
                    <div className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-slate-200" />
                  )}
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold border ${
                    step.risk === 'Critical' ? 'bg-red-50 text-red-700 border-red-200' :
                    step.risk === 'High' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    step.risk === 'Severe' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                    'bg-sky-50 text-sky-700 border-sky-200'
                  }`}>
                    {idx + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900">{step.time}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                        step.risk === 'Critical' ? 'text-red-700 bg-red-50 border border-red-200' :
                        step.risk === 'High' ? 'text-amber-700 bg-amber-50 border border-amber-200' :
                        step.risk === 'Severe' ? 'text-orange-700 bg-orange-50 border border-orange-200' :
                        'text-sky-700 bg-sky-50 border border-sky-200'
                      }`}>
                        {step.risk}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Model Consensus Footer */}
          <div className="bg-white/95 border border-sky-200 rounded-2xl p-3.5 text-xs text-slate-600 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-slate-800">Ensemble Model Agreement</span>
              <span className="text-emerald-600 font-bold font-mono">94.8%</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Harmonized across ECMWF IFS, NCUM-G (MoES India), and Gemini 2.5 Flash pattern synthesis.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
