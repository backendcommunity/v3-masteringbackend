import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Certifications",
  description:
    "Your earned certificates from completed courses and bootcamps on MasteringBackend. Showcase your backend engineering credentials.",
  robots: { index: false, follow: false },
};

export default function CertificationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
