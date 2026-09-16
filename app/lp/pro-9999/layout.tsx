import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "₦9,999/month — Every Backend & AI Course",
  description:
    "Full access to every Backend Engineering and AI Engineering course on Masteringbackend — Python, Advanced Java, AntiGravity, and AI Engineering from beginner to advanced — for one flat monthly price.",
  openGraph: {
    title: "Become a backend or AI engineer for the price of a data bundle.",
    description:
      "₦9,999/month unlocks every Backend and AI Engineering course on Masteringbackend. Pay on the page, no account needed first.",
    type: "website",
  },
};

export default function LpPro9999Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
