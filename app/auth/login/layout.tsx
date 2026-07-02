import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
  description:
    "Welcome back. Sign in and pick up where you left off.",
  openGraph: {
    title: "Sign In | MasteringBackend",
    description:
      "Sign in to access your courses, projects, and learning progress.",
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
