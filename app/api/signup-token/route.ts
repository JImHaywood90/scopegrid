// app/api/signup-token/route.ts
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const SECRET = process.env.SIGNUP_TOKEN_SECRET!; // add to .env

export async function POST(req: NextRequest) {
  const { email, planId } = await req.json();
  const payload = JSON.stringify({ email, planId, iat: Date.now() });
  const b64 = Buffer.from(payload).toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET).update(b64).digest('base64url');
  return NextResponse.json({ clientReferenceId: `${b64}.${sig}` });
}

// helper you’ll also use in the webhook to verify:
export function verifySignupToken(token: string) {
  const [b64, sig] = token.split('.');
  const expected = crypto.createHmac('sha256', process.env.SIGNUP_TOKEN_SECRET!).update(b64).digest('base64url');
  if (sig !== expected) throw new Error('bad token');
  return JSON.parse(Buffer.from(b64, 'base64url').toString());
}
