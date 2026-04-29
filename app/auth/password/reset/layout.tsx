import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reset Your Password",
  description: "Set a new password for your MasteringBackend account.",
  robots: { index: false, follow: false },
};

export default function ResetPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
