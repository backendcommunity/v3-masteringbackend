import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Developer Portfolio",
  description:
    "Show your work: courses completed, projects built, bootcamps done, skills proven. Your backend portfolio.",
  robots: { index: false, follow: false },
};

export default function PortfoliosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
