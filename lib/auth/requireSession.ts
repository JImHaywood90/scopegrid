import { getUser } from '@/lib/db/queries';

export async function requireSession() {
  const user = await getUser();
  if (!user) {
    const err = new Error('Unauthorized');
    (err as any).status = 401;
    throw err;
  }
  return user;
}
