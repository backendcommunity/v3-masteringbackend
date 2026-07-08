import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

// nodejs (not edge): the API base (NEXT_PUBLIC_API_URL) may point at an
// internal/non-edge-reachable host, and `next/og` runs fine under nodejs. This
// mirrors the deliberate choice in app/portfolios/[userId]/opengraph-image.tsx.
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");

  let holderName = "Certificate Holder";
  let courseName = "Course";
  let issuedAt = "";

  if (code) {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "";
      const res = await fetch(`${apiBase}/certifications/verify/${code}`);
      const json = await res.json();
      if (json?.data?.valid) {
        holderName = json.data.certificate.holderName;
        courseName = json.data.certificate.courseName;
        issuedAt = new Date(json.data.certificate.issuedAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      }
    } catch {
      // use defaults
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0e1f33 0%, #0a1628 100%)",
          padding: "60px",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Top accent bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "8px",
            background: "#13AECE",
            display: "flex",
          }}
        />

        {/* Certificate badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              background: "#13AECE",
              borderRadius: "50%",
              width: "48px",
              height: "48px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
            }}
          >
            🎓
          </div>
          <span
            style={{
              color: "#13AECE",
              fontSize: "20px",
              fontWeight: 600,
              letterSpacing: "2px",
              textTransform: "uppercase",
            }}
          >
            Certificate of Completion
          </span>
        </div>

        {/* Holder name */}
        <div
          style={{
            color: "#ffffff",
            fontSize: "56px",
            fontWeight: 700,
            textAlign: "center",
            marginBottom: "16px",
            lineHeight: 1.1,
          }}
        >
          {holderName}
        </div>

        {/* Course name */}
        <div
          style={{
            color: "#13AECE",
            fontSize: "28px",
            fontWeight: 600,
            textAlign: "center",
            marginBottom: "32px",
          }}
        >
          {courseName}
        </div>

        {/* Issued date */}
        {issuedAt ? (
          <div style={{ color: "#94a3b8", fontSize: "18px", marginBottom: "40px" }}>
            Issued {issuedAt}
          </div>
        ) : null}

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            borderTop: "1px solid rgba(255,255,255,0.1)",
            paddingTop: "24px",
            marginTop: "auto",
          }}
        >
          <span style={{ color: "#64748b", fontSize: "18px" }}>Verified by</span>
          <span style={{ color: "#ffffff", fontSize: "18px", fontWeight: 700 }}>
            MasteringBackend
          </span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
