import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";
import { ErrorBoundary } from "@/components/error-boundary";
import { PostHogProviderComponent } from "@/components/posthog-provider";
import { PostHogPageview } from "@/components/posthog-pageview";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Mastering Backend",
  description:
    "Master backend development with comprehensive courses, projects, and hands-on learning paths.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1.0,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
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
            <ErrorBoundary>{children}</ErrorBoundary>
          </ThemeProvider>
        </PostHogProviderComponent>
      </body>
    </html>
  );
}
