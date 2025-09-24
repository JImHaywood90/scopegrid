import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const COOKIE_ID = 'sg.companyIdentifier';
const COOKIE_NAME = 'sg.companyName';

export async function GET(req: NextRequest) {
  const id = req.cookies.get(COOKIE_ID)?.value || '';
  const name = req.cookies.get(COOKIE_NAME)?.value || '';
  return NextResponse.json({ identifier: id || null, name: name || null });
}

export async function POST(req: NextRequest) {
  const { identifier, name } = (await req.json()) || {};
  if (!identifier) return NextResponse.json({ error: 'identifier required' }, { status: 400 });

  const res = NextResponse.json({ ok: true });
  const secure = process.env.NODE_ENV === 'production';
  const maxAge = 60 * 60 * 24 * 30; // 30 days

  res.cookies.set(COOKIE_ID, String(identifier), {
    httpOnly: true, sameSite: 'lax', path: '/', secure, maxAge,
  });
  res.cookies.set(COOKIE_NAME, String(name || ''), {
    httpOnly: true, sameSite: 'lax', path: '/', secure, maxAge,
  });

  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_ID, '', { path: '/', maxAge: 0 });
  res.cookies.set(COOKIE_NAME, '', { path: '/', maxAge: 0 });
  return res;
}
