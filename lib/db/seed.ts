import { and, eq } from 'drizzle-orm';
import { db } from './drizzle';
import { users, teams, teamMembers } from './schema';
import { hashPassword } from '@/lib/auth/session';

// OPTIONAL: only run if you want Stripe products created
import { stripe } from '../payments/stripe';

// NEW: product catalog seeder
import { seedProducts } from './seed-products';

async function createStripeProducts() {
  if (process.env.SEED_STRIPE !== 'true') {
    console.log('Skipping Stripe seeding (set SEED_STRIPE=true to enable).');
    return;
  }
  console.log('Creating Stripe products and prices...');

  const baseProduct = await stripe.products.create({
    name: 'Base',
    description: 'Base subscription plan',
  });

  await stripe.prices.create({
    product: baseProduct.id,
    unit_amount: 800, // $8 in cents
    currency: 'usd',
    recurring: { interval: 'month', trial_period_days: 7 },
  });

  const plusProduct = await stripe.products.create({
    name: 'Plus',
    description: 'Plus subscription plan',
  });

  await stripe.prices.create({
    product: plusProduct.id,
    unit_amount: 1200, // $12 in cents
    currency: 'usd',
    recurring: { interval: 'month', trial_period_days: 7 },
  });

  console.log('Stripe products and prices created successfully.');
}

async function seed() {
  // 1) Idempotent user/team bootstrap
  const email = 'test@test.com';
  const password = 'admin123';

  let user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user) {
    const passwordHash = await hashPassword(password);
    [user] = await db
      .insert(users)
      .values({ email, passwordHash, role: 'owner' })
      .returning();
    console.log('Initial user created.');
  } else {
    console.log('Initial user already exists.');
  }

  let team =
    (await db.query.teams.findFirst({
      where: eq(teams.name, 'Test Team'),
    })) ||
    (await db.insert(teams).values({ name: 'Test Team' }).returning())[0];

  // ensure membership (owner)
  const existingMember = await db.query.teamMembers.findFirst({
    where: and(eq(teamMembers.userId, user.id), eq(teamMembers.teamId, team.id)),
  });

  if (!existingMember) {
    await db.insert(teamMembers).values({
      teamId: team.id,
      userId: user.id,
      role: 'owner',
    });
    console.log('Owner membership created.');
  } else {
    console.log('Owner membership already exists.');
  }

  // 2) Seed product catalog (idempotent upsert by slug)
  await seedProducts();
  console.log('Product catalog seeded.');

  // 3) (Optional) Stripe products
  await createStripeProducts();
}

seed()
  .then(() => {
    console.log('Seed process finished. Exiting...');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seed process failed:', error);
    process.exit(1);
  });
