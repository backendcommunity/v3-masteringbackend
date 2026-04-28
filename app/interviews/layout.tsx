import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Live Interviews",
  description:
    "Live backend engineering interview sessions. Practice with real-world scenarios and sharpen your technical communication skills.",
  robots: { index: false, follow: false },
};

export default function InterviewsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
