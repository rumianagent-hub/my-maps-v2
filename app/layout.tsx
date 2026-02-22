import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { QueryProvider } from "@/lib/query-provider";
import Navbar from "@/components/Navbar";
import { ToastProvider } from "@/components/Toast";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { BfcacheHandler } from "@/components/BfcacheHandler";
import { Suspense } from "react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MyMaps — Share Your Favorite Restaurants",
  description: "Track every restaurant you visit, share your favorites, and discover new spots from friends.",
  metadataBase: new URL("https://my-maps-v2.pages.dev"),
  openGraph: {
    title: "MyMaps — Your Restaurants. Your Map.",
    description: "Track every restaurant you visit, share your favorites, and discover new spots from friends.",
    url: "https://my-maps-v2.pages.dev",
    siteName: "MyMaps",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} antialiased grain`}>
        <BfcacheHandler />
        <ErrorBoundary>
          <QueryProvider>
            <AuthProvider>
              <ToastProvider>
                <Suspense>
                  <Navbar />
                </Suspense>
                <main className="min-h-screen">
                  <ErrorBoundary>
                    <Suspense>{children}</Suspense>
                  </ErrorBoundary>
                </main>
              </ToastProvider>
            </AuthProvider>
          </QueryProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
