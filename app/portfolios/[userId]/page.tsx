import type { Metadata } from "next";
import { PortfolioRouteClient } from "@/components/pages/portfolio-route-client";
import { fetchPublicPortfolio } from "@/lib/server-portfolio";

interface PortfolioPageProps {
  params: Promise<{ userId: string }>;
}

export async function generateMetadata({
  params,
}: PortfolioPageProps): Promise<Metadata> {
  const { userId } = await params;
  const portfolio = await fetchPublicPortfolio(userId);

  // Sensible default when the API is unreachable — never throw from metadata.
  if (!portfolio) {
    return {
      title: "Developer Portfolio",
      description:
        "View this backend engineer's projects, certifications, and skills on MasteringBackend.",
    };
  }

  const name = portfolio.user.name || "Developer";
  const title = `${name} — Developer Portfolio`;
  const description =
    portfolio.user.bio ||
    portfolio.user.title ||
    `${name}'s backend engineering portfolio on MasteringBackend.`;
  const ogImage = `/portfolios/${encodeURIComponent(userId)}/opengraph-image`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function PortfolioPageRoute({
  params,
}: PortfolioPageProps) {
  const { userId } = await params;
  // Seed first paint with public data so logged-out viewers and crawlers get a
  // fully rendered portfolio; the client subtree refreshes (authed when possible).
  const initialData = (await fetchPublicPortfolio(userId)) ?? undefined;

  return <PortfolioRouteClient userId={userId} initialData={initialData} />;
}
