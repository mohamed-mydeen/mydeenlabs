import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const VALID_CATEGORIES = new Set([
  'Website Development',
  'Freelance Project',
  'Collaboration',
  'Job Opportunity',
  'General Enquiry',
  'Other',
]);

const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

// Simple per-instance rate limiter: max 5 contact submissions per 5 minutes per IP
const rateMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + 5 * 60_000 });
    return false;
  }
  entry.count += 1;
  return entry.count > 5;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const allowedOrigin = process.env.ALLOWED_ORIGIN || 'https://mydeen.vercel.app';
  const origin = req.headers.origin || '';

  if (origin === allowedOrigin || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
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
    return res.status(429).json({
      error: 'Too many messages sent recently. Please wait a few minutes and try again.',
    });
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(503).json({
      error: 'Contact service is temporarily unavailable. Please try again later.',
    });
  }

  let body: Record<string, unknown>;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
  } catch {
    return res.status(400).json({ error: 'Invalid request format.' });
  }

  const fullName = String(body.full_name || '').trim();
  const email = String(body.email || '').trim();
  const phone = body.phone ? String(body.phone).trim().slice(0, 40) : null;
  const company = body.company ? String(body.company).trim().slice(0, 120) : null;
  const rawCategory = String(body.enquiry_category || 'General Enquiry').trim();
  const enquiryCategory = VALID_CATEGORIES.has(rawCategory) ? rawCategory : 'General Enquiry';
  const subject = String(body.subject || '').trim();
  const message = String(body.message || '').trim();

  if (fullName.length < 2 || fullName.length > 120) {
    return res.status(400).json({ error: 'Please enter your full name (at least 2 characters).' });
  }
  if (!EMAIL_REGEX.test(email) || email.length > 160) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }
  if (subject.length < 2 || subject.length > 200) {
    return res.status(400).json({ error: 'Please enter a subject (at least 2 characters).' });
  }
  if (message.length < 5 || message.length > 5000) {
    return res.status(400).json({ error: 'Please enter a message (at least 5 characters).' });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });

  const { data, error } = await supabaseAdmin
    .from('contact_messages')
    .insert({
      full_name: fullName,
      email,
      phone: phone || null,
      company: company || null,
      enquiry_category: enquiryCategory,
      subject,
      message,
      is_read: false,
      is_replied: false,
      is_archived: false,
    })
    .select('id, created_at')
    .single();

  if (error) {
    console.error('Contact message insert error:', error);
    return res.status(500).json({
      error: 'Unable to save your message right now. Please try again.',
    });
  }

  return res.status(201).json({
    ok: true,
    id: data.id,
    created_at: data.created_at,
  });
}
