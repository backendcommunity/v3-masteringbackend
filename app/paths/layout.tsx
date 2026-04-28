import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Learning Paths",
  description:
    "Your personalised backend engineering learning paths. Follow a structured curriculum tailored to your goals and current skill level.",
  robots: { index: false, follow: false },
};

export default function PathsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
