import { redirect } from 'next/navigation';

export default function SignupForwarder({
  searchParams,
}: {
  searchParams: { redirectUrl?: string };
}) {
  // where to return after signup finishes
  const after = searchParams?.redirectUrl ?? '/onboarding';
  const url = `/account/sign-up?redirectUrl=${encodeURIComponent(after)}`;
  redirect(url);
}