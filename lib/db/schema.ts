import { pgTable, serial, varchar, text, timestamp } from 'drizzle-orm/pg-core';

export const waitlist = pgTable('waitlist', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 120 }),
  company: varchar('company', { length: 160 }),
  source: varchar('source', { length: 120 }),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type Waitlist = typeof waitlist.$inferSelect; // a row as read from DB
export type NewWaitlist = typeof waitlist.$inferInsert; // data you can insert