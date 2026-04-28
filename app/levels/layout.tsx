import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Skill Levels",
  description:
    "Track your skill progression across backend engineering competencies. Level up by completing courses, projects, and challenges.",
  robots: { index: false, follow: false },
};

export default function LevelsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
