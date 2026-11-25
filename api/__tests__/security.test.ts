import { describe, it, expect } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import analyticsHandler from '../analytics';
import contactHandler from '../contact';

function createMockRes() {
  const headers: Record<string, string> = {};
  let statusCode = 200;
  let jsonBody: unknown = null;

  const res = {
    setHeader(k: string, v: string) {
      headers[k.toLowerCase()] = v;
      return res;
    },
    status(code: number) {
      statusCode = code;
      return res;
    },
    json(payload: unknown) {
      jsonBody = payload;
      return res;
    },
    end() {
      return res;
    },
  } as unknown as VercelResponse;

  return {
    res,
    getStatus: () => statusCode,
    getBody: () => jsonBody,
    getHeaders: () => headers,
  };
}

describe('API Security', () => {
  it('rejects unauthenticated requests to /api/analytics with 401 or 503 when unconfigured', async () => {
    const req = {
      method: 'GET',
      headers: {},
      query: { range: '7d' },
    } as unknown as VercelRequest;

    const mock = createMockRes();
    await analyticsHandler(req, mock.res);

    expect([401, 503]).toContain(mock.getStatus());
    expect(mock.getHeaders()['cache-control']).toContain('no-store');
  });

  it('silently neutralizes honeypot spam on /api/contact', async () => {
    process.env.SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

    const req = {
      method: 'POST',
      headers: { 'x-forwarded-for': '198.51.100.10' },
      body: {
        full_name: 'Bot',
        email: 'bot@example.com',
        subject: 'Spam',
        message: 'Spam body here',
        website: 'http://spam.example',
      },
    } as unknown as VercelRequest;

    const mock = createMockRes();
    await contactHandler(req, mock.res);

    expect(mock.getStatus()).toBe(200);
    expect(mock.getBody()).toEqual({ ok: true });
  });

  it('rejects invalid contact form payloads with 400', async () => {
    process.env.SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

    const req = {
      method: 'POST',
      headers: { 'x-forwarded-for': '198.51.100.11' },
      body: {
        full_name: 'A',
        email: 'not-an-email',
        subject: 'Hi',
        message: 'Too short',
      },
    } as unknown as VercelRequest;

    const mock = createMockRes();
    await contactHandler(req, mock.res);

    expect(mock.getStatus()).toBe(400);
  });
});
