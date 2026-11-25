import { QueryClient } from '@tanstack/react-query';

/**
 * Centralized TanStack Query client with data-freshness-aware cache policies.
 * - Analytics summaries: 60s staleTime
 * - Live visitors: 15s staleTime (updated via Realtime / controlled polling)
 * - Contact messages: 30s staleTime (updated via Realtime / optimistic-free invalidation)
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
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
