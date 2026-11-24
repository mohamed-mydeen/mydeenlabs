import { useState, useEffect, useCallback, useMemo } from 'react';
import { ContactMessage } from '../types/analytics';
import { supabase, subscribeToTableChanges } from '../services/supabaseClient';

export function useContactMessages() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [newMessageAlert, setNewMessageAlert] = useState<ContactMessage | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!supabase) {
      setError('Supabase is not configured.');
      setLoading(false);
      return;
    }

    try {
      const { data, error: queryError } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (queryError) throw queryError;
      setMessages((data ?? []) as ContactMessage[]);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load contact messages. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMessages();

    const unsubscribe = subscribeToTableChanges<ContactMessage>(
      'contact-messages-realtime',
      'contact_messages',
      (payload) => {
        if (payload.eventType === 'INSERT') {
          const inserted = payload.new;
          setMessages((prev) => {
            if (prev.some((m) => m.id === inserted.id)) return prev;
            return [inserted, ...prev];
          });
          setNewMessageAlert(inserted);
        } else if (payload.eventType === 'UPDATE') {
          const updated = payload.new;
          setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
        } else if (payload.eventType === 'DELETE') {
          const deletedId = payload.old?.id;
          if (deletedId) {
            setMessages((prev) => prev.filter((m) => m.id !== deletedId));
          }
        }
      }
    );

    return unsubscribe;
  }, [fetchMessages]);

  const updateFields = useCallback(
    async (id: string, fields: Partial<Pick<ContactMessage, 'is_read' | 'is_replied' | 'is_archived'>>) => {
      if (!supabase) return false;
      const { error: updateError } = await supabase
        .from('contact_messages')
        .update(fields)
        .eq('id', id);
      if (updateError) return false;

      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...fields } : m)));
      return true;
    },
    []
  );

  const deleteMessage = useCallback(async (id: string) => {
    if (!supabase) return false;
    const { error: deleteError } = await supabase
      .from('contact_messages')
      .delete()
      .eq('id', id);
    if (deleteError) return false;

    setMessages((prev) => prev.filter((m) => m.id !== id));
    return true;
  }, []);

  const stats = useMemo(() => {
    const active = messages.filter((m) => !m.is_archived);
    return {
      total: active.length,
      unread: active.filter((m) => !m.is_read).length,
      read: active.filter((m) => m.is_read).length,
      replied: active.filter((m) => m.is_replied).length,
    };
  }, [messages]);

  return {
    messages,
    stats,
    loading,
    error,
    newMessageAlert,
    dismissAlert: () => setNewMessageAlert(null),
    refresh: fetchMessages,
    markAsRead: (id: string) => updateFields(id, { is_read: true }),
    markAsUnread: (id: string) => updateFields(id, { is_read: false }),
    markAsReplied: (id: string) => updateFields(id, { is_replied: true, is_read: true }),
    toggleArchive: (id: string, nextArchived: boolean) => updateFields(id, { is_archived: nextArchived }),
    deleteMessage,
  };
}
