import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Simple per-instance rate limiter (15 requests / minute per IP)
const rateMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  entry.count += 1;
  return entry.count > 15;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const allowedOrigin = process.env.ALLOWED_ORIGIN || 'https://mydeen.vercel.app';
  const origin = req.headers.origin || '';

  if (origin === allowedOrigin || origin.startsWith('http://localhost:')) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const forwarded = req.headers['x-forwarded-for'];
  const clientIp = Array.isArray(forwarded)
    ? forwarded[0]
    : (forwarded || 'unknown').split(',')[0].trim();

  if (isRateLimited(clientIp)) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(503).json({ error: 'Heartbeat storage unavailable' });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  if (!body || typeof body !== 'object') {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  const visitorId = String(body.visitor_id || '').trim();
  if (!/^[a-zA-Z0-9_-]{6,64}$/.test(visitorId)) {
    return res.status(400).json({ error: 'Invalid visitor_id' });
  }

  const rawPage = String(body.current_page || '/').trim();
  const currentPage = rawPage.startsWith('/') ? rawPage.slice(0, 200) : '/';

  const rawDevice = String(body.device_type || 'Desktop');
  const deviceType: 'Mobile' | 'Desktop' | 'Tablet' =
    rawDevice === 'Mobile' || rawDevice === 'Tablet' ? rawDevice : 'Desktop';

  const browser = String(body.browser || 'Unknown').slice(0, 40);
  const os = String(body.os || 'Unknown').slice(0, 40);

  // Approximate country from Vercel edge header (no IP stored)
  const country = String(req.headers['x-vercel-ip-country'] || 'Unknown').slice(0, 60);

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });

  const { error } = await supabaseAdmin.from('live_visitors').upsert(
    {
      visitor_id: visitorId,
      current_page: currentPage,
      device_type: deviceType,
      browser,
      os,
      country,
      last_active_at: new Date().toISOString(),
    },
    { onConflict: 'visitor_id' }
  );

  if (error) {
    console.error('Heartbeat upsert error:', error);
    return res.status(500).json({ error: 'Failed to record heartbeat' });
  }

  return res.status(200).json({ ok: true });
}
