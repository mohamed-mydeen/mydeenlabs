import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { HYBRID_EASE } from '../components/MotionPrimitives';

export const ResetPasswordPage: React.FC = () => {
  const { updatePassword } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const reduced = useReducedMotion();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    const { error: updateError } = await updatePassword(password);
    setSubmitting(false);

    if (updateError) {
      setError(updateError);
    } else {
      setDone(true);
      setTimeout(() => navigate('/', { replace: true }), 1500);
    }
  };

  return (
    <div className="min-h-screen bg-[#E8D2B5] dark:bg-[#141414] text-[#181818] dark:text-[#f2efe9] flex flex-col justify-center items-center px-4 py-10">
      <motion.div
        initial={reduced ? { opacity: 1 } : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: HYBRID_EASE }}
        className="w-full max-w-md hybrid-panel rounded-2xl shadow-2xl p-6 sm:p-7 space-y-4"
      >
        <div>
          <h1 className="text-2xl font-bold font-display">Set New Password</h1>
          <p className="text-xs opacity-75 mt-1">
            Choose a strong password for your Mydeen Analytics admin account.
          </p>
        </div>

        {done ? (
          <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs flex items-center gap-2.5">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>Password updated successfully! Redirecting to dashboard...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <p className="text-xs font-medium text-red-700 dark:text-red-400 flex items-center gap-1.5">
                <AlertCircle size={13} className="shrink-0" />
                <span>{error}</span>
              </p>
            )}

            <div>
              <label className="block text-[11px] font-mono font-semibold uppercase tracking-wider mb-1.5 opacity-80">
                New Password
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-55" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="hybrid-input pl-10 pr-4 py-2.5 min-h-[42px]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono font-semibold uppercase tracking-wider mb-1.5 opacity-80">
                Confirm Password
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-55" />
                <input
                  type="password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Re-enter password"
                  className="hybrid-input pl-10 pr-4 py-2.5 min-h-[42px]"
                />
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={submitting}
              whileTap={reduced ? undefined : { scale: 0.985 }}
              className="w-full py-2.5 px-4 min-h-[44px] rounded-xl bg-[#181818] text-[#E8D2B5] dark:bg-[#E8D2B5] dark:text-[#181818] hover:opacity-90 font-semibold text-sm transition-opacity cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Updating...' : 'Update Password'}
            </motion.button>
          </form>
        )}
      </motion.div>
    </div>
  );
};
