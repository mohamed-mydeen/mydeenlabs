import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#E8D2B5] dark:bg-[#141414] text-[#181818] dark:text-[#f2efe9] px-4">
        <div className="w-10 h-10 rounded-full border-2 border-[#A5A79B] border-t-[#181818] dark:border-t-[#E8D2B5] animate-spin mb-3" />
        <p className="text-xs font-mono uppercase tracking-widest opacity-70">
          Verifying Session...
        </p>
      </div>
    );
  }

  if (!user || !session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
