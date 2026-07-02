import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Your Account",
  description:
    "Join MasteringBackend and start learning backend development with structured courses, real-world projects, live bootcamps, and a community of engineers.",
  openGraph: {
    title: "Create Your Account | MasteringBackend",
    description:
      "Create your free account and start building. Courses, projects, and mentorship, free to begin.",
  },
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
