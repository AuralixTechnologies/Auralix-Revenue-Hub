import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  User as UserIcon, Mail, Lock, ShieldCheck, Calendar,
  Phone, AtSign, Eye, EyeOff, CheckCircle2, AlertCircle,
  KeyRound, Pencil, Save, X
} from 'lucide-react';

// ── Small helpers ────────────────────────────────────────────────────────────

const InfoRow: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/60">
    <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 flex-shrink-0">
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-[10px] uppercase tracking-widest text-slate-500 font-medium">{label}</p>
      <p className="text-sm font-semibold text-slate-200 truncate">{value || '—'}</p>
    </div>
  </div>
);

const Toast: React.FC<{ type: 'success' | 'error'; message: string; onClose: () => void }> = ({ type, message, onClose }) => (
  <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border text-sm font-medium animate-in fade-in slide-in-from-bottom-4 ${
    type === 'success'
      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
      : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
  }`}>
    {type === 'success'
      ? <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
      : <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />}
    <span>{message}</span>
    <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100 transition-opacity">
      <X className="w-3.5 h-3.5" />
    </button>
  </div>
);

function PasswordInput({
  id, value, onChange, placeholder
}: { id: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/30 transition-all pr-10"
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
        tabIndex={-1}
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export const MyProfile: React.FC = () => {
  const { user, updateUser } = useAuth();

  // Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // ── Email Change State ──────────────────────────────────────────────
  const [emailForm, setEmailForm] = useState({ newEmail: '', password: '' });
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailForm.newEmail.trim()) return showToast('error', 'New email is required.');
    if (emailForm.newEmail === user?.email) return showToast('error', 'New email is the same as your current email.');
    if (!emailForm.password) return showToast('error', 'Please confirm your current password.');
    setEmailLoading(true);
    try {
      const res = await api.put('/auth/me/email', {
        new_email: emailForm.newEmail,
        password: emailForm.password,
      });
      updateUser({ email: res.data.user.email });
      setEmailForm({ newEmail: '', password: '' });
      setEmailOpen(false);
      showToast('success', 'Email updated successfully!');
    } catch (err: any) {
      showToast('error', err?.response?.data?.detail || 'Failed to update email.');
    } finally {
      setEmailLoading(false);
    }
  };

  // ── Password Change State ───────────────────────────────────────────
  const [pwForm, setPwForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwForm.oldPassword) return showToast('error', 'Current password is required.');
    if (pwForm.newPassword.length < 6) return showToast('error', 'New password must be at least 6 characters.');
    if (pwForm.newPassword !== pwForm.confirmPassword) return showToast('error', 'New passwords do not match.');
    setPwLoading(true);
    try {
      await api.post('/auth/change-password', {
        old_password: pwForm.oldPassword,
        new_password: pwForm.newPassword,
      });
      setPwForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setPwOpen(false);
      showToast('success', 'Password changed successfully!');
    } catch (err: any) {
      showToast('error', err?.response?.data?.detail || 'Failed to change password.');
    } finally {
      setPwLoading(false);
    }
  };

  if (!user) return null;

  const memberSince = user.created_at
    ? new Date(user.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
    : 'N/A';

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center">
          <UserIcon className="w-5 h-5 text-orange-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-100">My Profile</h1>
          <p className="text-xs text-slate-400">View your profile and manage your login credentials</p>
        </div>
      </div>

      {/* ── Profile Card ───────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-sm overflow-hidden">
        {/* Avatar Banner */}
        <div className="h-20 bg-gradient-to-r from-orange-600/20 via-orange-500/10 to-slate-900/0" />
        <div className="px-6 pb-6 -mt-10 flex items-end gap-4">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center text-3xl font-black text-white border-4 border-slate-900 shadow-xl">
            {user.full_name.charAt(0).toUpperCase()}
          </div>
          <div className="mb-1 min-w-0">
            <h2 className="text-lg font-bold text-slate-100 truncate">{user.full_name}</h2>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/25">
                <ShieldCheck className="w-3 h-3" /> {user.role_name}
              </span>
              <span className="text-xs text-slate-500">@{user.username}</span>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="px-6 pb-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <InfoRow icon={<Mail className="w-4 h-4" />} label="Email Address" value={user.email} />
          <InfoRow icon={<AtSign className="w-4 h-4" />} label="Username" value={user.username} />
          <InfoRow icon={<ShieldCheck className="w-4 h-4" />} label="Role" value={user.role_name} />
          <InfoRow icon={<Phone className="w-4 h-4" />} label="Phone" value={user.phone || 'Not set'} />
          {(user as any).created_at && (
            <InfoRow icon={<Calendar className="w-4 h-4" />} label="Member Since" value={memberSince} />
          )}
        </div>
      </div>

      {/* ── Change Email Card ──────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-sm overflow-hidden">
        <button
          onClick={() => { setEmailOpen(o => !o); }}
          className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-800/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Mail className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-slate-200">Change Email Address</p>
              <p className="text-xs text-slate-500">Update your login email. Requires password confirmation.</p>
            </div>
          </div>
          <Pencil className={`w-4 h-4 transition-colors ${emailOpen ? 'text-orange-400' : 'text-slate-500'}`} />
        </button>

        {emailOpen && (
          <form onSubmit={handleEmailChange} className="px-6 pb-6 space-y-4 border-t border-slate-800/60 pt-4">
            <div className="space-y-1.5">
              <label htmlFor="new-email" className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                New Email Address
              </label>
              <input
                id="new-email"
                type="email"
                value={emailForm.newEmail}
                onChange={e => setEmailForm(f => ({ ...f, newEmail: e.target.value }))}
                placeholder="Enter new email address"
                className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/30 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="email-confirm-pw" className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Confirm with Current Password
              </label>
              <PasswordInput
                id="email-confirm-pw"
                value={emailForm.password}
                onChange={v => setEmailForm(f => ({ ...f, password: v }))}
                placeholder="Enter your current password"
              />
            </div>
            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={emailLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-orange-500/20"
              >
                <Save className="w-4 h-4" />
                {emailLoading ? 'Saving…' : 'Update Email'}
              </button>
              <button
                type="button"
                onClick={() => { setEmailOpen(false); setEmailForm({ newEmail: '', password: '' }); }}
                className="px-4 py-2 rounded-xl border border-slate-700 text-slate-400 hover:text-slate-200 text-sm font-medium transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ── Change Password Card ───────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-sm overflow-hidden">
        <button
          onClick={() => { setPwOpen(o => !o); }}
          className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-800/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <KeyRound className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-slate-200">Change Password</p>
              <p className="text-xs text-slate-500">Update your login password. Minimum 6 characters.</p>
            </div>
          </div>
          <Lock className={`w-4 h-4 transition-colors ${pwOpen ? 'text-orange-400' : 'text-slate-500'}`} />
        </button>

        {pwOpen && (
          <form onSubmit={handlePasswordChange} className="px-6 pb-6 space-y-4 border-t border-slate-800/60 pt-4">
            <div className="space-y-1.5">
              <label htmlFor="current-pw" className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Current Password
              </label>
              <PasswordInput
                id="current-pw"
                value={pwForm.oldPassword}
                onChange={v => setPwForm(f => ({ ...f, oldPassword: v }))}
                placeholder="Enter your current password"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="new-pw" className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                New Password
              </label>
              <PasswordInput
                id="new-pw"
                value={pwForm.newPassword}
                onChange={v => setPwForm(f => ({ ...f, newPassword: v }))}
                placeholder="Minimum 6 characters"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="confirm-pw" className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Confirm New Password
              </label>
              <PasswordInput
                id="confirm-pw"
                value={pwForm.confirmPassword}
                onChange={v => setPwForm(f => ({ ...f, confirmPassword: v }))}
                placeholder="Re-enter your new password"
              />
              {pwForm.confirmPassword && pwForm.newPassword !== pwForm.confirmPassword && (
                <p className="text-xs text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Passwords do not match
                </p>
              )}
              {pwForm.confirmPassword && pwForm.newPassword === pwForm.confirmPassword && pwForm.newPassword.length >= 6 && (
                <p className="text-xs text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Passwords match
                </p>
              )}
            </div>
            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={pwLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-purple-500/20"
              >
                <KeyRound className="w-4 h-4" />
                {pwLoading ? 'Saving…' : 'Change Password'}
              </button>
              <button
                type="button"
                onClick={() => { setPwOpen(false); setPwForm({ oldPassword: '', newPassword: '', confirmPassword: '' }); }}
                className="px-4 py-2 rounded-xl border border-slate-700 text-slate-400 hover:text-slate-200 text-sm font-medium transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Security notice */}
      <p className="text-center text-[11px] text-slate-600 pb-2">
        🔒 You can only edit your own credentials. Other accounts are not accessible from this page.
      </p>

      {/* Toast notification */}
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </div>
  );
};
