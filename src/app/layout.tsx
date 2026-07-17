import type { Metadata, Viewport } from "next";
import React from "react";
import { VT323 } from "next/font/google";
import { getServerSession } from "next-auth";
import "./globals.css";
import MaintenancePage from "@/app/maintenance/page";
import { SkipToContent } from "@/components/Accessibility";
import ClientRoot from "@/components/ClientRoot";
import { ThemeProvider } from "@/components/ThemeProvider";
import { authOptions } from "@/lib/auth";
import { I18nProvider } from "@/lib/i18n";
import { isMaintenanceMode } from "@/lib/maintenance";
import { isSuperAdmin } from "@/lib/security";

const scoreFont = VT323({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#22c55e", // pitch green
};

const baseUrl =
  process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://matchday.gg";
const siteTitle = "MatchDay — Real-time sports watch parties, predictions & fan XP";
const siteDescription =
  "Watch live matches together, predict scores, earn fan XP, compete on leaderboards and chat with your crew in real-time.";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: siteTitle,
    template: "%s | MatchDay",
  },
  description: siteDescription,
  keywords: [
    "sports watch party",
    "live match",
    "score prediction",
    "fan experience",
    "watch together",
    "sports chat",
    "fan XP",
    "football",
    "soccer",
    "basketball",
    "cricket",
    "formula 1",
  ],
  authors: [{ name: "MatchDay" }],
  creator: "MatchDay",
  publisher: "MatchDay",
  robots: "index, follow",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: baseUrl,
    siteName: "MatchDay",
    title: siteTitle,
    description: siteDescription,
    images: [{ url: "/og-image.png", width: 1920, height: 1080, alt: "MatchDay" }],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: ["/og-image.png"],
    creator: "@matchdaygg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MatchDay",
  },
  applicationName: "MatchDay",
  category: "sports",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  let showMaintenance = false;

  try {
    const maintenanceActive = await isMaintenanceMode();
    if (maintenanceActive) {
      const session = await getServerSession(authOptions);
      if (!session?.user || !isSuperAdmin((session.user as any).role)) {
        showMaintenance = true;
      }
    }
  } catch {
    // Keep app resilient to maintenance-check failures
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (sessionStorage.getItem('matchday_intro_played')) {
                  document.documentElement.classList.add('skip-intro');
                }
              } catch (e) {}
            `,
          }}
        />
        {/* DNS prefetch for sports APIs */}
        <link rel="dns-prefetch" href="https://www.thesportsdb.com" />
        <link rel="dns-prefetch" href="https://www.youtube.com" />

        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />

        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className={scoreFont.className} suppressHydrationWarning>
        <SkipToContent />
        <ThemeProvider>
          <I18nProvider>
            <ClientRoot>
              <div id="main-content" tabIndex={-1}>
                {showMaintenance ? <MaintenancePage /> : children}
              </div>
            </ClientRoot>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
