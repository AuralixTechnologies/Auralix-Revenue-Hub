import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, API_BASE_URL } from '../services/api';
import { AuralixLogo } from '../components/common/AuralixLogo';
import { Lock, User, Eye, EyeOff, ShieldCheck, ArrowRight, Loader2, KeyRound } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const demoAccounts = [
    { role: 'CEO', username: 'ceo_rubini', name: 'Rubini T', pass: 'auralix123' },
    { role: 'MD', username: 'md_hari', name: 'Hari Haran V S', pass: 'auralix123' },
    { role: 'COO', username: 'coo_rashika', name: 'Rashika V', pass: 'auralix123' },
    { role: 'CBDO', username: 'cbdo_dhanusya', name: 'Dhanusya D', pass: 'auralix123' },
  ];

  const handleQuickLogin = (username: string, pass: string) => {
    setUsernameOrEmail(username);
    setPassword(pass);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameOrEmail || !password) {
      setError('Please enter both username/email and password.');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const res = await api.post('/auth/login', {
        username_or_email: usernameOrEmail,
        password: password,
      });
      const { access_token, user } = res.data;
      login(access_token, user);
    } catch (err: any) {
      if (!err.response) {
        setError(`Backend Connection Failed: Unable to connect to API server at "${API_BASE_URL}". Please ensure the FastAPI backend is running.`);
      } else if (err.response.status === 401) {
        setError(err.response.data?.detail || 'Invalid username/email or password.');
      } else {
        setError(err.response.data?.detail || `Server error (${err.response.status}). Please try again later.`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-950 flex items-center justify-center p-4 overflow-hidden selection:bg-orange-500 selection:text-white">
      {/* Animated Gradient Background Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl animate-pulse-slow pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Futuristic Grid Lines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293715_1px,transparent_1px),linear-gradient(to_bottom,#1f293715_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        {/* Main Card */}
        <div className="glass-card rounded-3xl p-8 border border-slate-800 shadow-2xl backdrop-blur-xl">
          {/* Brand Header */}
          <div className="flex flex-col items-center text-center mb-6">
            <AuralixLogo size="lg" className="mb-4" />
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Authorized Personnel Only</span>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium text-center animate-in fade-in leading-relaxed">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Username or Email
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  placeholder="ceo_rubini"
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl pl-10 pr-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl pl-10 pr-11 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-slate-950 font-bold text-sm rounded-2xl shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition-all transform active:scale-98 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Authenticating...
                </>
              ) : (
                <>
                  Access Command Hub <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Accounts Selection */}
          <div className="mt-6 pt-5 border-t border-slate-800/80">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-3 font-medium">
              <KeyRound className="w-3.5 h-3.5 text-orange-400" />
              <span>Quick Login Demo Accounts (Password: <code className="text-orange-400 bg-orange-950/40 px-1 py-0.5 rounded">auralix123</code>):</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.username}
                  type="button"
                  onClick={() => handleQuickLogin(acc.username, acc.pass)}
                  className={`px-3 py-2 text-left rounded-xl border text-xs transition-all ${
                    usernameOrEmail === acc.username
                      ? 'bg-orange-500/20 border-orange-500/50 text-orange-300'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="font-bold text-slate-200">{acc.role}</div>
                  <div className="text-[11px] text-slate-400 truncate">{acc.name}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          © 2026 Auralix Technologies. Internal Business System. All rights reserved.
        </p>
      </div>
    </div>
  );
};

