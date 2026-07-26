import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Leaderboard",
  description:
    "See where you rank among the MasteringBackend community. Earn MB by completing courses, projects, and streaks — then climb the board.",
  robots: { index: false, follow: false },
};

export default function LeaderboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
