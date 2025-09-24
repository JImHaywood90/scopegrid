'use client';

import ConnectWiseForm from "@/components/ConnectWise/ConnectWiseForm";


export default function ConnectWiseSettingsPage() {
  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="mb-6 flex items-center gap-3">
        <img src="/connectwise.png" alt="ConnectWise" className="h-10 w-auto lg:h-12" />
        <h1 className="text-lg lg:text-2xl font-medium">ConnectWise Settings</h1>
      </div>

      <ConnectWiseForm />
    </section>
  );
}