import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface TableChangePayload<T = Record<string, unknown>> {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: T;
  old: Partial<T>;
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes('your-project-id') &&
    !supabaseAnonKey.includes('your-supabase-anon-key')
);

/**
 * Tab-scoped storage adapter using window.sessionStorage.
 * - Refreshing the same tab preserves the valid Supabase session.
 * - Closing the tab / standalone PWA window or opening a new tab requires fresh login.
 * - Avoids persistent localStorage token storage across browser sessions.
 */
const tabSessionStorage = {
  getItem: (key: string): string | null => {
    try {
      return typeof window !== 'undefined' ? window.sessionStorage.getItem(key) : null;
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(key, value);
      }
    } catch {
      // Ignore storage quota errors in restricted contexts
    }
  },
  removeItem: (key: string): void => {
    try {
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem(key);
      }
    } catch {
      // Ignore
    }
  },
};

/**
 * Clear all Supabase auth keys from sessionStorage & legacy localStorage,
 * plus any non-static runtime caches on manual or automatic logout.
 */
export async function clearSensitiveSessionData(): Promise<void> {
  try {
    if (typeof window !== 'undefined') {
      const clearStore = (store: Storage) => {
        const keysToRemove: string[] = [];
        for (let i = 0; i < store.length; i++) {
          const k = store.key(i);
          if (k && (k.startsWith('sb-') || k.includes('supabase') || k.includes('mydeen-analytics'))) {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach((k) => store.removeItem(k));
      };
      clearStore(window.sessionStorage);
      clearStore(window.localStorage);
    }

    if (typeof caches !== 'undefined') {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((name) => !name.startsWith('workbox-precache'))
          .map((name) => caches.delete(name))
      );
    }
  } catch {
    // Best-effort cleanup
  }
}

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        storage: tabSessionStorage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export type RealtimeConnectionStatus = 'connecting' | 'live' | 'reconnecting' | 'polling';

/**
 * Subscribe to Postgres Realtime changes for a table using a unique
 * per-subscription channel name so React 18 StrictMode double-mounts never
 * attach listeners to an already-subscribed channel instance.
 */
export function subscribeToTableChanges<T = Record<string, unknown>>(
  channelPrefix: string,
  table: string,
  onChange: (payload: TableChangePayload<T>) => void,
  onStatusChange?: (status: RealtimeConnectionStatus) => void
): () => void {
  const client = supabase;
  if (!client) {
    onStatusChange?.('polling');
    return () => {};
  }

  onStatusChange?.('connecting');

  const suffix =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const channel = client
    .channel(`${channelPrefix}-${suffix}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table },
      (payload) => {
        onChange({
          eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
          new: (payload.new ?? {}) as T,
          old: (payload.old ?? {}) as Partial<T>,
        });
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        onStatusChange?.('live');
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        onStatusChange?.('polling');
      }
    });

  return () => {
    void client.removeChannel(channel);
  };
}
