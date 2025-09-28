// app/(dashboard)/welcome/page.tsx
import Stripe from "stripe";
import Link from "next/link";

export const runtime = "nodejs";

type SearchParams = { session_id?: string | string[] };

export default async function WelcomePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const sessionIdRaw = sp?.session_id;
  const sessionId = Array.isArray(sessionIdRaw) ? sessionIdRaw[0] : sessionIdRaw;

  let email: string | null = null;

  if (sessionId) {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    const sess = await stripe.checkout.sessions.retrieve(sessionId);

    if (typeof sess.customer === "string" && sess.customer) {
      const cust = await stripe.customers.retrieve(sess.customer);
      if (!("deleted" in cust && cust.deleted)) {
        email = (cust as Stripe.Customer).email ?? null;
      }
    }
  }

  return (
    <section className="container mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-2">You’re all set 🎉</h1>
      <p className="text-muted-foreground mb-6">
        We’ve created your account.{" "}
        {email ? (
          <>
            We’ll use <b>{email}</b> for your login.
          </>
        ) : null}
      </p>

      <Link
        href="/account/login"
        className="inline-flex items-center rounded-md bg-orange-500 text-white px-4 py-2 hover:bg-orange-600"
      >
        Continue to sign in
      </Link>

      <p className="text-xs text-muted-foreground mt-4">
        Tip: You'll receive an email with ana activation link which will redirect you to te dashboard. To sign-in you will receive a magic link each time, until you configure SSO/SAML.
      </p>
    </section>
  );
}
