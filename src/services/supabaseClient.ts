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

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

/**
 * Subscribe to Postgres Realtime changes for a public table using a unique
 * per-subscription channel name so React 18 StrictMode double-mounts never
 * attach listeners to an already-subscribed channel instance.
 */
export function subscribeToTableChanges<T = Record<string, unknown>>(
  channelPrefix: string,
  table: string,
  onChange: (payload: TableChangePayload<T>) => void
): () => void {
  const client = supabase;
  if (!client) return () => {};

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
    .subscribe();

  return () => {
    void client.removeChannel(channel);
  };
}
