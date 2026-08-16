import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  try {
    const doctor = await prisma.doctorProfile.findUnique({
      where: { userId },
    });

    if (!doctor) {
      return NextResponse.json({ error: "Doctor profile not found" }, { status: 404 });
    }

    const slots = await prisma.availableSlot.findMany({
      where: { doctorProfileId: doctor.id },
      orderBy: { start: "asc" },
    });

    return NextResponse.json(slots);
  } catch (error) {
    console.error("Failed to fetch slots:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
