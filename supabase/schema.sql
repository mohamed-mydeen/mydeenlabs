-- ============================================================================
-- MYDEEN ANALYTICS — SUPABASE POSTGRESQL SCHEMA & ROW LEVEL SECURITY (RLS)
-- ============================================================================
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard)

-- 1. Table for Live Visitor Heartbeat Sessions
CREATE TABLE IF NOT EXISTS public.live_visitors (
  visitor_id TEXT PRIMARY KEY,
  current_page TEXT NOT NULL DEFAULT '/',
  device_type TEXT NOT NULL DEFAULT 'Desktop' CHECK (device_type IN ('Mobile', 'Desktop', 'Tablet')),
  browser TEXT NOT NULL DEFAULT 'Unknown',
  os TEXT NOT NULL DEFAULT 'Unknown',
  country TEXT NOT NULL DEFAULT 'Unknown',
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast active-window queries
CREATE INDEX IF NOT EXISTS idx_live_visitors_last_active
  ON public.live_visitors (last_active_at DESC);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.live_visitors ENABLE ROW LEVEL SECURITY;

-- 3. Strict RLS Policies:
--    - Public/Anonymous browser clients CANNOT directly read or list live_visitors.
--    - Only authenticated Admin users (verified via Supabase Auth) can SELECT live_visitors.
--    - All writes/upserts happen securely via the server-side /api/heartbeat endpoint
--      using the SUPABASE_SERVICE_ROLE_KEY (which bypasses RLS safely on the server).

DROP POLICY IF EXISTS "Allow authenticated admin to read live_visitors" ON public.live_visitors;
CREATE POLICY "Allow authenticated admin to read live_visitors"
  ON public.live_visitors
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Deny anonymous access to live_visitors" ON public.live_visitors;
CREATE POLICY "Deny anonymous access to live_visitors"
  ON public.live_visitors
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

-- 4. Enable Supabase Realtime for live_visitors
--    This allows the authenticated dashboard to receive live updates immediately.
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_visitors;

-- 5. Optional cleanup function to purge stale sessions older than 24 hours
CREATE OR REPLACE FUNCTION public.cleanup_stale_live_visitors()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.live_visitors
  WHERE last_active_at < NOW() - INTERVAL '24 hours';
END;
$$;

-- ============================================================================
-- 6. CONTACT MESSAGES TABLE & ROW LEVEL SECURITY (RLS)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL CHECK (char_length(trim(full_name)) >= 2),
  email TEXT NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  phone TEXT,
  company TEXT,
  enquiry_category TEXT NOT NULL DEFAULT 'General Enquiry' CHECK (
    enquiry_category IN (
      'Website Development',
      'Freelance Project',
      'Collaboration',
      'Job Opportunity',
      'General Enquiry',
      'Other'
    )
  ),
  subject TEXT NOT NULL CHECK (char_length(trim(subject)) >= 2),
  message TEXT NOT NULL CHECK (char_length(trim(message)) >= 5),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  is_replied BOOLEAN NOT NULL DEFAULT FALSE,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at
  ON public.contact_messages (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_contact_messages_status
  ON public.contact_messages (is_archived, is_read, is_replied);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Only authenticated admin users can read, update, or delete contact_messages
DROP POLICY IF EXISTS "Allow authenticated admin to read contact_messages" ON public.contact_messages;
CREATE POLICY "Allow authenticated admin to read contact_messages"
  ON public.contact_messages
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated admin to update contact_messages" ON public.contact_messages;
CREATE POLICY "Allow authenticated admin to update contact_messages"
  ON public.contact_messages
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated admin to delete contact_messages" ON public.contact_messages;
CREATE POLICY "Allow authenticated admin to delete contact_messages"
  ON public.contact_messages
  FOR DELETE
  TO authenticated
  USING (true);

-- Deny all direct anonymous access (public submissions go through /api/contact)
DROP POLICY IF EXISTS "Deny anonymous access to contact_messages" ON public.contact_messages;
CREATE POLICY "Deny anonymous access to contact_messages"
  ON public.contact_messages
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

-- Enable Supabase Realtime for live new-message notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.contact_messages;

-- ============================================================================
-- 7. EXPLICIT PRIVILEGE REVOCATION (DEFENSE-IN-DEPTH)
-- ============================================================================
-- Ensure anonymous / public roles have zero direct table privileges even if RLS is misconfigured.
REVOKE ALL ON public.live_visitors FROM anon, public;
REVOKE ALL ON public.contact_messages FROM anon, public;

GRANT SELECT ON public.live_visitors TO authenticated;
GRANT SELECT, UPDATE, DELETE ON public.contact_messages TO authenticated;

-- ============================================================================
-- 8. OPTIONAL PRIVATE DASHBOARD TABLES (CLIENT ORDERS, NOTIFICATIONS, LOGS)
-- ============================================================================
-- If you add client_orders, admin_notifications, or activity_logs, keep RLS enabled:
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_email TEXT,
  action TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.activity_logs FROM anon, public;
GRANT SELECT, INSERT ON public.activity_logs TO authenticated;

DROP POLICY IF EXISTS "Allow authenticated admin to read activity_logs" ON public.activity_logs;
CREATE POLICY "Allow authenticated admin to read activity_logs"
  ON public.activity_logs FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated admin to insert activity_logs" ON public.activity_logs;
CREATE POLICY "Allow authenticated admin to insert activity_logs"
  ON public.activity_logs FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Deny anonymous access to activity_logs" ON public.activity_logs;
CREATE POLICY "Deny anonymous access to activity_logs"
  ON public.activity_logs FOR ALL TO anon USING (false) WITH CHECK (false);


