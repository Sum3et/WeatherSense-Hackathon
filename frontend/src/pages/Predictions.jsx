import { Sparkles, Shield, Activity, BrainCircuit } from 'lucide-react';
import AIPredictions from '../components/AIPredictions';
import LiveWeatherGraphs from '../components/LiveWeatherGraphs';

export default function Predictions() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      {/* Header Banner */}
      <div className="mb-8 bg-gradient-to-r from-white/95 via-[#faf6ee]/90 to-[#edf5fd]/95 border border-sky-200/80 rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500/15 to-orange-500/15 border border-amber-500/30 rounded-full px-4 py-1 mb-3">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
              </span>
              <span className="text-amber-800 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                <BrainCircuit size={13} className="text-amber-600" />
                AI Ensemble Forecasting Hub
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Predictive Weather & Disaster Intelligence
            </h1>
            <p className="text-slate-600 text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
              Synthesizing real-time satellite telemetry, numerical atmospheric models (ECMWF, NCUM-G),
              and ground citizen sensor streams using Gemini 2.5 Flash for rapid disaster mitigation.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 self-start md:self-center">
            <div className="bg-white/90 border border-sky-200 rounded-2xl px-4 py-3 shadow-sm text-center">
              <span className="text-[11px] font-bold text-slate-500 uppercase block">Model Consensus</span>
              <span className="text-xl font-black text-emerald-600 font-mono">94.8%</span>
            </div>
            <div className="bg-white/90 border border-sky-200 rounded-2xl px-4 py-3 shadow-sm text-center">
              <span className="text-[11px] font-bold text-slate-500 uppercase block">Forecast Horizon</span>
              <span className="text-xl font-black text-sky-600 font-mono">48 Hours</span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Disaster Predictions Component */}
      <div id="ai-predictions">
        <AIPredictions />
      </div>

      {/* Live Atmospheric Telemetry Curves */}
      <div className="mt-8" id="telemetry-graphs">
        <LiveWeatherGraphs />
      </div>
    </div>
  );
}
