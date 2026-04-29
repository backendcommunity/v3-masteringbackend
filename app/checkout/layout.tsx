import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Checkout",
  description:
    "Complete your MasteringBackend subscription checkout securely. Unlock full access to all courses, projects, and bootcamps.",
  robots: { index: false, follow: false },
};

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
