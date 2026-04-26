import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
  description:
    "Welcome back. Sign in to your MasteringBackend account and pick up exactly where you left off on your backend engineering journey.",
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
