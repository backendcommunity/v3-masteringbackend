import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Courses",
  description:
    "Browse all backend engineering courses. From Node.js and Python to databases, APIs, and system design — learn at your own pace with expert-led content.",
  robots: { index: false, follow: false },
};

export default function CoursesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
