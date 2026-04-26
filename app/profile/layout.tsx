import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Profile",
  description:
    "View and manage your MasteringBackend developer profile. Update your bio, skills, and public portfolio details.",
  robots: { index: false, follow: false },
};

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
