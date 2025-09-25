'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { joinWaitlist, type WaitlistResult } from './waitlist-actions';

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="mt-1 text-xs text-red-600">{errors[0]}</p>;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="rounded-full">
      {pending ? 'Submitting…' : 'Join waitlist'}
    </Button>
  );
}

const initialState: WaitlistResult = { ok: false };

export default function WaitlistForm() {
  const [state, formAction] = useActionState(joinWaitlist, initialState);
  const formRef = React.useRef<HTMLFormElement | null>(null);

  // Reset fields after a successful submit
  React.useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-4"
    >
      {/* Honeypot (hidden) */}
      <input type="text" name="website" className="hidden" tabIndex={-1} autoComplete="off" />

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="email" className="text-sm font-medium text-gray-900">Email</label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            placeholder="you@company.com"
            className="mt-1 rounded-xl focus-visible:ring-orange-500"
          />
          <FieldError errors={state.errors?.email} />
        </div>

        <div>
          <label htmlFor="name" className="text-sm font-medium text-gray-900">Name</label>
          <Input
            id="name"
            name="name"
            placeholder="Jane Doe"
            className="mt-1 rounded-xl focus-visible:ring-orange-500"
          />
          <FieldError errors={state.errors?.name} />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="company" className="text-sm font-medium text-gray-900">Company</label>
          <Input
            id="company"
            name="company"
            placeholder="Acme MSP"
            className="mt-1 rounded-xl focus-visible:ring-orange-500"
          />
          <FieldError errors={state.errors?.company} />
        </div>

        <div>
          <label htmlFor="notes" className="text-sm font-medium text-gray-900">Notes (optional)</label>
          <Textarea
            id="notes"
            name="notes"
            rows={2}
            placeholder="What are you hoping ScopeGrid will help with?"
            className="mt-1 rounded-xl focus-visible:ring-orange-500"
          />
          <FieldError errors={state.errors?.notes} />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <SubmitButton />
        {state.message && (
          <span className={state.ok ? 'text-green-700 text-sm' : 'text-red-600 text-sm'}>
            {state.message}
          </span>
        )}
      </div>
    </form>
  );
}
