import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ContactMessage } from '../types/analytics';
import {
  RealtimeConnectionStatus,
  supabase,
  subscribeToTableChanges,
} from '../services/supabaseClient';
import { useWorkspace } from '../context/WorkspaceContext';
import { QUERY_KEYS } from '../services/queryClient';

async function fetchContactMessages(): Promise<ContactMessage[]> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase
    .from('contact_messages')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as ContactMessage[];
}

export function useContactMessages() {
  const { activeWorkspace } = useWorkspace();
  const qc = useQueryClient();
  const [newMessageAlert, setNewMessageAlert] = useState<ContactMessage | null>(null);
  const [realtimeStatus, setRealtimeStatus] =
    useState<RealtimeConnectionStatus>('connecting');

  const queryKey = QUERY_KEYS.contactMessages(activeWorkspace.id);

  const query = useQuery<ContactMessage[], Error>({
    queryKey,
    queryFn: fetchContactMessages,
    staleTime: 30_000,
    refetchInterval: realtimeStatus === 'polling' ? 20_000 : false,
  });

  useEffect(() => {
    const unsubscribe = subscribeToTableChanges<ContactMessage>(
      'contact-messages-realtime',
      'contact_messages',
      (payload) => {
        if (payload.eventType === 'INSERT') {
          const inserted = payload.new;
          qc.setQueryData<ContactMessage[]>(queryKey, (prev = []) => {
            if (prev.some((m) => m.id === inserted.id)) return prev;
            return [inserted, ...prev];
          });
          setNewMessageAlert(inserted);
        } else if (payload.eventType === 'UPDATE') {
          const updated = payload.new;
          qc.setQueryData<ContactMessage[]>(queryKey, (prev = []) =>
            prev.map((m) => (m.id === updated.id ? updated : m))
          );
        } else if (payload.eventType === 'DELETE') {
          const deletedId = payload.old?.id;
          if (deletedId) {
            qc.setQueryData<ContactMessage[]>(queryKey, (prev = []) =>
              prev.filter((m) => m.id !== deletedId)
            );
          }
        }
      },
      setRealtimeStatus
    );

    return unsubscribe;
  }, [qc, activeWorkspace.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateFields = useCallback(
    async (
      id: string,
      fields: Partial<Pick<ContactMessage, 'is_read' | 'is_replied' | 'is_archived'>>
    ) => {
      if (!supabase) return false;
      const { error } = await supabase
        .from('contact_messages')
        .update(fields)
        .eq('id', id);
      if (error) return false;

      qc.setQueryData<ContactMessage[]>(queryKey, (prev = []) =>
        prev.map((m) => (m.id === id ? { ...m, ...fields } : m))
      );
      return true;
    },
    [qc, queryKey]
  );

  const deleteMessage = useCallback(
    async (id: string) => {
      if (!supabase) return false;
      const { error } = await supabase
        .from('contact_messages')
        .delete()
        .eq('id', id);
      if (error) return false;

      qc.setQueryData<ContactMessage[]>(queryKey, (prev = []) =>
        prev.filter((m) => m.id !== id)
      );
      return true;
    },
    [qc, queryKey]
  );

  const messages = query.data ?? [];

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
    loading: query.isLoading,
    isFetching: query.isFetching,
    realtimeStatus,
    error: query.error ? query.error.message : null,
    newMessageAlert,
    dismissAlert: () => setNewMessageAlert(null),
    refresh: () => void query.refetch(),
    markAsRead: (id: string) => updateFields(id, { is_read: true }),
    markAsUnread: (id: string) => updateFields(id, { is_read: false }),
    markAsReplied: (id: string) => updateFields(id, { is_replied: true, is_read: true }),
    toggleArchive: (id: string, nextArchived: boolean) =>
      updateFields(id, { is_archived: nextArchived }),
    deleteMessage,
  };
}
