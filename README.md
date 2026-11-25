# Mydeen Analytics

Enterprise-grade, installable Progressive Web App (PWA) for website telemetry, real-time visitor tracking, and client inbox management — designed for private single-owner operation today and multi-tenant SaaS workspaces tomorrow.

## Architecture Overview

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Framer Motion, TanStack Query (`@tanstack/react-query`)
- **Auth & Realtime**: Supabase Auth (tab-scoped `sessionStorage`, server-verified `getUser()`) & Supabase Postgres Realtime with automatic polling fallback
- **Analytics Telemetry**: PostHog HogQL API proxied exclusively through `/api/analytics` (server-side credentials never exposed to the browser)
- **PWA**: `vite-plugin-pwa` with `NetworkOnly` enforcement for `/api/*`, Supabase, and PostHog so private data is never cached offline
- **Hosting & Security**: Vercel Serverless Functions + strict CSP, HSTS, `X-Frame-Options: DENY`, and `Cache-Control: no-store` headers

---

## 1. Environment Configuration

Copy `.env.example` to `.env` for local development (never commit `.env`):

- **Client (Public)**:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_POSTHOG_KEY`
  - `VITE_POSTHOG_HOST`
  - `VITE_INACTIVITY_TIMEOUT_MINUTES` (default: `10`)
- **Server (Vercel Secret Env Only)**:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `POSTHOG_PERSONAL_API_KEY`
  - `POSTHOG_PROJECT_ID`
  - `POSTHOG_API_HOST`
  - `ALLOWED_ORIGIN`
  - `LIVE_VISITOR_TIMEOUT_SECONDS` (default: `90`)
  - `ADMIN_EMAILS` (optional comma-separated admin email allowlist)

---

## 2. Database & RLS Setup (Supabase)

1. Run `supabase/schema.sql` in the Supabase SQL Editor to create `live_visitors`, `contact_messages`, and `activity_logs` with strict Row Level Security (RLS) and `anon` privilege revocation.
2. *(Optional for Friends/Invite or SaaS Mode)* Run `supabase/migrations/001_enterprise_workspaces.sql` to enable `workspaces`, `workspace_members`, `workspace_invitations`, `workspace_sites`, `client_orders`, `admin_notifications`, and `audit_logs`.
3. In **Authentication -> Providers -> Email**, disable public signups so only invited/admin accounts can sign in.

---

## 3. Local Development & Testing

```bash
npm install
npm run dev         # Starts Vite + local /api/* middleware on port 5174
npm run typecheck   # TypeScript verification
npm test            # Run Vitest unit, security, and component tests
npm run build       # Production build + PWA service worker generation
```

---

## 4. PWA Installation

- **Desktop / Android Chrome**: Click the **Install** button shown in the app header/login footer when supported by the browser.
- **iOS Safari**: Tap **Share -> Add to Home Screen**.
- **Offline Behavior**: Static shell assets load, while private dashboard views are locked behind an offline screen requiring active internet connectivity.

---

## 5. Deployment & Rollback

- Push to `main` on GitHub (`mohamed-mydeen/mydeenlabs`) to trigger Vercel production deployment and `.github/workflows/ci.yml` verification.
- To roll back a release on Vercel, open **Deployments** in the Vercel dashboard and select **Promote to Production** on the previous healthy deployment.
