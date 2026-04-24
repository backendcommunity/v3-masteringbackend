import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "30 Days of Projects",
  description:
    "30 days, 30 backend projects. A daily coding challenge designed to build your skills fast and fill your developer portfolio with real-world work.",
  robots: { index: false, follow: false },
};

export default function Project30Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
