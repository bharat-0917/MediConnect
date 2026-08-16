import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  try {
    const doctorProfile = await prisma.doctorProfile.findUnique({
      where: { userId },
      select: { isVerified: true },
    });

    if (!doctorProfile) {
      return NextResponse.json({ error: "Doctor profile not found" }, { status: 404 });
    }

    return NextResponse.json({ isVerified: doctorProfile.isVerified });
  } catch (error) {
    console.error("Failed to fetch verification status:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
