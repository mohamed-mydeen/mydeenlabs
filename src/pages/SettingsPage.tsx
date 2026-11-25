import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  User,
  Lock,
  LogOut,
  Activity,
  CheckCircle2,
  AlertCircle,
  Shield,
  Users,
  UserPlus,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useAnalytics } from '../hooks/useAnalytics';
import { useWorkspace, WorkspaceMode, WorkspaceRole } from '../context/WorkspaceContext';
import { useToast } from '../context/ToastContext';
import { HybridCard, HybridSelect, HYBRID_EASE, SelectOption } from '../components/MotionPrimitives';

const MODE_OPTIONS: SelectOption<WorkspaceMode>[] = [
  { value: 'private', label: 'Private Mode (Owner Only)' },
  { value: 'invite', label: 'Friends / Invite Mode' },
  { value: 'saas', label: 'SaaS Mode (Multi-Tenant)' },
];

const ROLE_OPTIONS: SelectOption<Exclude<WorkspaceRole, 'owner'>>[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'analyst', label: 'Analyst' },
  { value: 'viewer', label: 'Viewer' },
];

export const SettingsPage: React.FC = () => {
  const { user, signOut, updatePassword, isConfigured } = useAuth();
  const { data, error: analyticsError } = useAnalytics('today');
  const {
    activeWorkspace,
    members,
    invitations,
    schemaReady,
    updateWorkspaceMode,
    inviteMember,
    revokeInvitation,
    removeMember,
  } = useWorkspace();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const reduced = useReducedMotion();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<Exclude<WorkspaceRole, 'owner'>>('analyst');
  const [inviting, setInviting] = useState(false);

  const timeoutMinutes = Number(import.meta.env.VITE_INACTIVITY_TIMEOUT_MINUTES) || 10;

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
      showToast('Password updated', 'success');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const handleModeChange = async (nextMode: WorkspaceMode) => {
    const { error } = await updateWorkspaceMode(nextMode);
    if (error) {
      showToast(error, 'info');
    } else {
      showToast(`Workspace mode set to ${nextMode}`, 'success');
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    const { error } = await inviteMember(inviteEmail, inviteRole);
    setInviting(false);
    if (error) {
      showToast(error, 'error');
    } else {
      showToast(`Invitation created for ${inviteEmail}`, 'success');
      setInviteEmail('');
    }
  };

  const handleLogout = async () => {
    await signOut('manual');
    window.history.replaceState(null, '', '/login');
    navigate('/login', { replace: true });
  };

  const posthogConnected = Boolean(data?.connected && !analyticsError);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <span className="text-[11px] font-mono uppercase tracking-widest opacity-65">
          Administration &amp; Security
        </span>
        <h2 className="text-2xl sm:text-3xl font-bold font-display tracking-tight">
          Settings
        </h2>
      </div>

      {/* Account Information */}
      <HybridCard className="p-5 space-y-3">
        <div className="flex items-center gap-2">
          <User size={16} />
          <h3 className="text-base font-bold font-display">Account Information</h3>
        </div>
        <div className="text-xs font-mono space-y-2 hybrid-inset p-3.5 rounded-xl">
          <div className="flex justify-between gap-2">
            <span className="opacity-65">Admin Email:</span>
            <span className="font-semibold">{user?.email || 'Unknown'}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="opacity-65">User ID:</span>
            <span className="truncate max-w-[200px]">{user?.id || '—'}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="opacity-65">Workspace Role:</span>
            <span className="uppercase font-semibold">{activeWorkspace.role}</span>
          </div>
        </div>
      </HybridCard>

      {/* Session & Security Policy */}
      <HybridCard className="p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Shield size={16} />
          <h3 className="text-base font-bold font-display">Session &amp; Security Policy</h3>
        </div>
        <div className="space-y-2 text-xs font-mono">
          <div className="flex items-center justify-between p-3.5 rounded-xl hybrid-inset">
            <span>Session Scope</span>
            <span className="font-semibold">Tab-scoped (sessionStorage)</span>
          </div>
          <div className="flex items-center justify-between p-3.5 rounded-xl hybrid-inset">
            <span>Inactivity Auto-Logout</span>
            <span className="font-semibold">{timeoutMinutes} minutes (60s warning)</span>
          </div>
        </div>
      </HybridCard>

      {/* Workspace Access Mode & Members */}
      <HybridCard className="p-5 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Users size={16} />
            <h3 className="text-base font-bold font-display">Workspace &amp; Access Mode</h3>
          </div>
          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-lg bg-[#A5A79B]/25">
            {activeWorkspace.name}
          </span>
        </div>

        <div className="space-y-2">
          <label className="block text-[11px] font-mono uppercase opacity-75">
            Access Mode
          </label>
          <HybridSelect
            value={activeWorkspace.mode}
            options={MODE_OPTIONS}
            onChange={(m) => void handleModeChange(m)}
            ariaLabel="Workspace access mode"
          />
          {!schemaReady && (
            <p className="text-[11px] font-mono opacity-65">
              Operating in single-owner Private Mode. Run{' '}
              <code>supabase/migrations/001_enterprise_workspaces.sql</code> in Supabase to enable multi-user invites and SaaS workspaces.
            </p>
          )}
        </div>

        {schemaReady && activeWorkspace.mode !== 'private' && (
          <div className="space-y-3 pt-2 border-t border-[#A5A79B]/30 dark:border-white/10">
            <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="friend@company.com"
                className="hybrid-input px-3 py-2 min-h-[38px] flex-1 text-xs"
              />
              <HybridSelect
                value={inviteRole}
                options={ROLE_OPTIONS}
                onChange={setInviteRole}
                ariaLabel="Invite role"
                className="sm:w-32"
              />
              <button
                type="submit"
                disabled={inviting}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 min-h-[38px] rounded-xl bg-[#181818] text-[#E8D2B5] dark:bg-[#E8D2B5] dark:text-[#181818] text-xs font-semibold cursor-pointer disabled:opacity-50"
              >
                <UserPlus size={13} />
                <span>{inviting ? 'Inviting...' : 'Invite'}</span>
              </button>
            </form>

            {members.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono uppercase opacity-60">Members</span>
                {members.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-2.5 rounded-xl hybrid-inset text-xs font-mono"
                  >
                    <span className="truncate">{m.email}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="uppercase text-[10px] opacity-75">{m.role}</span>
                      {m.role !== 'owner' && (
                        <button
                          type="button"
                          onClick={() => void removeMember(m.id)}
                          className="p-1 text-red-600 dark:text-red-400 cursor-pointer"
                          aria-label={`Remove ${m.email}`}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {invitations.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono uppercase opacity-60">
                  Pending Invitations
                </span>
                {invitations.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between p-2.5 rounded-xl hybrid-inset text-xs font-mono"
                  >
                    <span className="truncate">
                      {inv.email} ({inv.role})
                    </span>
                    <button
                      type="button"
                      onClick={() => void revokeInvitation(inv.id)}
                      className="text-[11px] text-red-600 dark:text-red-400 hover:underline cursor-pointer"
                    >
                      Revoke
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </HybridCard>

      {/* Analytics Connection Status */}
      <HybridCard className="p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Activity size={16} />
          <h3 className="text-base font-bold font-display">Analytics Connection Status</h3>
        </div>
        <div className="space-y-2 text-xs font-mono">
          <div className="flex items-center justify-between p-3.5 rounded-xl hybrid-inset">
            <span>Supabase Auth &amp; Realtime</span>
            <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 size={14} />
              <span>{isConfigured ? 'Connected' : 'Not Configured'}</span>
            </span>
          </div>
          <div className="flex items-center justify-between p-3.5 rounded-xl hybrid-inset">
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
      </HybridCard>

      {/* Password Management */}
      <HybridCard className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Lock size={16} />
          <h3 className="text-base font-bold font-display">Password Management</h3>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-3">
          <AnimatePresence>
            {pwMsg && (
              <motion.p
                initial={reduced ? { opacity: 1 } : { opacity: 0, y: -3 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.16, ease: HYBRID_EASE }}
                className={`text-xs font-medium ${
                  pwMsg.type === 'ok'
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-red-700 dark:text-red-400'
                }`}
              >
                {pwMsg.text}
              </motion.p>
            )}
          </AnimatePresence>

          <div>
            <label className="block text-[11px] font-mono uppercase opacity-75 mb-1">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              className="hybrid-input px-3.5 py-2.5 min-h-[42px]"
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
              className="hybrid-input px-3.5 py-2.5 min-h-[42px]"
            />
          </div>

          <motion.button
            type="submit"
            disabled={saving}
            whileTap={reduced ? undefined : { scale: 0.98 }}
            className="px-4 py-2.5 min-h-[40px] rounded-xl bg-[#A5A79B] hover:bg-[#96988c] text-[#181818] text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
          >
            {saving ? 'Updating...' : 'Update Password'}
          </motion.button>
        </form>
      </HybridCard>

      {/* Logout */}
      <div className="pt-2">
        <motion.button
          whileTap={reduced ? undefined : { scale: 0.98 }}
          onClick={handleLogout}
          className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[42px] rounded-xl bg-[#181818] text-[#E8D2B5] dark:bg-[#E8D2B5] dark:text-[#181818] text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer shadow-sm"
        >
          <LogOut size={14} />
          <span>Logout of Mydeen Analytics</span>
        </motion.button>
      </div>
    </div>
  );
};
