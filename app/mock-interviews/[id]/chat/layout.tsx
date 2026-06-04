import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Interview Room · Mastering Backend",
  description: "AI-powered mock technical interview session",
  robots: { index: false, follow: false },
};

export default function ChatInterviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Full-screen layout — no navbar, no sidebar
  return (
    <div className="h-screen overflow-hidden bg-background">
      {children}
    </div>
  );
}
