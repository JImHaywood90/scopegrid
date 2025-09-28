import crypto from 'node:crypto';

const SECRET = process.env.SIGNUP_TOKEN_SECRET!;
if (!SECRET) throw new Error('SIGNUP_TOKEN_SECRET missing');

export type SignupPayload = { planId: string; iat: number };

export function signSignupPayload(payload: SignupPayload) {
  const b64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET).update(b64).digest('base64url');
  return `${b64}.${sig}`;
}

export function verifySignupId(id: string): SignupPayload | null {
  const [b64, sig] = id.split('.');
  if (!b64 || !sig) return null;
  const expected = crypto.createHmac('sha256', SECRET).update(b64).digest('base64url');
  try {
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  } catch {
    return null;
  }
  try {
    return JSON.parse(Buffer.from(b64, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}
