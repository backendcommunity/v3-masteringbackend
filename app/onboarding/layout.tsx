import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Getting Started",
  description:
    "Set up your MasteringBackend profile, tell us your goals, and get a personalised backend engineering learning plan in minutes.",
  robots: { index: false, follow: false },
};

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
