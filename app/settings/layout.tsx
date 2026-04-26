import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Account Settings",
  description:
    "Manage your MasteringBackend account — update your password, notification preferences, connected accounts, and privacy settings.",
  robots: { index: false, follow: false },
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
