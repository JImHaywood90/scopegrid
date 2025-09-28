import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY missing');
}

// Avoid TS apiVersion mismatch errors by not pinning here
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
