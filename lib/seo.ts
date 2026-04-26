const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://app.masteringbackend.com";

function generateStructuredData(data: Record<string, unknown>) {
  return {
    __html: JSON.stringify({
      "@context": "https://schema.org",
      ...data,
    }),
  };
}

export const siteStructuredData = generateStructuredData({
  "@type": "Organization",
  name: "Mastering Backend",
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  sameAs: [
    "https://twitter.com/master_backend",
    "https://github.com/backendcommunity",
  ],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer service",
    email: "hi@masteringbackend.com",
  },
});

export const websiteStructuredData = generateStructuredData({
  "@type": "WebSite",
  name: "MasteringBackend",
  url: SITE_URL,
  description:
    "Master backend development with comprehensive courses, projects, and hands-on learning paths.",
});
