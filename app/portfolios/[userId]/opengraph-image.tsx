import { ImageResponse } from "next/og";
import { fetchPublicPortfolio } from "@/lib/server-portfolio";

// nodejs (not edge): the portfolio API base (NEXT_PUBLIC_API_URL) may point at an
// internal/non-edge-reachable host, and `next/og` runs fine under nodejs. This is
// the robust choice for server-fetch + image generation here.
export const runtime = "nodejs";
export const alt = "Developer Portfolio — MasteringBackend";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const NAVY = "#0E1F33";
const TEAL = "#13AECE";

export default async function OpengraphImage({
  params,
}: {
  params: { userId: string };
}) {
  const { userId } = params;
  const portfolio = await fetchPublicPortfolio(userId);

  // Branded fallback when the portfolio can't be fetched.
  if (!portfolio) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: NAVY,
            color: "#ffffff",
            fontFamily: "sans-serif",
          }}
        >
          <div
            style={{
              fontSize: 56,
              fontWeight: 800,
              letterSpacing: "-0.02em",
            }}
          >
            <span style={{ color: TEAL }}>Mastering</span>Backend
          </div>
          <div style={{ fontSize: 30, color: "rgba(255,255,255,0.6)", marginTop: 16 }}>
            Developer Portfolio
          </div>
        </div>
      ),
      { ...size },
    );
  }

  const { user, stats } = portfolio;
  const name = user.name || "Developer";
  const title = user.title || "Backend Engineer";
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const verified = Boolean(user.isVerified);

  const statPills: Array<{ value: string; label: string }> = [
    { value: String(stats.totalProjects ?? 0), label: "Projects" },
    { value: String(stats.coursesCompleted ?? 0), label: "Courses" },
    { value: String(stats.certificates ?? 0), label: "Certificates" },
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: NAVY,
          color: "#ffffff",
          fontFamily: "sans-serif",
          padding: 72,
          justifyContent: "space-between",
        }}
      >
        {/* Brand row */}
        <div style={{ display: "flex", alignItems: "center", fontSize: 28, fontWeight: 700 }}>
          <span style={{ color: TEAL }}>Mastering</span>
          <span>Backend</span>
          <span style={{ color: "rgba(255,255,255,0.4)", marginLeft: 16, fontWeight: 500 }}>
            · Developer Portfolio
          </span>
        </div>

        {/* Identity */}
        <div style={{ display: "flex", alignItems: "center" }}>
          {user.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatar}
              width={180}
              height={180}
              alt={name}
              style={{
                width: 180,
                height: 180,
                borderRadius: 90,
                border: `4px solid ${TEAL}`,
                objectFit: "cover",
              }}
            />
          ) : (
            <div
              style={{
                width: 180,
                height: 180,
                borderRadius: 90,
                border: `4px solid ${TEAL}`,
                background: "rgba(19,174,206,0.15)",
                color: TEAL,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 72,
                fontWeight: 800,
              }}
            >
              {initials}
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", marginLeft: 48 }}>
            <div style={{ display: "flex", alignItems: "center", fontSize: 64, fontWeight: 800 }}>
              {name}
              {verified && (
                <span
                  style={{
                    marginLeft: 20,
                    fontSize: 26,
                    color: TEAL,
                    border: `2px solid ${TEAL}`,
                    borderRadius: 999,
                    padding: "4px 18px",
                  }}
                >
                  ✓ Verified
                </span>
              )}
            </div>
            <div style={{ fontSize: 34, color: "rgba(255,255,255,0.65)", marginTop: 8 }}>
              {title}
            </div>
          </div>
        </div>

        {/* Credibility stats */}
        <div style={{ display: "flex", gap: 24 }}>
          {statPills.map((s) => (
            <div
              key={s.label}
              style={{
                display: "flex",
                flexDirection: "column",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 20,
                padding: "20px 36px",
              }}
            >
              <span style={{ fontSize: 48, fontWeight: 800, color: TEAL }}>{s.value}</span>
              <span style={{ fontSize: 24, color: "rgba(255,255,255,0.5)" }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
