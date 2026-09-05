import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff, LogIn, AlertTriangle, Cloud } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { signIn, loading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await signIn(email, password);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-hero-pattern flex items-center justify-center px-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sky-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md animate-fade-in">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-sky-500/15 border border-sky-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Cloud size={28} className="text-sky-400" />
          </div>
          <h1 className="text-2xl font-black text-white">WeatherSense</h1>
          <p className="text-slate-400 text-sm mt-1">Admin Command Center</p>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-6">
            <Shield size={16} className="text-amber-400" />
            <span className="text-amber-400 text-sm font-semibold">Authorized Personnel Only</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label className="label" htmlFor="admin-email">Email Address</label>
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@weathersense.in"
                className="input-field"
                required
                autoComplete="username"
              />
            </div>

            <div>
              <label className="label" htmlFor="admin-password">Password</label>
              <div className="relative">
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field pr-10"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <AlertTriangle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !email || !password}
              className="btn-primary w-full justify-center py-3 mt-2"
              aria-label="Sign in to admin"
            >
              {submitting ? (
                <><div className="spinner" /> Signing in...</>
              ) : (
                <><LogIn size={16} /> Sign In</>
              )}
            </button>
          </form>

          {/* Quick Demo Access Helper */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <div className="bg-sky-500/10 border border-sky-500/20 rounded-xl p-3 text-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-sky-400 flex items-center gap-1">
                  🔑 Presentation / Demo Credentials
                </span>
                <span className="bg-sky-500/20 text-sky-300 text-[10px] px-1.5 py-0.5 rounded font-mono">
                  SIH 2026
                </span>
              </div>
              <p className="text-slate-400 mb-2.5">
                Email: <strong className="text-slate-200">admin@weathersense.in</strong><br />
                Password: <strong className="text-slate-200">admin123</strong>
              </p>
              <button
                type="button"
                onClick={() => {
                  setEmail('admin@weathersense.in');
                  setPassword('admin123');
                }}
                className="w-full py-1.5 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 font-semibold rounded-lg border border-sky-500/30 transition text-center"
              >
                Auto-Fill Demo Credentials
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          WeatherSense Admin Portal — SIH 2026 · Ministry of Earth Sciences
        </p>
      </div>
    </div>
  );
}
