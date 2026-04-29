import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Subscription",
  description:
    "Manage your MasteringBackend subscription. View your current plan, upgrade to Pro, or manage billing details.",
  robots: { index: false, follow: false },
};

export default function SubscriptionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
