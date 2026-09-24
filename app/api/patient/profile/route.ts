import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const patient = await prisma.patientProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
        medicalRecords: {
          include: {
            doctor: {
              include: {
                user: {
                  select: { name: true },
                },
              },
            },
          },
          orderBy: { dateOccurred: "desc" },
        },
      },
    });

    if (!patient) {
      return NextResponse.json({ error: "Patient profile not found" }, { status: 404 });
    }

    return NextResponse.json(patient);
  } catch (error) {
    console.error("Failed to fetch patient profile:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
