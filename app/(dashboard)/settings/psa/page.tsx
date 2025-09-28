'use client';

import ConnectWiseForm from "@/components/ConnectWise/ConnectWiseForm";
import HaloPSAForm from "@/components/halo/HaloPSAForm";


export default function ConnectWiseSettingsPage() {
  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="mb-6 flex items-center gap-3">
        <h1 className="text-lg lg:text-2xl font-medium">ConnectWise Settings</h1>
      </div>

      <ConnectWiseForm />

      <div className="mb-6 mt-6 flex items-center gap-3">
        <h1 className="text-lg lg:text-2xl font-medium">Halo Settings</h1>
      </div>

      <HaloPSAForm />

    </section>
  );
}