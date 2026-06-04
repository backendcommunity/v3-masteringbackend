import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Interview Results · Mastering Backend",
  description: "Review your mock interview performance",
};

export default function ResultsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen overflow-hidden bg-background">
      {children}
    </div>
  );
}
