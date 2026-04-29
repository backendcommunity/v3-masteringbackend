import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MB Lands",
  description:
    "Gamified backend engineering challenges. Explore lands, complete stages, earn XP, and level up your skills through play.",
  robots: { index: false, follow: false },
};

export default function LandsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
