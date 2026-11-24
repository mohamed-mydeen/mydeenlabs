import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Lock, Mail, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { HYBRID_EASE } from '../components/MotionPrimitives';

export const LoginPage: React.FC = () => {
  const { user, loading: authLoading, isConfigured, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reduced = useReducedMotion();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#E8D2B5] dark:bg-[#141414]">
        <div className="w-9 h-9 rounded-full border-2 border-[#A5A79B] border-t-[#181818] dark:border-t-[#E8D2B5] animate-spin" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setSubmitting(true);
    const { error: signInError } = await signIn(email, password);
    setSubmitting(false);

    if (signInError) {
      setError(signInError);
    }
  };

  return (
    <div className="min-h-screen bg-[#E8D2B5] dark:bg-[#141414] text-[#181818] dark:text-[#f2efe9] flex flex-col justify-center items-center px-4 py-10">
      <motion.div
        initial={reduced ? { opacity: 1 } : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: HYBRID_EASE }}
        className="w-full max-w-md"
      >
        {/* Header Branding */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#181818] text-[#E8D2B5] dark:bg-[#E8D2B5] dark:text-[#181818] flex items-center justify-center font-display font-bold text-base border border-[#A5A79B]/50 shadow-md mb-3">
            /m
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight">
            Mydeen Analytics
          </h1>
          <p className="text-xs font-mono opacity-70 mt-1">
            Private Owner Workspace &bull; mydeen.vercel.app
          </p>
        </div>

        {/* Hybrid iOS Glass + Ubuntu Window Card */}
        <div className="hybrid-panel rounded-2xl shadow-2xl overflow-hidden">
          <div className="h-10 bg-[#dbc3a4]/70 dark:bg-[#222222]/85 border-b border-[#A5A79B]/35 dark:border-white/10 px-4 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
            </div>
            <span className="text-[11px] font-mono opacity-75">
              auth://admin-login
            </span>
          </div>

          <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-4">
            {!isConfigured && (
              <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-xs text-[#181818] dark:text-[#E8D2B5] flex items-start gap-2">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <span>
                  Supabase environment variables are not configured yet. Set{' '}
                  <code className="font-mono">VITE_SUPABASE_URL</code> and{' '}
                  <code className="font-mono">VITE_SUPABASE_ANON_KEY</code>.
                </span>
              </div>
            )}

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={reduced ? { opacity: 1 } : { opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-xs text-red-900 dark:text-red-300 flex items-start gap-2"
                >
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="block text-[11px] font-mono font-semibold uppercase tracking-wider mb-1.5 opacity-80">
                Admin Email
              </label>
              <div className="relative">
                <Mail
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-55"
                />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@mydeen.dev"
                  className="hybrid-input pl-10 pr-4 py-2.5 min-h-[42px]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-mono font-semibold uppercase tracking-wider opacity-80">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-[11px] font-mono hover:underline opacity-75"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-55"
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="hybrid-input pl-10 pr-10 py-2.5 min-h-[42px]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 opacity-55 hover:opacity-100 cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={submitting}
              whileTap={reduced ? undefined : { scale: 0.985 }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 min-h-[44px] rounded-xl bg-[#181818] text-[#E8D2B5] dark:bg-[#E8D2B5] dark:text-[#181818] hover:opacity-90 font-semibold text-sm transition-opacity shadow-sm cursor-pointer disabled:opacity-50"
            >
              <span>{submitting ? 'Signing in...' : 'Sign In to Dashboard'}</span>
              {!submitting && <ArrowRight size={15} />}
            </motion.button>

            <p className="text-[11px] font-mono text-center opacity-60 pt-1">
              Private access only. Public registration is disabled.
            </p>
          </form>
        </div>
      </motion.div>
    </div>
  );
};
