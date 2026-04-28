import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Payment",
  description: "Complete your MasteringBackend payment securely.",
  robots: { index: false, follow: false },
};

export default function XpaymentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
