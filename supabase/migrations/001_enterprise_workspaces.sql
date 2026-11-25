-- ============================================================================
-- MYDEEN ANALYTICS — ENTERPRISE MULTI-TENANT WORKSPACE & RBAC MIGRATION
-- ============================================================================
-- Safe to run on top of supabase/schema.sql.
-- Enables Private Mode, Friends/Invite Mode, and SaaS Mode with strict RLS.

-- 1. Workspaces
CREATE TABLE IF NOT EXISTS public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(trim(name)) >= 2),
  slug TEXT NOT NULL UNIQUE,
  mode TEXT NOT NULL DEFAULT 'private' CHECK (mode IN ('private', 'invite', 'saas')),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Workspace Memberships & Roles
CREATE TABLE IF NOT EXISTS public.workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner', 'admin', 'analyst', 'viewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workspace_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_workspace_members_user
  ON public.workspace_members (user_id);

-- 3. Workspace Invitations (time-limited, revocable)
CREATE TABLE IF NOT EXISTS public.workspace_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'analyst' CHECK (role IN ('admin', 'analyst', 'viewer')),
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Workspace-Owned Sites
CREATE TABLE IF NOT EXISTS public.workspace_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  label TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workspace_id, domain)
);

-- 5. Client Orders (Workspace-isolated)
CREATE TABLE IF NOT EXISTS public.client_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  service_type TEXT NOT NULL,
  amount_cents INTEGER NOT NULL DEFAULT 0 CHECK (amount_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Admin Notifications (Workspace-isolated)
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'order', 'message', 'security')),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Audit Logs (Workspace-isolated, append-only)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email TEXT,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_workspace_created
  ON public.audit_logs (workspace_id, created_at DESC);

-- 8. Authorization Helper Functions (SECURITY DEFINER with locked search_path)
CREATE OR REPLACE FUNCTION public.is_workspace_member(ws_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workspace_members wm
    WHERE wm.workspace_id = ws_id
      AND wm.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.has_workspace_role(ws_id UUID, allowed_roles TEXT[])
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workspace_members wm
    WHERE wm.workspace_id = ws_id
      AND wm.user_id = auth.uid()
      AND wm.role = ANY (allowed_roles)
  );
$$;

-- 9. Enable RLS & Revoke Anonymous Access on All Workspace Tables
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.workspaces, public.workspace_members, public.workspace_invitations,
  public.workspace_sites, public.client_orders, public.admin_notifications, public.audit_logs
  FROM anon, public;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspaces, public.workspace_members,
  public.workspace_invitations, public.workspace_sites, public.client_orders,
  public.admin_notifications TO authenticated;
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;

-- 10. Strict Workspace Isolation Policies
DROP POLICY IF EXISTS "Members can view their workspaces" ON public.workspaces;
CREATE POLICY "Members can view their workspaces"
  ON public.workspaces FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR public.is_workspace_member(id));

DROP POLICY IF EXISTS "Owners can update their workspaces" ON public.workspaces;
CREATE POLICY "Owners can update their workspaces"
  ON public.workspaces FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() OR public.has_workspace_role(id, ARRAY['owner', 'admin']))
  WITH CHECK (owner_id = auth.uid() OR public.has_workspace_role(id, ARRAY['owner', 'admin']));

DROP POLICY IF EXISTS "Authenticated users can create workspaces" ON public.workspaces;
CREATE POLICY "Authenticated users can create workspaces"
  ON public.workspaces FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Members can view workspace_members" ON public.workspace_members;
CREATE POLICY "Members can view workspace_members"
  ON public.workspace_members FOR SELECT TO authenticated
  USING (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Owners and admins manage workspace_members" ON public.workspace_members;
CREATE POLICY "Owners and admins manage workspace_members"
  ON public.workspace_members FOR ALL TO authenticated
  USING (public.has_workspace_role(workspace_id, ARRAY['owner', 'admin']))
  WITH CHECK (public.has_workspace_role(workspace_id, ARRAY['owner', 'admin']));

DROP POLICY IF EXISTS "Owners and admins manage invitations" ON public.workspace_invitations;
CREATE POLICY "Owners and admins manage invitations"
  ON public.workspace_invitations FOR ALL TO authenticated
  USING (public.has_workspace_role(workspace_id, ARRAY['owner', 'admin']))
  WITH CHECK (public.has_workspace_role(workspace_id, ARRAY['owner', 'admin']));

DROP POLICY IF EXISTS "Members read workspace_sites" ON public.workspace_sites;
CREATE POLICY "Members read workspace_sites"
  ON public.workspace_sites FOR SELECT TO authenticated
  USING (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Owners and admins manage workspace_sites" ON public.workspace_sites;
CREATE POLICY "Owners and admins manage workspace_sites"
  ON public.workspace_sites FOR ALL TO authenticated
  USING (public.has_workspace_role(workspace_id, ARRAY['owner', 'admin']))
  WITH CHECK (public.has_workspace_role(workspace_id, ARRAY['owner', 'admin']));

DROP POLICY IF EXISTS "Members read client_orders" ON public.client_orders;
CREATE POLICY "Members read client_orders"
  ON public.client_orders FOR SELECT TO authenticated
  USING (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Analysts+ manage client_orders" ON public.client_orders;
CREATE POLICY "Analysts+ manage client_orders"
  ON public.client_orders FOR ALL TO authenticated
  USING (public.has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'analyst']))
  WITH CHECK (public.has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'analyst']));

DROP POLICY IF EXISTS "Members manage admin_notifications" ON public.admin_notifications;
CREATE POLICY "Members manage admin_notifications"
  ON public.admin_notifications FOR ALL TO authenticated
  USING (public.is_workspace_member(workspace_id))
  WITH CHECK (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Admins read audit_logs" ON public.audit_logs;
CREATE POLICY "Admins read audit_logs"
  ON public.audit_logs FOR SELECT TO authenticated
  USING (workspace_id IS NULL OR public.has_workspace_role(workspace_id, ARRAY['owner', 'admin']));

DROP POLICY IF EXISTS "Authenticated insert audit_logs" ON public.audit_logs;
CREATE POLICY "Authenticated insert audit_logs"
  ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (actor_id = auth.uid());
