import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { supabase } from '../services/supabaseClient';
import { clearQueryCache } from '../services/queryClient';

export type WorkspaceMode = 'private' | 'invite' | 'saas';
export type WorkspaceRole = 'owner' | 'admin' | 'analyst' | 'viewer';

export interface WorkspaceSummary {
  id: string;
  name: string;
  slug: string;
  mode: WorkspaceMode;
  role: WorkspaceRole;
}

export interface WorkspaceMember {
  id: string;
  user_id: string;
  email: string;
  role: WorkspaceRole;
  created_at: string;
}

export interface WorkspaceInvitation {
  id: string;
  email: string;
  role: Exclude<WorkspaceRole, 'owner'>;
  expires_at: string;
  accepted_at: string | null;
  revoked_at: string | null;
  created_at: string;
}

interface WorkspaceContextValue {
  workspaces: WorkspaceSummary[];
  activeWorkspace: WorkspaceSummary;
  members: WorkspaceMember[];
  invitations: WorkspaceInvitation[];
  schemaReady: boolean;
  loading: boolean;
  switchWorkspace: (workspaceId: string) => void;
  updateWorkspaceMode: (mode: WorkspaceMode) => Promise<{ error: string | null }>;
  inviteMember: (
    email: string,
    role: Exclude<WorkspaceRole, 'owner'>
  ) => Promise<{ error: string | null }>;
  revokeInvitation: (invitationId: string) => Promise<{ error: string | null }>;
  removeMember: (memberId: string) => Promise<{ error: string | null }>;
  refreshWorkspaceData: () => Promise<void>;
}

const DEFAULT_PRIVATE_WORKSPACE: WorkspaceSummary = {
  id: 'default-private',
  name: 'Mydeen Private',
  slug: 'mydeen-private',
  mode: 'private',
  role: 'owner',
};

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined);

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>([DEFAULT_PRIVATE_WORKSPACE]);
  const [activeId, setActiveId] = useState<string>('default-private');
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [invitations, setInvitations] = useState<WorkspaceInvitation[]>([]);
  const [schemaReady, setSchemaReady] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const loadWorkspaces = useCallback(async () => {
    if (!user || !supabase) {
      setWorkspaces([DEFAULT_PRIVATE_WORKSPACE]);
      setActiveId('default-private');
      setMembers([]);
      setInvitations([]);
      setSchemaReady(false);
      return;
    }

    setLoading(true);
    try {
      const { data: wsRows, error: wsError } = await supabase
        .from('workspaces')
        .select('id, name, slug, mode, owner_id')
        .order('created_at', { ascending: true });

      if (wsError) {
        // Multi-tenant migration not yet applied — gracefully operate in Private Mode
        setWorkspaces([DEFAULT_PRIVATE_WORKSPACE]);
        setActiveId('default-private');
        setSchemaReady(false);
        return;
      }

      setSchemaReady(true);

      if (!wsRows || wsRows.length === 0) {
        setWorkspaces([DEFAULT_PRIVATE_WORKSPACE]);
        setActiveId('default-private');
        return;
      }

      const mapped: WorkspaceSummary[] = wsRows.map((w) => ({
        id: w.id as string,
        name: w.name as string,
        slug: w.slug as string,
        mode: w.mode as WorkspaceMode,
        role: w.owner_id === user.id ? 'owner' : 'admin',
      }));

      setWorkspaces(mapped);
      const nextActiveId = mapped.some((w) => w.id === activeId) ? activeId : mapped[0].id;
      setActiveId(nextActiveId);

      // Load members & pending invitations for active workspace
      const [membersRes, invitesRes] = await Promise.all([
        supabase
          .from('workspace_members')
          .select('id, user_id, email, role, created_at')
          .eq('workspace_id', nextActiveId)
          .order('created_at', { ascending: true }),
        supabase
          .from('workspace_invitations')
          .select('id, email, role, expires_at, accepted_at, revoked_at, created_at')
          .eq('workspace_id', nextActiveId)
          .is('revoked_at', null)
          .order('created_at', { ascending: false }),
      ]);

      setMembers((membersRes.data ?? []) as WorkspaceMember[]);
      setInvitations((invitesRes.data ?? []) as WorkspaceInvitation[]);
    } finally {
      setLoading(false);
    }
  }, [user, activeId]);

  useEffect(() => {
    void loadWorkspaces();
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeWorkspace =
    workspaces.find((w) => w.id === activeId) || workspaces[0] || DEFAULT_PRIVATE_WORKSPACE;

  const switchWorkspace = useCallback(
    (workspaceId: string) => {
      if (workspaceId === activeId) return;
      // Prevent stale data from leaking between workspaces
      clearQueryCache();
      setActiveId(workspaceId);
    },
    [activeId]
  );

  const updateWorkspaceMode = useCallback(
    async (mode: WorkspaceMode): Promise<{ error: string | null }> => {
      if (!supabase || !schemaReady || activeWorkspace.id === 'default-private') {
        return {
          error:
            'Run supabase/migrations/001_enterprise_workspaces.sql in Supabase SQL Editor to persist multi-user workspace modes.',
        };
      }
      const { error } = await supabase
        .from('workspaces')
        .update({ mode })
        .eq('id', activeWorkspace.id);
      if (error) return { error: error.message };
      await loadWorkspaces();
      return { error: null };
    },
    [schemaReady, activeWorkspace.id, loadWorkspaces]
  );

  const inviteMember = useCallback(
    async (
      email: string,
      role: Exclude<WorkspaceRole, 'owner'>
    ): Promise<{ error: string | null }> => {
      if (!supabase || !user || !schemaReady || activeWorkspace.id === 'default-private') {
        return { error: 'Workspace invitations require the enterprise workspace SQL migration.' };
      }
      const { error } = await supabase.from('workspace_invitations').insert({
        workspace_id: activeWorkspace.id,
        email: email.trim().toLowerCase(),
        role,
        created_by: user.id,
      });
      if (error) return { error: error.message };
      await loadWorkspaces();
      return { error: null };
    },
    [user, schemaReady, activeWorkspace.id, loadWorkspaces]
  );

  const revokeInvitation = useCallback(
    async (invitationId: string): Promise<{ error: string | null }> => {
      if (!supabase || !schemaReady) return { error: 'Not configured.' };
      const { error } = await supabase
        .from('workspace_invitations')
        .update({ revoked_at: new Date().toISOString() })
        .eq('id', invitationId);
      if (error) return { error: error.message };
      await loadWorkspaces();
      return { error: null };
    },
    [schemaReady, loadWorkspaces]
  );

  const removeMember = useCallback(
    async (memberId: string): Promise<{ error: string | null }> => {
      if (!supabase || !schemaReady) return { error: 'Not configured.' };
      const { error } = await supabase
        .from('workspace_members')
        .delete()
        .eq('id', memberId);
      if (error) return { error: error.message };
      await loadWorkspaces();
      return { error: null };
    },
    [schemaReady, loadWorkspaces]
  );

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        activeWorkspace,
        members,
        invitations,
        schemaReady,
        loading,
        switchWorkspace,
        updateWorkspaceMode,
        inviteMember,
        revokeInvitation,
        removeMember,
        refreshWorkspaceData: loadWorkspaces,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) {
    throw new Error('useWorkspace must be used inside WorkspaceProvider');
  }
  return ctx;
}
