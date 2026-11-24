import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Lock,
  LogOut,
  Activity,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useAnalytics } from '../hooks/useAnalytics';

export const SettingsPage: React.FC = () => {
  const { user, signOut, updatePassword, isConfigured } = useAuth();
  const { data, error: analyticsError } = useAnalytics('today');
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);
    if (newPassword.length < 8) {
      setPwMsg({ type: 'err', text: 'Password must be at least 8 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwMsg({ type: 'err', text: 'Passwords do not match.' });
      return;
    }

    setSaving(true);
    const { error } = await updatePassword(newPassword);
    setSaving(false);

    if (error) {
      setPwMsg({ type: 'err', text: error });
    } else {
      setPwMsg({ type: 'ok', text: 'Password updated successfully.' });
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const posthogConnected = Boolean(data?.connected && !analyticsError);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <span className="text-[11px] font-mono uppercase tracking-widest opacity-65">
          Administration
        </span>
        <h2 className="text-2xl sm:text-3xl font-bold font-display tracking-tight">
          Settings
        </h2>
      </div>

      {/* Account Information */}
      <div className="rounded-2xl bg-[#A5A79B]/20 dark:bg-[#1a1a1a] border border-[#A5A79B]/40 dark:border-white/10 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <User size={16} />
          <h3 className="text-base font-bold font-display">Account Information</h3>
        </div>
        <div className="text-xs font-mono space-y-1.5 bg-[#fdfcf9]/70 dark:bg-[#141414] p-3.5 rounded-xl border border-[#A5A79B]/30 dark:border-white/10">
          <div className="flex justify-between gap-2">
            <span className="opacity-65">Admin Email:</span>
            <span className="font-semibold">{user?.email || 'Unknown'}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="opacity-65">User ID:</span>
            <span className="truncate max-w-[200px]">{user?.id || '—'}</span>
          </div>
        </div>
      </div>

      {/* Analytics Connection Status */}
      <div className="rounded-2xl bg-[#A5A79B]/20 dark:bg-[#1a1a1a] border border-[#A5A79B]/40 dark:border-white/10 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Activity size={16} />
          <h3 className="text-base font-bold font-display">Analytics Connection Status</h3>
        </div>
        <div className="space-y-2 text-xs font-mono">
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#fdfcf9]/70 dark:bg-[#141414] border border-[#A5A79B]/30 dark:border-white/10">
            <span>Supabase Auth &amp; Realtime</span>
            <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 size={14} />
              <span>{isConfigured ? 'Connected' : 'Not Configured'}</span>
            </span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#fdfcf9]/70 dark:bg-[#141414] border border-[#A5A79B]/30 dark:border-white/10">
            <span>PostHog Analytics API</span>
            {posthogConnected ? (
              <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 size={14} />
                <span>Connected</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 font-semibold text-amber-700 dark:text-amber-400">
                <AlertCircle size={14} />
                <span>Awaiting API Credentials</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Password Management */}
      <div className="rounded-2xl bg-[#A5A79B]/20 dark:bg-[#1a1a1a] border border-[#A5A79B]/40 dark:border-white/10 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Lock size={16} />
          <h3 className="text-base font-bold font-display">Password Management</h3>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-3">
          {pwMsg && (
            <div
              className={`p-3 rounded-xl text-xs border ${
                pwMsg.type === 'ok'
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-900 dark:text-emerald-300'
                  : 'bg-red-500/15 border-red-500/30 text-red-900 dark:text-red-300'
              }`}
            >
              {pwMsg.text}
            </div>
          )}

          <div>
            <label className="block text-[11px] font-mono uppercase opacity-75 mb-1">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#fdfcf9] dark:bg-[#141414] border border-[#A5A79B]/50 dark:border-white/15 text-sm focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase opacity-75 mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#fdfcf9] dark:bg-[#141414] border border-[#A5A79B]/50 dark:border-white/15 text-sm focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2.5 rounded-xl bg-[#A5A79B] hover:bg-[#96988c] text-[#181818] text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
          >
            {saving ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* Logout */}
      <div className="pt-2">
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#181818] text-[#E8D2B5] dark:bg-[#E8D2B5] dark:text-[#181818] text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer"
        >
          <LogOut size={14} />
          <span>Logout of Mydeen Analytics</span>
        </button>
      </div>
    </div>
  );
};
