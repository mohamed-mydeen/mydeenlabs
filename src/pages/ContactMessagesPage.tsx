import React, { useState, useMemo } from 'react';
import {
  Mail,
  MailOpen,
  CheckCheck,
  Inbox,
  Search,
  RefreshCw,
  Archive,
  Trash2,
  ExternalLink,
  MessageCircle,
  X,
  Building2,
  Phone,
  Bell,
  Clock,
} from 'lucide-react';
import { useContactMessages } from '../hooks/useContactMessages';
import { StatCard } from '../components/StatCard';
import { ErrorStatePanel, LoadingPanel } from '../components/StateBanner';
import { ContactMessage, EnquiryCategory } from '../types/analytics';
import { formatNumber } from '../utils/formatters';

const CATEGORIES: ('All' | EnquiryCategory)[] = [
  'All',
  'Website Development',
  'Freelance Project',
  'Collaboration',
  'Job Opportunity',
  'General Enquiry',
  'Other',
];

type StatusFilter = 'all' | 'unread' | 'read' | 'replied' | 'archived';

function getStatusBadge(msg: ContactMessage) {
  if (msg.is_archived) {
    return (
      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/10 dark:bg-white/10 opacity-75">
        Archived
      </span>
    );
  }
  if (msg.is_replied) {
    return (
      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
        Replied
      </span>
    );
  }
  if (msg.is_read) {
    return (
      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#A5A79B]/25 text-[#181818] dark:text-[#E8D2B5]">
        Read
      </span>
    );
  }
  return (
    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#181818] text-[#E8D2B5] dark:bg-[#E8D2B5] dark:text-[#181818]">
      Unread
    </span>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function buildWhatsAppUrl(phone: string, fullName: string, subject: string): string {
  const digits = phone.replace(/[^0-9]/g, '');
  const text = encodeURIComponent(
    `Hi ${fullName}, thanks for reaching out regarding "${subject}".`
  );
  return `https://wa.me/${digits}?text=${text}`;
}

export const ContactMessagesPage: React.FC = () => {
  const {
    messages,
    stats,
    loading,
    error,
    newMessageAlert,
    dismissAlert,
    refresh,
    markAsRead,
    markAsUnread,
    markAsReplied,
    toggleArchive,
    deleteMessage,
  } = useContactMessages();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'All' | EnquiryCategory>('All');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortOrder, setSortOrder] = useState<'latest' | 'oldest'>('latest');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState(false);

  const selectedMessage = useMemo(
    () => messages.find((m) => m.id === selectedId) ?? null,
    [messages, selectedId]
  );

  const filteredMessages = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = messages.filter((m) => {
      if (statusFilter === 'archived') {
        if (!m.is_archived) return false;
      } else {
        if (m.is_archived) return false;
        if (statusFilter === 'unread' && m.is_read) return false;
        if (statusFilter === 'read' && !m.is_read) return false;
        if (statusFilter === 'replied' && !m.is_replied) return false;
      }

      if (categoryFilter !== 'All' && m.enquiry_category !== categoryFilter) {
        return false;
      }

      if (q) {
        const match =
          m.full_name.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q) ||
          m.subject.toLowerCase().includes(q) ||
          m.message.toLowerCase().includes(q) ||
          (m.company || '').toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });

    return [...list].sort((a, b) => {
      const ta = new Date(a.created_at).getTime();
      const tb = new Date(b.created_at).getTime();
      return sortOrder === 'latest' ? tb - ta : ta - tb;
    });
  }, [messages, search, categoryFilter, statusFilter, sortOrder]);

  const openMessage = async (msg: ContactMessage) => {
    setSelectedId(msg.id);
    setConfirmDeleteId(null);
    if (!msg.is_read) {
      await markAsRead(msg.id);
    }
  };

  const handleDelete = async (id: string) => {
    setBusyAction(true);
    const ok = await deleteMessage(id);
    setBusyAction(false);
    if (ok) {
      setSelectedId(null);
      setConfirmDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-widest opacity-65">
            Portfolio Inbox &bull; Supabase Realtime
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold font-display tracking-tight">
            Contact Messages
          </h2>
        </div>

        <button
          onClick={refresh}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#A5A79B]/20 dark:bg-[#1a1a1a] border border-[#A5A79B]/40 dark:border-white/10 text-xs font-mono font-semibold hover:bg-[#A5A79B]/35 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Live New Message Notification */}
      {newMessageAlert && (
        <div className="rounded-2xl bg-[#181818] text-[#E8D2B5] dark:bg-[#E8D2B5] dark:text-[#181818] p-4 flex items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3 min-w-0">
            <Bell size={18} className="shrink-0 animate-bounce" />
            <div className="min-w-0">
              <p className="text-xs font-mono font-bold uppercase tracking-wider">
                New Contact Message Received
              </p>
              <p className="text-sm font-medium truncate">
                {newMessageAlert.full_name} &mdash; {newMessageAlert.subject}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                openMessage(newMessageAlert);
                dismissAlert();
              }}
              className="px-3 py-1.5 rounded-lg bg-[#A5A79B] text-[#181818] text-xs font-bold cursor-pointer"
            >
              Open
            </button>
            <button
              onClick={dismissAlert}
              className="p-1.5 opacity-75 hover:opacity-100 cursor-pointer"
              aria-label="Dismiss notification"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <StatCard label="Total Messages" value={formatNumber(stats.total)} icon={Inbox} />
        <StatCard label="Unread" value={formatNumber(stats.unread)} icon={Mail} isLive={stats.unread > 0} />
        <StatCard label="Read" value={formatNumber(stats.read)} icon={MailOpen} />
        <StatCard label="Replied" value={formatNumber(stats.replied)} icon={CheckCheck} />
      </div>

      {/* Search & Filters */}
      <div className="rounded-2xl bg-[#A5A79B]/20 dark:bg-[#1a1a1a] border border-[#A5A79B]/40 dark:border-white/10 p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-55" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, subject, or message..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#fdfcf9] dark:bg-[#141414] border border-[#A5A79B]/45 dark:border-white/15 text-xs sm:text-sm focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as 'All' | EnquiryCategory)}
              className="px-3 py-2 rounded-xl bg-[#fdfcf9] dark:bg-[#141414] border border-[#A5A79B]/45 dark:border-white/15 text-xs font-mono focus:outline-none"
              aria-label="Filter by enquiry category"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c === 'All' ? 'All Categories' : c}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="px-3 py-2 rounded-xl bg-[#fdfcf9] dark:bg-[#141414] border border-[#A5A79B]/45 dark:border-white/15 text-xs font-mono focus:outline-none"
              aria-label="Filter by status"
            >
              <option value="all">Active Inbox</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
              <option value="replied">Replied</option>
              <option value="archived">Archived</option>
            </select>

            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'latest' | 'oldest')}
              className="px-3 py-2 rounded-xl bg-[#fdfcf9] dark:bg-[#141414] border border-[#A5A79B]/45 dark:border-white/15 text-xs font-mono focus:outline-none"
              aria-label="Sort messages"
            >
              <option value="latest">Latest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading / Error / Empty / List */}
      {loading && <LoadingPanel message="Loading contact messages..." />}
      {!loading && error && <ErrorStatePanel message={error} onRetry={refresh} />}

      {!loading && !error && filteredMessages.length === 0 && (
        <div className="rounded-2xl bg-[#A5A79B]/15 dark:bg-[#1a1a1a] border border-[#A5A79B]/35 dark:border-white/10 p-10 flex flex-col items-center justify-center text-center">
          <div className="w-11 h-11 rounded-2xl bg-[#A5A79B]/25 dark:bg-white/5 border border-[#A5A79B]/40 dark:border-white/10 flex items-center justify-center mb-3">
            <Inbox size={20} className="text-[#181818] dark:text-[#E8D2B5]" />
          </div>
          <p className="text-sm font-semibold">No contact messages yet.</p>
          <p className="text-xs opacity-65 mt-1 max-w-sm">
            Messages submitted via your portfolio contact form will appear here in real time.
          </p>
        </div>
      )}

      {!loading && !error && filteredMessages.length > 0 && (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block rounded-2xl bg-[#A5A79B]/20 dark:bg-[#1a1a1a] border border-[#A5A79B]/40 dark:border-white/10 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#A5A79B]/30 dark:border-white/10 text-[11px] font-mono uppercase opacity-70">
                  <th className="py-3.5 px-5">Sender</th>
                  <th className="py-3.5 px-5">Subject</th>
                  <th className="py-3.5 px-5">Category</th>
                  <th className="py-3.5 px-5">Date</th>
                  <th className="py-3.5 px-5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#A5A79B]/20 dark:divide-white/5 text-sm">
                {filteredMessages.map((msg) => (
                  <tr
                    key={msg.id}
                    onClick={() => openMessage(msg)}
                    className={`cursor-pointer transition-colors hover:bg-[#A5A79B]/15 dark:hover:bg-white/5 ${
                      !msg.is_read ? 'font-semibold bg-[#A5A79B]/10 dark:bg-white/[0.03]' : ''
                    }`}
                  >
                    <td className="py-3.5 px-5">
                      <div className="text-sm">{msg.full_name}</div>
                      <div className="text-[11px] font-mono opacity-65">{msg.email}</div>
                    </td>
                    <td className="py-3.5 px-5 max-w-xs truncate">{msg.subject}</td>
                    <td className="py-3.5 px-5">
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#A5A79B]/20 dark:bg-white/10">
                        {msg.enquiry_category}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-xs font-mono opacity-75 whitespace-nowrap">
                      {formatDate(msg.created_at)}
                    </td>
                    <td className="py-3.5 px-5 text-right">{getStatusBadge(msg)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List */}
          <div className="md:hidden space-y-3">
            {filteredMessages.map((msg) => (
              <button
                key={msg.id}
                onClick={() => openMessage(msg)}
                className={`w-full text-left rounded-2xl border p-4 space-y-2 transition-colors cursor-pointer ${
                  !msg.is_read
                    ? 'bg-[#A5A79B]/30 dark:bg-[#1f1f1f] border-[#A5A79B]/60 dark:border-[#E8D2B5]/30'
                    : 'bg-[#A5A79B]/15 dark:bg-[#1a1a1a] border-[#A5A79B]/35 dark:border-white/10'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate">{msg.full_name}</p>
                    <p className="text-[11px] font-mono opacity-65 truncate">{msg.email}</p>
                  </div>
                  {getStatusBadge(msg)}
                </div>
                <p className="text-xs font-semibold truncate">{msg.subject}</p>
                <div className="flex items-center justify-between gap-2 text-[10px] font-mono opacity-70 pt-1">
                  <span>{msg.enquiry_category}</span>
                  <span>{formatDate(msg.created_at)}</span>
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Message Detail Modal */}
      {selectedMessage && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedId(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#E8D2B5] dark:bg-[#1a1a1a] border border-[#A5A79B]/50 dark:border-white/15 shadow-2xl p-5 sm:p-6 space-y-5"
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-[#A5A79B]/30 dark:border-white/10">
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  {getStatusBadge(selectedMessage)}
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#A5A79B]/25 dark:bg-white/10">
                    {selectedMessage.enquiry_category}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold font-display pt-1">
                  {selectedMessage.subject}
                </h3>
              </div>
              <button
                onClick={() => setSelectedId(null)}
                className="p-2 rounded-xl hover:bg-[#A5A79B]/25 cursor-pointer shrink-0"
                aria-label="Close message details"
              >
                <X size={18} />
              </button>
            </div>

            {/* Sender Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[#fdfcf9]/75 dark:bg-[#141414] border border-[#A5A79B]/30 dark:border-white/10">
                <span className="text-[10px] font-mono uppercase opacity-60 block">Full Name</span>
                <span className="font-semibold text-sm">{selectedMessage.full_name}</span>
              </div>

              <div className="p-3 rounded-xl bg-[#fdfcf9]/75 dark:bg-[#141414] border border-[#A5A79B]/30 dark:border-white/10">
                <span className="text-[10px] font-mono uppercase opacity-60 block">Email Address</span>
                <span className="font-mono break-all">{selectedMessage.email}</span>
              </div>

              {selectedMessage.phone && (
                <div className="p-3 rounded-xl bg-[#fdfcf9]/75 dark:bg-[#141414] border border-[#A5A79B]/30 dark:border-white/10 flex items-center gap-2">
                  <Phone size={14} className="opacity-60 shrink-0" />
                  <div>
                    <span className="text-[10px] font-mono uppercase opacity-60 block">Phone / WhatsApp</span>
                    <span className="font-mono">{selectedMessage.phone}</span>
                  </div>
                </div>
              )}

              {selectedMessage.company && (
                <div className="p-3 rounded-xl bg-[#fdfcf9]/75 dark:bg-[#141414] border border-[#A5A79B]/30 dark:border-white/10 flex items-center gap-2">
                  <Building2 size={14} className="opacity-60 shrink-0" />
                  <div>
                    <span className="text-[10px] font-mono uppercase opacity-60 block">Company / Organization</span>
                    <span>{selectedMessage.company}</span>
                  </div>
                </div>
              )}

              <div className="p-3 rounded-xl bg-[#fdfcf9]/75 dark:bg-[#141414] border border-[#A5A79B]/30 dark:border-white/10 flex items-center gap-2 sm:col-span-2">
                <Clock size={14} className="opacity-60 shrink-0" />
                <div>
                  <span className="text-[10px] font-mono uppercase opacity-60 block">Submitted At</span>
                  <span className="font-mono">{formatDate(selectedMessage.created_at)}</span>
                </div>
              </div>
            </div>

            {/* Full Message Body */}
            <div className="p-4 rounded-xl bg-[#fdfcf9]/85 dark:bg-[#141414] border border-[#A5A79B]/35 dark:border-white/10">
              <span className="text-[10px] font-mono uppercase opacity-60 block mb-2">Message</span>
              <p className="text-sm leading-relaxed whitespace-pre-wrap select-text">
                {selectedMessage.message}
              </p>
            </div>

            {/* Actions Bar */}
            <div className="pt-2 border-t border-[#A5A79B]/30 dark:border-white/10 flex flex-wrap items-center gap-2">
              <a
                href={`mailto:${selectedMessage.email}?subject=${encodeURIComponent(
                  `Re: ${selectedMessage.subject}`
                )}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#181818] text-[#E8D2B5] dark:bg-[#E8D2B5] dark:text-[#181818] text-xs font-semibold hover:opacity-90"
              >
                <ExternalLink size={13} />
                <span>Reply via Email</span>
              </a>

              {selectedMessage.phone && selectedMessage.phone.replace(/[^0-9]/g, '').length >= 7 && (
                <a
                  href={buildWhatsAppUrl(
                    selectedMessage.phone,
                    selectedMessage.full_name,
                    selectedMessage.subject
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700"
                >
                  <MessageCircle size={13} />
                  <span>Open WhatsApp</span>
                </a>
              )}

              {selectedMessage.is_read ? (
                <button
                  onClick={() => markAsUnread(selectedMessage.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#A5A79B]/25 hover:bg-[#A5A79B]/40 text-xs font-semibold cursor-pointer"
                >
                  <Mail size={13} />
                  <span>Mark as Unread</span>
                </button>
              ) : (
                <button
                  onClick={() => markAsRead(selectedMessage.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#A5A79B]/25 hover:bg-[#A5A79B]/40 text-xs font-semibold cursor-pointer"
                >
                  <MailOpen size={13} />
                  <span>Mark as Read</span>
                </button>
              )}

              {!selectedMessage.is_replied && (
                <button
                  onClick={() => markAsReplied(selectedMessage.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#A5A79B] hover:bg-[#96988c] text-[#181818] text-xs font-semibold cursor-pointer"
                >
                  <CheckCheck size={13} />
                  <span>Mark as Replied</span>
                </button>
              )}

              <button
                onClick={() =>
                  toggleArchive(selectedMessage.id, !selectedMessage.is_archived)
                }
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#A5A79B]/25 hover:bg-[#A5A79B]/40 text-xs font-semibold cursor-pointer"
              >
                <Archive size={13} />
                <span>{selectedMessage.is_archived ? 'Unarchive' : 'Archive'}</span>
              </button>

              {confirmDeleteId === selectedMessage.id ? (
                <button
                  disabled={busyAction}
                  onClick={() => handleDelete(selectedMessage.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold cursor-pointer disabled:opacity-50 ml-auto"
                >
                  <Trash2 size={13} />
                  <span>{busyAction ? 'Deleting...' : 'Confirm Delete'}</span>
                </button>
              ) : (
                <button
                  onClick={() => setConfirmDeleteId(selectedMessage.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-700 dark:text-red-400 text-xs font-semibold cursor-pointer ml-auto"
                >
                  <Trash2 size={13} />
                  <span>Delete</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
