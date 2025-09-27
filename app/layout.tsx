// app/layout.tsx
import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import { FronteggAppProvider } from "@frontegg/nextjs/app";
import { ThemeProvider } from "next-themes";
import SWRProvider from "@/components/providers/SWRProvider";

export const metadata: Metadata = {
  title: "ScopeGrid",
  description: "Unified product/config dashboard for MSPs",
};

export const viewport: Viewport = { maximumScale: 1 };
const manrope = Manrope({ subsets: ["latin"] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <FronteggAppProvider authOptions={{ keepSessionAlive: true }}>
      <html
        lang="en"
        suppressHydrationWarning
        className={`bg-white dark:bg-gray-950 text-black dark:text-white ${manrope.className}`}
      >
        <body className="min-h-[100dvh] bg-gray-50 dark:bg-gray-950">
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <SWRProvider>
              {children}
            </SWRProvider>
          </ThemeProvider>
        </body>
      </html>
    </FronteggAppProvider>
  );
}
