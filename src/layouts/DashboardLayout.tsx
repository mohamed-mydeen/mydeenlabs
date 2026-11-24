import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#E8D2B5] dark:bg-[#141414] text-[#181818] dark:text-[#f2efe9] flex flex-col lg:flex-row">
      {/* ─── DESKTOP SIDEBAR ──────────────────────────────────────────────── */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-[#E8D2B5] dark:bg-[#161616] border-r border-[#A5A79B]/40 dark:border-white/10 p-5 justify-between z-30">
        <div className="space-y-6">
          {/* Brand */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-[#181818] text-[#E8D2B5] dark:bg-[#E8D2B5] dark:text-[#181818] flex items-center justify-center font-display font-bold text-sm border border-[#A5A79B]/40">
                /m
              </div>
              <div>
                <h1 className="text-base font-bold font-display leading-none">
                  Mydeen Analytics
                </h1>
                <p className="text-[10px] font-mono opacity-65 mt-1">
                  mydeen.vercel.app
                </p>
              </div>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-[#A5A79B] text-[#181818] font-semibold shadow-xs'
                        : 'text-[#181818]/80 dark:text-[#f2efe9]/80 hover:bg-[#A5A79B]/20 dark:hover:bg-white/5'
                    }`
                  }
                >
                  <Icon size={17} />
                  <span className="flex-1">{item.label}</span>
                  {item.to === '/messages' && messageStats.unread > 0 && (
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-[#181818] text-[#E8D2B5] dark:bg-[#E8D2B5] dark:text-[#181818]">
                      {messageStats.unread}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="space-y-3 pt-4 border-t border-[#A5A79B]/30 dark:border-white/10">
          <a
            href="https://mydeen.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#A5A79B]/20 dark:bg-white/5 border border-[#A5A79B]/35 dark:border-white/10 text-xs font-mono hover:bg-[#A5A79B]/30 transition-colors"
          >
            <span>Open Portfolio</span>
            <ExternalLink size={13} />
          </a>

          <div className="flex items-center justify-between gap-2 px-1">
            <span className="text-[11px] font-mono opacity-70 truncate">
              {user?.email}
            </span>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-[#A5A79B]/20 dark:bg-white/5 border border-[#A5A79B]/35 dark:border-white/10 hover:bg-[#A5A79B]/35 transition-colors cursor-pointer"
              title="Toggle theme"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            </button>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#181818] text-[#E8D2B5] dark:bg-[#E8D2B5] dark:text-[#181818] text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ─── MOBILE TOP HEADER ────────────────────────────────────────────── */}
      <header className="lg:hidden sticky top-0 z-40 bg-[#E8D2B5]/95 dark:bg-[#141414]/95 backdrop-blur-md border-b border-[#A5A79B]/40 dark:border-white/10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#181818] text-[#E8D2B5] dark:bg-[#E8D2B5] dark:text-[#181818] flex items-center justify-center font-display font-bold text-xs">
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
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-[#A5A79B]/20 dark:bg-white/5 border border-[#A5A79B]/35 dark:border-white/10"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="p-2 rounded-xl bg-[#A5A79B]/25 dark:bg-white/5 border border-[#A5A79B]/40 dark:border-white/10"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </header>

      {/* ─── MOBILE DRAWER MENU ───────────────────────────────────────────── */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-[57px] z-30 bg-[#E8D2B5] dark:bg-[#181818] border-b border-[#A5A79B]/40 dark:border-white/10 p-4 shadow-xl space-y-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${
                    isActive
                      ? 'bg-[#A5A79B] text-[#181818] font-semibold'
                      : 'text-[#181818]/80 dark:text-[#f2efe9]/80 hover:bg-[#A5A79B]/20'
                  }`
                }
              >
                <Icon size={17} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
          <div className="pt-2 border-t border-[#A5A79B]/30 dark:border-white/10 flex items-center justify-between gap-2">
            <span className="text-xs font-mono opacity-70 truncate">
              {user?.email}
            </span>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#181818] text-[#E8D2B5] dark:bg-[#E8D2B5] dark:text-[#181818] text-xs font-semibold"
            >
              <LogOut size={13} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}

      {/* ─── MAIN CONTENT AREA ────────────────────────────────────────────── */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-10 max-w-6xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* ─── MOBILE BOTTOM QUICK NAV BAR ──────────────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-[#E8D2B5]/95 dark:bg-[#161616]/95 backdrop-blur-md border-t border-[#A5A79B]/40 dark:border-white/10 px-2 py-1.5 flex items-center justify-around">
        {NAV_ITEMS.slice(0, 5).map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-xl text-[10px] font-mono transition-colors ${
                  isActive
                    ? 'bg-[#A5A79B] text-[#181818] font-bold'
                    : 'text-[#181818]/70 dark:text-[#f2efe9]/70'
                }`
              }
            >
              <Icon size={16} />
              <span>{item.label.split(' ')[0]}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};
