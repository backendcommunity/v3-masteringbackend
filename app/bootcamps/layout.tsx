import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bootcamps",
  description:
    "Intensive live bootcamps to rapidly level up your backend engineering skills. Learn with expert instructors and a cohort of motivated developers.",
  robots: { index: false, follow: false },
};

export default function BootcampsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
