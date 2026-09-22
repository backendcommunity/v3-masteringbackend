import type { Metadata } from "next";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Learn backend and AI skills for ₦9,999 a month",
  description:
    "One Masteringbackend Pro subscription opens the whole platform: every backend and AI course and learning path, real projects with code review, practice exercises, unlimited AI mock interviews, bootcamps and the community.",
  openGraph: {
    title: "Become a backend or AI engineer for the price of a data bundle.",
    description:
      "₦9,999 a month opens every course, every project with code review, unlimited AI mock interviews and the community. Pay on the page, no account needed first.",
    type: "website",
  },
};

/** Meta (Facebook) Pixel — used by the script tag and the noscript fallback. */
const META_PIXEL_ID = "2083439365594973";

export default function LpPro9999Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script
          id="meta-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${META_PIXEL_ID}');
                fbq('track', 'PageView');
              `,
          }}
        />
        ;
      </head>
      <body>{children}</body>
    </html>
  );
  children;
}
