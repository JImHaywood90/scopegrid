'use server';

import { z } from 'zod';
import { db } from '@/lib/db/drizzle';
import { waitlist } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const schema = z.object({
  email: z.string().email('Enter a valid email').max(255),
  name: z.string().trim().max(120).optional().or(z.literal('')),
  company: z.string().trim().max(160).optional().or(z.literal('')),
  notes: z.string().trim().max(2000).optional().or(z.literal('')),
  // honeypot
  website: z.string().max(0).optional().or(z.literal('')),
});

export type WaitlistResult = {
  ok: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

export async function joinWaitlist(_prev: WaitlistResult | null, formData: FormData): Promise<WaitlistResult> {
  try {
    const input = schema.safeParse({
      email: (formData.get('email') ?? '').toString().toLowerCase(),
      name: (formData.get('name') ?? '').toString(),
      company: (formData.get('company') ?? '').toString(),
      notes: (formData.get('notes') ?? '').toString(),
      website: (formData.get('website') ?? '').toString(), // honeypot
    });

    if (!input.success) {
      return { ok: false, errors: input.error.flatten().fieldErrors };
    }

    const { email, name, company, notes, website } = input.data;

    // bot/honeypot: if set, silently succeed
    if (website) return { ok: true, message: 'Thanks! You’re on the list.' };

    // Upsert by email (portable approach)
    const existing = await db.select().from(waitlist).where(eq(waitlist.email, email)).limit(1);
    if (existing.length) {
      await db
        .update(waitlist)
        .set({
          name: name || existing[0].name,
          company: company || existing[0].company,
          notes: notes || existing[0].notes,
          source: 'prelaunch',
        })
        .where(eq(waitlist.email, email));
    } else {
      await db.insert(waitlist).values({
        email,
        name: name || null,
        company: company || null,
        notes: notes || null,
        source: 'prelaunch',
      });
    }

    return { ok: true, message: 'Thanks! You’re on the list.' };
  } catch (e) {
    console.error('joinWaitlist failed:', e);
    return { ok: false, message: 'Something went wrong. Please try again.' };
  }
}
