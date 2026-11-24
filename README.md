# Mydeen Analytics

Private, mobile-first web analytics platform for monitoring [https://mydeen.vercel.app/](https://mydeen.vercel.app/).
Built with React, TypeScript, Vite, Tailwind CSS, Supabase Auth & Realtime, PostHog Analytics, and Vercel Serverless Functions.

---

## 1. Supabase Setup

1. Create a new project at [https://supabase.com](https://supabase.com).
2. Open **SQL Editor** and run the entire script in `supabase/schema.sql`. This creates `public.live_visitors`, enables **Row Level Security (RLS)**, restricts anonymous reads, and enables **Supabase Realtime**.
3. Go to **Authentication -> Providers -> Email** and ensure **Disable public signups** ("Allow new users to sign up" = OFF) so no public user can register.
4. Go to **Authentication -> Users -> Add User** and create your single private Admin user (email + password).
5. Copy from **Project Settings -> API**:
   - `VITE_SUPABASE_URL` / `SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (keep strictly server-side in Vercel Environment Variables!)

---

## 2. PostHog Setup

1. Create a free PostHog Cloud project at [https://posthog.com](https://posthog.com).
2. From **Project Settings**:
   - Copy the **Project API Key** (`phc_...`) -> `VITE_POSTHOG_KEY`
   - Copy your **Project ID** (numeric ID in the URL or settings) -> `POSTHOG_PROJECT_ID`
   - Set `VITE_POSTHOG_HOST` (`https://us.i.posthog.com` or `https://eu.i.posthog.com`) and `POSTHOG_API_HOST` (`https://us.posthog.com` or `https://eu.posthog.com`).
3. Go to **Account Settings -> Personal API Keys** and create a key with **Query Read** access -> `POSTHOG_PERSONAL_API_KEY` (keep strictly server-side in Vercel Environment Variables!).

---

## 3. Deploy Mydeen Analytics to Vercel

1. Import `https://github.com/mohamed-mydeen/mydeenlabs` as a new Vercel project (domain: `https://mydeenlabs.vercel.app/`).
2. Add the environment variables from `.env.example` in **Vercel -> Project Settings -> Environment Variables**:
   - **Client**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_POSTHOG_KEY`, `VITE_POSTHOG_HOST`
   - **Server (Secret)**: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `POSTHOG_PERSONAL_API_KEY`, `POSTHOG_PROJECT_ID`, `POSTHOG_API_HOST`, `ALLOWED_ORIGIN=https://mydeen.vercel.app`, `LIVE_VISITOR_TIMEOUT_SECONDS=90`
3. Deploy!

---

## 4. Enable Tracking on Portfolio (`mydeen`)

The PostHog SDK and live visitor heartbeat are already integrated in `mydeen/src/utils/analytics.ts` and `mydeen/src/App.tsx`.
In your **Portfolio Vercel Project** (`mydeen`), add these public environment variables and redeploy:

```env
VITE_POSTHOG_KEY=phc_your_posthog_project_key
VITE_POSTHOG_HOST=https://us.i.posthog.com
VITE_ANALYTICS_HEARTBEAT_URL=https://mydeenlabs.vercel.app/api/heartbeat
VITE_CONTACT_API_URL=https://mydeenlabs.vercel.app/api/contact
```
