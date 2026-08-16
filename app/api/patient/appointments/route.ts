import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  try {
    const patient = await prisma.patientProfile.findUnique({
      where: { userId },
    });

    if (!patient) {
      return NextResponse.json({ error: "Patient profile not found" }, { status: 404 });
    }

    const appointments = await prisma.appointment.findMany({
      where: { patientId: patient.id },
      include: {
        doctor: {
          include: {
            user: {
              select: {
                name: true,
                phone: true,
              },
            },
          },
        },
      },
      orderBy: { scheduledAt: "asc" },
    });

    return NextResponse.json(appointments);
  } catch (error) {
    console.error("Failed to fetch patient appointments:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
