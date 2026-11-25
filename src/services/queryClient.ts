import { QueryClient } from '@tanstack/react-query';

/**
 * Centralized TanStack Query client with Socket.IO-like instant navigation & background sync.
 * - Analytics summaries stay warm in memory for 5 minutes (gcTime 30 minutes)
 *   so switching between Today / 7d / 30d / 90d or navigating routes is instant.
 * - Live visitors & Contact messages update directly in-place via Supabase Realtime WebSockets.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60_000,
      gcTime: 30 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0,
    },
  },
});

export const QUERY_KEYS = {
  analytics: (range: string, site: string, workspaceId: string) =>
    ['analytics', workspaceId, site, range] as const,
  liveVisitors: (workspaceId: string) =>
    ['live-visitors', workspaceId] as const,
  contactMessages: (workspaceId: string) =>
    ['contact-messages', workspaceId] as const,
  workspaces: (userId: string) =>
    ['workspaces', userId] as const,
  workspaceMembers: (workspaceId: string) =>
    ['workspace-members', workspaceId] as const,
};

/**
 * Clear all cached server state on logout or workspace switch
 * so private data never leaks across sessions or tenants.
 */
export function clearQueryCache(): void {
  queryClient.clear();
}
