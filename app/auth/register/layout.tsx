import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Your Account",
  description:
    "Join MasteringBackend and start learning backend development with structured courses, real-world projects, live bootcamps, and a community of engineers.",
  openGraph: {
    title: "Create Your Account | MasteringBackend",
    description:
      "Start your backend engineering journey. Free to get started with courses, projects, and mentorship.",
  },
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
