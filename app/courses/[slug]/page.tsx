import CourseDetailPageClient from "./CourseDetailPageClient";
import type { Metadata } from "next";

// Next 15: `params` and `searchParams` are Promises in server components and
// `generateMetadata` — they must be awaited (mirrors app/portfolios/[userId]).
type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ certificate?: string }>;
};

export async function generateMetadata({
  searchParams,
}: Props): Promise<Metadata> {
  const { certificate: certCode } = await searchParams;
  if (certCode) {
    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "";
    try {
      const res = await fetch(`${apiBase}/certifications/verify/${certCode}`, {
        next: { revalidate: 300 },
      });
      const json = await res.json();
      if (json?.data?.valid) {
        const cert = json.data.certificate;
        return {
          openGraph: {
            images: [
              {
                url: `/api/og/cert?code=${certCode}`,
                width: 1200,
                height: 630,
                alt: `${cert.holderName}'s certificate for ${cert.courseName}`,
              },
            ],
          },
          twitter: {
            card: "summary_large_image",
            images: [`/api/og/cert?code=${certCode}`],
          },
        };
      }
    } catch {
      // fall through to default metadata
    }
  }
  return {};
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  return <CourseDetailPageClient slug={slug} />;
}
