import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mock Interviews",
  description:
    "Practice backend engineering technical interviews with realistic questions. Get instant AI feedback to identify gaps and build confidence before the real thing.",
  robots: { index: false, follow: false },
};

export default function MockInterviewsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
