import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Community",
  description:
    "Connect with thousands of backend developers on MasteringBackend. Share knowledge, ask questions, get code reviews, and grow together.",
  robots: { index: false, follow: false },
};

export default function CommunityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
