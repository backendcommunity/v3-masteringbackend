import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";
import { ErrorBoundary } from "@/components/error-boundary";
import { PostHogProviderComponent } from "@/components/posthog-provider";
import { PostHogPageview } from "@/components/posthog-pageview";
import { AuthProvider } from "@/components/providers/auth-provider";
import { GamificationModals } from "@/components/gamification-modals";
import { ChunkReloadToast } from "@/components/chunk-reload-toast";
import { ChunkLoadRecovery } from "@/components/chunk-load-recovery";
import { siteStructuredData, websiteStructuredData } from "@/lib/seo";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "MasteringBackend - Learn Backend Engineering Practically",
    template: "%s | MasteringBackend",
  },
  description:
    "Master backend development with comprehensive courses, hands-on projects, and structured learning paths. Build real-world applications with modern technologies.",
  keywords: [
    "backend development",
    "programming courses",
    "web development",
    "Node.js",
    "Python",
    "API development",
    "database design",
    "full-stack development",
    "coding tutorials",
    "software engineering",
  ],
  authors: [{ name: "MasteringBackend Team" }],
  creator: "MasteringBackend",
  publisher: "MasteringBackend",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://app.masteringbackend.com",
  ),
  openGraph: {
    title: "MasteringBackend - Learn Backend Engineering Practically",
    description:
      "Master backend development with comprehensive courses, projects, and hands-on learning paths.",
    siteName: "MasteringBackend",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MasteringBackend - Learn Backend Engineering Practically",
    description:
      "Master backend development with comprehensive courses, projects, and hands-on learning paths.",
    creator: "@masteringbackend",
    site: "@masteringbackend",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION,
    other: {
      "msvalidate.01": process.env.NEXT_PUBLIC_BING_VERIFICATION ?? "",
    },
  },
  category: "education",
};

export const viewport = {
  width: "device-width",
  initialScale: 1.0,
  maximumScale: 5.0,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={siteStructuredData}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={websiteStructuredData}
        />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <PostHogProviderComponent>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange={false}
            storageKey="masteringbackend-theme"
          >
            <PostHogPageview />
            <Toaster />
            <ChunkReloadToast />
            <ChunkLoadRecovery />
            <GamificationModals />
            <ErrorBoundary>
              <AuthProvider>{children}</AuthProvider>
            </ErrorBoundary>
          </ThemeProvider>
        </PostHogProviderComponent>
      </body>
    </html>
  );
}
