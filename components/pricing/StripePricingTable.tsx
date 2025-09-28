'use client';

import Script from 'next/script';
import React from 'react';

type PricingTableProps = {
  pricingTableId: string;
  publishableKey: string;
  customerEmail?: string;
  clientReferenceId?: string;
  className?: string;
};

export default function PricingTable({
  pricingTableId,
  publishableKey,
  customerEmail,
  clientReferenceId,
  className,
}: PricingTableProps) {
  return (
    <>
      <Script src="https://js.stripe.com/v3/pricing-table.js" async />
      {
        // We render the custom element. TS doesn’t “know” this tag by default,
        // but we’ll add a tiny global type below to silence JSX errors.
      }
      {/* @ts-expect-error - web component provided by Stripe script */}
      <stripe-pricing-table
        class={className}
        pricing-table-id={pricingTableId}
        publishable-key={publishableKey}
        {...(customerEmail ? { 'customer-email': customerEmail } : {})}
        {...(clientReferenceId ? { 'client-reference-id': clientReferenceId } : {})}
      />
    </>
  );
}
