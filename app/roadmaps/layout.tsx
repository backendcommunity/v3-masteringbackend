import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Learning Paths",
  description:
    "Follow structured backend engineering roadmaps to build expertise step by step. Curated paths from beginner to senior developer.",
  robots: { index: false, follow: false },
};

export default function RoadmapsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
