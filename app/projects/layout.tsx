import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Build real-world backend projects to sharpen your skills and grow your developer portfolio. Hands-on challenges with industry-standard tools.",
  robots: { index: false, follow: false },
};

export default function ProjectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
