import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin, Camera, Upload, CheckCircle, AlertTriangle,
  Locate, FileImage, Video, Trash2, ChevronRight, ChevronLeft, Send
} from 'lucide-react';
import toast from 'react-hot-toast';
import { reportsApi } from '../services/api';
import { uploadFile } from '../services/firebase';
import { EVENT_CATEGORIES } from '../utils/constants';
// Use browser's built-in UUID generator
const uuidv4 = () => crypto.randomUUID();

const STEPS = ['Location', 'Event Type', 'Description', 'Evidence', 'Submit'];

function StepIndicator({ currentStep }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((label, i) => (
        <div key={label} className="flex items-center flex-1">
          <div className="flex flex-col items-center">
            <div className={`step-circle ${
              i < currentStep ? 'completed' :
              i === currentStep ? 'active' : 'inactive'
            }`}>
              {i < currentStep ? <CheckCircle size={14} /> : i + 1}
            </div>
            <span className={`text-xs mt-1 ${
              i === currentStep ? 'text-sky-400' :
              i < currentStep ? 'text-emerald-400' : 'text-slate-600'
            } hidden sm:block`}>
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`step-line mb-4 ${i < currentStep ? 'active' : ''}`} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function Report() {
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [reportId, setReportId] = useState(null);

  // Form state
  const [location, setLocation] = useState({ lat: null, lon: null, city: '', name: '' });
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // ── Step 0: Location ─────────────────────────
  const getLocation = useCallback(() => {
    setLocationLoading(true);
    setLocationError('');

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocation(prev => ({ ...prev, lat: latitude, lon: longitude }));

        // Reverse geocode
        try {
          const resp = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { 'User-Agent': 'WeatherSense/1.0' } }
          );
          const data = await resp.json();
          const addr = data.address || {};
          const city = addr.city || addr.town || addr.village || addr.county || '';
          const state = addr.state || '';
          setLocation({ lat: latitude, lon: longitude, city, state, name: data.display_name || '' });
        } catch (e) {
          setLocation(prev => ({ ...prev, name: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` }));
        }

        setLocationLoading(false);
      },
      (err) => {
        setLocationError(
          err.code === 1
            ? 'Location permission denied. Please enter your location manually below.'
            : 'Unable to determine your location. Please try again.'
        );
        setLocationLoading(false);
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  // ── Step 3: Media ─────────────────────────────
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only JPG, PNG, WEBP images and MP4, MOV videos are allowed.');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error('File size must be under 50MB.');
      return;
    }

    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
  };

  // ── Submit ────────────────────────────────────
  const handleSubmit = async () => {
    if (!location.lat || !location.lon) {
      toast.error('Location is required.');
      setStep(0);
      return;
    }
    if (!category) {
      toast.error('Please select an event type.');
      setStep(1);
      return;
    }
    if (description.length < 10) {
      toast.error('Please provide a more detailed description (at least 10 characters).');
      setStep(2);
      return;
    }

    setSubmitting(true);

    try {
      const newReportId = uuidv4();
      setReportId(newReportId);

      // Submit report metadata first
      const reportPayload = {
        event_category: category,
        description,
        latitude: location.lat,
        longitude: location.lon,
        city: location.city || '',
        state: location.state || '',
        location_name: location.name || '',
      };

      const result = await reportsApi.submit(reportPayload);
      const savedId = result.report_id || newReportId;
      setReportId(savedId);

      setSubmitted(true);
      toast.success('Report submitted successfully!');


    } catch (err) {
      console.error('Submission error:', err);
      toast.error(`Submission failed: ${err.message}`);
    } finally {
      setSubmitting(false);
      setUploadProgress(0);
    }
  };

  // ── Success screen ─────────────────────────────
  if (submitted) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center animate-fade-in">
        <div className="w-20 h-20 bg-emerald-500/15 border-2 border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} className="text-emerald-400" />
        </div>
        <h1 className="text-2xl font-black text-white mb-3">Report Submitted!</h1>
        <div className="card bg-emerald-500/5 border-emerald-500/20 mb-6">
          <p className="text-slate-300 leading-relaxed">
            Report submitted successfully. It will be reviewed by WeatherSense
            before appearing as verified information.
          </p>
          {reportId && (
            <p className="text-xs text-slate-500 mt-3 font-mono">
              Report ID: {reportId.slice(0, 8)}...
            </p>
          )}
        </div>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => {
              setSubmitted(false); setStep(0); setCategory('');
              setDescription(''); setMediaFile(null); setMediaPreview(null);
              setLocation({ lat: null, lon: null, city: '', name: '' });
            }}
            className="btn-secondary"
          >
            Submit Another
          </button>
          <button onClick={() => navigate('/reports')} className="btn-primary">
            View Reports
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white">Report Weather</h1>
        <p className="text-slate-400 mt-1">
          Submit a local weather or disaster observation. No registration required.
        </p>
      </div>

      <StepIndicator currentStep={step} />

      {/* ── Step 0: Location ─────────────────────── */}
      {step === 0 && (
        <div className="card space-y-5 animate-slide-up">
          <h2 className="section-title flex items-center gap-2">
            <MapPin size={18} className="text-sky-400" />
            Your Location
          </h2>

          <button
            onClick={getLocation}
            disabled={locationLoading}
            className="btn-primary w-full justify-center py-3"
            aria-label="Use my current location"
          >
            {locationLoading ? (
              <><div className="spinner" /> Detecting location...</>
            ) : (
              <><Locate size={18} /> Use My Location</>
            )}
          </button>

          {locationError && (
            <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <AlertTriangle size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-amber-300 text-sm">{locationError}</p>
            </div>
          )}

          {location.lat && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle size={14} className="text-emerald-400" />
                <span className="text-emerald-400 text-sm font-semibold">Location captured</span>
              </div>
              <div className="text-slate-300 text-sm">
                <p>📍 {location.city}{location.state ? `, ${location.state}` : ''}</p>
                <p className="text-slate-500 text-xs mt-1 font-mono">
                  {location.lat?.toFixed(6)}, {location.lon?.toFixed(6)}
                </p>
              </div>
            </div>
          )}

          {/* Manual entry fallback */}
          <div>
            <label className="label">Or enter city name manually</label>
            <input
              type="text"
              placeholder="e.g., Mumbai, Maharashtra"
              value={location.name}
              onChange={e => setLocation(prev => ({ ...prev, name: e.target.value }))}
              className="input-field"
              aria-label="City name"
            />
          </div>
        </div>
      )}

      {/* ── Step 1: Category ─────────────────────── */}
      {step === 1 && (
        <div className="card space-y-4 animate-slide-up">
          <h2 className="section-title">Select Event Type</h2>
          <div className="grid grid-cols-2 gap-2">
            {EVENT_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`p-3 rounded-xl border text-left transition-all duration-150 ${
                  category === cat
                    ? 'bg-sky-500/15 border-sky-500 text-sky-400 font-semibold'
                    : 'bg-slate-900/50 border-slate-700 text-slate-300 hover:border-slate-500 hover:bg-slate-800/50'
                }`}
                aria-pressed={category === cat}
              >
                <span className="text-sm">{cat}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Step 2: Description ─────────────────── */}
      {step === 2 && (
        <div className="card space-y-4 animate-slide-up">
          <h2 className="section-title">Describe the Event</h2>
          <div>
            <label className="label" htmlFor="description">
              What did you observe? <span className="text-red-400">*</span>
            </label>
            <textarea
              id="description"
              rows={5}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe what you see — e.g., 'Heavy rain since 6 AM causing waterlogging near station road. Water is knee-deep in some areas...'"
              className="input-field resize-none"
              maxLength={2000}
            />
            <div className="flex justify-between mt-1">
              <p className="text-xs text-slate-500">Minimum 10 characters</p>
              <p className={`text-xs ${description.length > 1800 ? 'text-amber-400' : 'text-slate-500'}`}>
                {description.length}/2000
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 3: Evidence ─────────────────────── */}
      {step === 3 && (
        <div className="card space-y-4 animate-slide-up">
          <h2 className="section-title">Evidence & Media</h2>

          <div className="border-2 border-dashed border-slate-700 bg-slate-800/40 rounded-xl p-8 text-center">
            <Camera size={36} className="text-sky-400 mx-auto mb-3 opacity-80" />
            <h3 className="text-white font-semibold text-base mb-1">Media Upload Coming Soon</h3>
            <p className="text-slate-400 text-sm max-w-md mx-auto mb-4">
              Image and video attachments are currently disabled in the standard tier. You do not need to attach media to submit your report.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-sky-500/10 border border-sky-500/25 rounded-full text-xs text-sky-300 font-medium">
              <CheckCircle size={13} className="text-sky-400" />
              Location & description details are sufficient for verification
            </div>
          </div>
        </div>
      )}

      {/* ── Step 4: Review & Submit ──────────────── */}

      {step === 4 && (
        <div className="card space-y-4 animate-slide-up">
          <h2 className="section-title">Review Your Report</h2>

          <div className="space-y-3">
            {[
              { label: 'Location', value: location.lat ? `${location.city || location.name} (${location.lat?.toFixed(4)}, ${location.lon?.toFixed(4)})` : 'Not set' },
              { label: 'Event Type', value: category || 'Not selected' },
              { label: 'Description', value: description || 'Not provided', truncate: true },
              { label: 'Evidence', value: mediaFile ? `${mediaFile.name}` : 'No media attached' },
            ].map(({ label, value, truncate }) => (
              <div key={label} className="flex gap-3 py-2 border-b border-slate-800 last:border-0">
                <span className="text-slate-500 text-sm w-28 flex-shrink-0">{label}</span>
                <span className={`text-slate-200 text-sm ${truncate ? 'line-clamp-2' : ''}`}>{value}</span>
              </div>
            ))}
          </div>

          <div className="bg-sky-500/5 border border-sky-500/20 rounded-lg p-3">
            <p className="text-sky-300/80 text-xs leading-relaxed">
              ℹ️ Your report will be reviewed by a WeatherSense administrator before being
              made publicly visible. AI analysis will be applied automatically.
            </p>
          </div>
        </div>
      )}

      {/* ── Navigation buttons ─────────────────── */}
      <div className="flex justify-between mt-6">
        <button
          onClick={() => setStep(s => s - 1)}
          disabled={step === 0}
          className={`btn-secondary ${step === 0 ? 'opacity-40 cursor-not-allowed' : ''}`}
        >
          <ChevronLeft size={16} />
          Back
        </button>

        {step < STEPS.length - 1 ? (
          <button
            onClick={() => setStep(s => s + 1)}
            disabled={
              (step === 0 && !location.lat && !location.name) ||
              (step === 1 && !category) ||
              (step === 2 && description.length < 10)
            }
            className="btn-primary"
          >
            Next
            <ChevronRight size={16} />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="btn-primary"
            aria-label="Submit report"
          >
            {submitting ? (
              <><div className="spinner" /> Submitting...</>
            ) : (
              <><Send size={16} /> Submit Report</>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
