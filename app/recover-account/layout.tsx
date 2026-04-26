import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Recover Your Account",
  description:
    "Recover access to your MasteringBackend account. We'll help you get back in.",
  robots: { index: false, follow: false },
};

export default function RecoverAccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
