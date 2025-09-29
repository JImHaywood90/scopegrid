// app/layout.tsx
import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import { FronteggAppProvider } from "@frontegg/nextjs/app";
import { ThemeProvider } from "next-themes";
import SWRProvider from "@/components/providers/SWRProvider";
import Script from "next/script";
import "@calcom/atoms/globals.min.css";
import { CalProvider } from "@calcom/atoms";
import { useState, useEffect } from "react";

export const metadata: Metadata = {
  title: "ScopeGrid",
  description: "Unified product/config dashboard for MSPs",
};

export const viewport: Viewport = { maximumScale: 1 };
const manrope = Manrope({ subsets: ["latin"] });
const [accessToken, setAccessToken] = useState<string | null>(null);

useEffect(() => {
  // Fetch the current user’s accessToken (and possibly refreshToken logic)
  fetch("/api/cal/get-managed-user-token")
    .then((res) => res.json())
    .then((data) => {
      setAccessToken(data.accessToken);
    });
}, []);

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FronteggAppProvider authOptions={{ keepSessionAlive: true }}>
      <CalProvider
        clientId={process.env.NEXT_PUBLIC_CAL_OAUTH_CLIENT_ID!}
        accessToken={accessToken ?? ""}
        options={{
          apiUrl:
            process.env.NEXT_PUBLIC_CAL_API_URL ?? "https://api.cal.com/v2",
          refreshUrl: "/api/cal/refresh-token",
        }}
      >
        <html
          lang="en"
          suppressHydrationWarning
          className={`bg-white dark:bg-gray-950 text-black dark:text-white ${manrope.className}`}
        >
          <body className="min-h-[100dvh] bg-gray-50 dark:bg-gray-950">
            <Script
              src="https://js.stripe.com/v3/pricing-table.js"
              strategy="afterInteractive"
              async
            />
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <SWRProvider>{children}</SWRProvider>
            </ThemeProvider>
          </body>
        </html>
      </CalProvider>
    </FronteggAppProvider>
  );
}
