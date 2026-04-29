import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verify Your Email",
  description:
    "Check your inbox and verify your email address to activate your MasteringBackend account.",
  robots: { index: false, follow: false },
};

export default function VerifyEmailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
