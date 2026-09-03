import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Make your scholarship flyer",
  description:
    "Generate a personalised flyer announcing that you're joining the AI Engineering Bootcamp Cohort 2, through the ₦27 Million AI Engineering Scholarship Initiative.",
  openGraph: {
    title: "₦27 Million AI Engineering Scholarship Initiative",
    description:
      "Make your own flyer and tell the world you're joining AI Engineering Bootcamp Cohort 2.",
    type: "website",
  },
};

export default function ScholarshipFlyerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
