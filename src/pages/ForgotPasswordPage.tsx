import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

export const ForgotPasswordPage: React.FC = () => {
  const { sendPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { error: resetError } = await sendPasswordReset(email);
    setSubmitting(false);

    if (resetError) {
      setError(resetError);
    } else {
      setSent(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#E8D2B5] dark:bg-[#141414] text-[#181818] dark:text-[#f2efe9] flex flex-col justify-center items-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-[#A5A79B]/25 dark:bg-[#1a1a1a] border border-[#A5A79B]/45 dark:border-white/10 shadow-2xl p-6 sm:p-7 space-y-4">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-xs font-mono opacity-75 hover:opacity-100"
        >
          <ArrowLeft size={13} />
          <span>Back to Login</span>
        </Link>

        <div>
          <h1 className="text-2xl font-bold font-display">Reset Password</h1>
          <p className="text-xs opacity-75 mt-1">
            Enter your admin email to receive a password reset link.
          </p>
        </div>

        {sent ? (
          <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs flex items-start gap-2.5">
            <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <span>
              Password reset link sent to <strong>{email}</strong>. Check your inbox and follow the link.
            </span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-xs text-red-900 dark:text-red-300 flex items-start gap-2">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-mono font-semibold uppercase tracking-wider mb-1.5 opacity-80">
                Admin Email
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-55" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@mydeen.dev"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#fdfcf9] dark:bg-[#141414] border border-[#A5A79B]/50 dark:border-white/15 text-sm focus:outline-none focus:border-[#181818]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 rounded-xl bg-[#A5A79B] hover:bg-[#96988c] text-[#181818] font-semibold text-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Sending link...' : 'Send Reset Link'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
