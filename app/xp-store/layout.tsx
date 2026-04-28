import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "XP Store",
  description:
    "Spend your earned XP on exclusive rewards, perks, and premium content. The more you learn, the more you earn.",
  robots: { index: false, follow: false },
};

export default function XpStoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
