import { type NextRequest, NextResponse } from "next/server";
// import jwt from "jsonwebtoken"

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as any

    // Mock user data - in production, fetch from database
    const userData = {
      id: 1,
      name: "Solomon Eseme",
      email: "test@test.com",
      avatar: "/placeholder.svg?height=40&width=40",
      level: 8,
      xp: 2450,
      xpToNextLevel: 3200,
      streak: 7,
      joinDate: "2024-01-15",
      title: "Backend Engineer",
      badges: [
        {
          id: "1",
          name: "API Master",
          description: "Completed 10 API projects",
          icon: "🏆",
          earnedDate: "2024-06-01",
          rarity: "Epic",
        },
      ],
    };

    return NextResponse.json({ user: userData });
  } catch (error) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}
