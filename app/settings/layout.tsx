import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Account Settings",
  description:
    "Manage your account: password, notifications, connected accounts, and privacy.",
  robots: { index: false, follow: false },
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
