import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const patient = await prisma.patientProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        metrics: {
          orderBy: { recordedAt: "asc" },
        },
      },
    });

    if (!patient) {
      return NextResponse.json({ error: "Patient profile not found" }, { status: 404 });
    }

    return NextResponse.json({
      metrics: patient.metrics,
      goals: patient.goals ? JSON.parse(patient.goals) : {},
    });
  } catch (error) {
    console.error("Failed to fetch health metrics:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
