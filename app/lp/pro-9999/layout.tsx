import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Learn backend and AI skills for ₦9,999 a month",
  description:
    "One Masteringbackend Pro subscription opens the whole platform: every backend and AI course and learning path, real projects with code review, practice exercises, unlimited AI mock interviews, bootcamps and the community.",
  openGraph: {
    title: "Become a backend or AI engineer for the price of a data bundle.",
    description:
      "₦9,999 a month opens every course, every project with code review, unlimited AI mock interviews and the community. Pay on the page, no account needed first.",
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
