import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const client = postgres(process.env.POSTGRES_URL!, {
  ssl: process.env.POSTGRES_URL?.includes('neon.tech') ? 'require' : undefined,
});

export const db = drizzle(client);