import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Developer Portfolio",
  description:
    "Showcase your backend engineering journey — courses completed, projects built, bootcamps attended, and skills mastered. Your proof of work.",
  robots: { index: false, follow: false },
};

export default function PortfoliosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
