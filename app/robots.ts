import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/auth/login", "/auth/register"],
        disallow: "/",
      },
    ],
  };
}
