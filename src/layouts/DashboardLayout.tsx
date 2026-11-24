import React, { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  LayoutDashboard,
  Radio,
  FileText,
  Share2,
  Smartphone,
  Settings,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  ExternalLink,
  Mail,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useContactMessages } from '../hooks/useContactMessages';
import { HYBRID_EASE } from '../components/MotionPrimitives';

const NAV_ITEMS = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/live', label: 'Live Visitors', icon: Radio, end: false },
  { to: '/messages', label: 'Contact Messages', icon: Mail, end: false },
  { to: '/pages', label: 'Pages', icon: FileText, end: false },
  { to: '/sources', label: 'Sources', icon: Share2, end: false },
  { to: '/devices', label: 'Devices', icon: Smartphone, end: false },
  { to: '/settings', label: 'Settings', icon: Settings, end: false },
];

export const DashboardLayout: React.FC = () => {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { stats: messageStats } = useContactMessages();
  const navigate = useNavigate();
  const location = useLocation();
  const reduced = useReducedMotion();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#E8D2B5] dark:bg-[#141414] text-[#181818] dark:text-[#f2efe9] flex flex-col lg:flex-row">
      {/* ─── DESKTOP UBUNTU-INSPIRED WORKSPACE SIDEBAR ─────────────────────── */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-[#E8D2B5]/90 dark:bg-[#161616]/95 backdrop-blur-xl border-r border-[#A5A79B]/40 dark:border-white/10 p-4 justify-between z-30">
        <div className="space-y-6">
          {/* Brand Header */}
          <div className="flex items-center justify-between px-1 pt-1">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#181818] text-[#E8D2B5] dark:bg-[#E8D2B5] dark:text-[#181818] flex items-center justify-center font-display font-bold text-sm border border-[#A5A79B]/40 shadow-sm">
                /m
              </div>
              <div>
                <h1 className="text-sm font-bold font-display leading-none tracking-tight">
                  Mydeen Analytics
                </h1>
                <p className="text-[10px] font-mono opacity-65 mt-1">
                  mydeen.vercel.app
                </p>
              </div>
            </div>
          </div>

          {/* Workspace Navigation */}
          <nav className="space-y-1" aria-label="Workspace navigation">
            <div className="px-3 pb-1.5 text-[10px] font-mono uppercase tracking-widest opacity-50">
              Workspace
            </div>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className="block relative"
                >
                  {({ isActive }) => (
                    <div
                      className={`relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 ${
                        isActive
                          ? 'text-[#181818] font-semibold'
                          : 'text-[#181818]/75 dark:text-[#f2efe9]/75 hover:bg-[#A5A79B]/18 dark:hover:bg-white/5 hover:text-[#181818] dark:hover:text-[#f2efe9]'
                      }`}
                    >
                      {isActive && (
                        <motion.span
                          layoutId="desktopSidebarActivePill"
                          transition={{ duration: 0.22, ease: HYBRID_EASE }}
                          className="absolute inset-0 rounded-xl bg-[#A5A79B] shadow-sm -z-0"
                        />
                      )}
                      <Icon size={17} className="relative z-10 shrink-0" />
                      <span className="relative z-10 flex-1 truncate">
                        {item.label}
                      </span>
                      {item.to === '/messages' && messageStats.unread > 0 && (
                        <motion.span
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className={`relative z-10 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
                            isActive
                              ? 'bg-[#181818] text-[#E8D2B5]'
                              : 'bg-[#181818] text-[#E8D2B5] dark:bg-[#E8D2B5] dark:text-[#181818]'
                          }`}
                        >
                          {messageStats.unread}
                        </motion.span>
                      )}
                    </div>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="space-y-2.5 pt-4 border-t border-[#A5A79B]/35 dark:border-white/10">
          <a
            href="https://mydeen.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-3.5 py-2.5 rounded-xl hybrid-inset text-xs font-mono hover:border-[#181818]/30 dark:hover:border-[#E8D2B5]/30 transition-colors"
          >
            <span>Open Portfolio</span>
            <ExternalLink size={13} className="opacity-70" />
          </a>

          <div className="flex items-center justify-between gap-2 px-1 py-0.5">
            <span className="text-[11px] font-mono opacity-70 truncate">
              {user?.email}
            </span>
            <motion.button
              whileTap={reduced ? undefined : { scale: 0.92 }}
              onClick={toggleTheme}
              className="p-2 rounded-xl hybrid-inset hover:bg-[#A5A79B]/25 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0"
              title="Toggle theme"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            </motion.button>
          </div>

          <motion.button
            whileTap={reduced ? undefined : { scale: 0.98 }}
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#181818] text-[#E8D2B5] dark:bg-[#E8D2B5] dark:text-[#181818] text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer shadow-sm"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </motion.button>
        </div>
      </aside>

      {/* ─── MOBILE iOS-INSPIRED TOP GLASS HEADER ─────────────────────────── */}
      <header className="lg:hidden sticky top-0 z-40 bg-[#E8D2B5]/85 dark:bg-[#141414]/85 backdrop-blur-xl border-b border-[#A5A79B]/40 dark:border-white/10 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#181818] text-[#E8D2B5] dark:bg-[#E8D2B5] dark:text-[#181818] flex items-center justify-center font-display font-bold text-xs shadow-sm">
            /m
          </div>
          <div>
            <span className="text-sm font-bold font-display block leading-none">
              Mydeen Analytics
            </span>
            <span className="text-[10px] font-mono opacity-65">
              mydeen.vercel.app
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <motion.button
            whileTap={reduced ? undefined : { scale: 0.92 }}
            onClick={toggleTheme}
            className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl hybrid-inset"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </motion.button>
          <motion.button
            whileTap={reduced ? undefined : { scale: 0.92 }}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl hybrid-inset"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </motion.button>
        </div>
      </header>

      {/* ─── MOBILE ANIMATED DRAWER MENU ──────────────────────────────────── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden fixed inset-0 top-[57px] z-30 bg-black/35 backdrop-blur-xs"
            />
            <motion.div
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, y: -12 }}
              transition={{ duration: 0.2, ease: HYBRID_EASE }}
              className="lg:hidden fixed inset-x-0 top-[57px] z-40 bg-[#E8D2B5]/95 dark:bg-[#181818]/95 backdrop-blur-xl border-b border-[#A5A79B]/45 dark:border-white/10 p-4 shadow-2xl space-y-1.5"
            >
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium min-h-[44px] transition-colors ${
                        isActive
                          ? 'bg-[#A5A79B] text-[#181818] font-semibold'
                          : 'text-[#181818]/80 dark:text-[#f2efe9]/80 hover:bg-[#A5A79B]/20 dark:hover:bg-white/5'
                      }`
                    }
                  >
                    <Icon size={17} />
                    <span className="flex-1">{item.label}</span>
                    {item.to === '/messages' && messageStats.unread > 0 && (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#181818] text-[#E8D2B5] dark:bg-[#E8D2B5] dark:text-[#181818]">
                        {messageStats.unread}
                      </span>
                    )}
                  </NavLink>
                );
              })}

              <div className="pt-3 mt-2 border-t border-[#A5A79B]/30 dark:border-white/10 flex items-center justify-between gap-2">
                <span className="text-xs font-mono opacity-70 truncate">
                  {user?.email}
                </span>
                <motion.button
                  whileTap={reduced ? undefined : { scale: 0.96 }}
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#181818] text-[#E8D2B5] dark:bg-[#E8D2B5] dark:text-[#181818] text-xs font-semibold min-h-[40px]"
                >
                  <LogOut size={13} />
                  <span>Logout</span>
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ─── MAIN WORKSPACE CONTENT AREA ──────────────────────────────────── */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 pb-28 lg:pb-10 max-w-6xl w-full mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={reduced ? { opacity: 1 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: HYBRID_EASE }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* ─── MOBILE FLOATING iOS-STYLE BOTTOM DOCK ────────────────────────── */}
      <nav
        aria-label="Mobile quick navigation"
        className="lg:hidden fixed bottom-3 inset-x-3 z-30 rounded-2xl bg-[#fdfcf9]/85 dark:bg-[#1a1a1a]/88 backdrop-blur-xl border border-[#A5A79B]/45 dark:border-white/15 shadow-[0_12px_32px_rgba(24,24,24,0.16)] dark:shadow-[0_12px_32px_rgba(0,0,0,0.55)] px-1.5 py-1.5 flex items-center justify-around"
      >
        {NAV_ITEMS.slice(0, 5).map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className="relative flex-1"
            >
              {({ isActive }) => (
                <div
                  className={`relative flex flex-col items-center justify-center gap-0.5 py-1.5 px-1 rounded-xl text-[10px] font-mono min-h-[44px] transition-colors ${
                    isActive
                      ? 'text-[#181818] font-bold'
                      : 'text-[#181818]/65 dark:text-[#f2efe9]/65'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="mobileDockActivePill"
                      transition={{ duration: 0.22, ease: HYBRID_EASE }}
                      className="absolute inset-0 rounded-xl bg-[#A5A79B] -z-0"
                    />
                  )}
                  <div className="relative z-10">
                    <Icon size={17} />
                    {item.to === '/messages' && messageStats.unread > 0 && (
                      <span className="absolute -top-1 -right-2 w-2 h-2 rounded-full bg-emerald-500" />
                    )}
                  </div>
                  <span className="relative z-10 truncate max-w-full">
                    {item.label.split(' ')[0]}
                  </span>
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};
