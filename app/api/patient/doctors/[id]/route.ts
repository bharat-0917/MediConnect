import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const doctorId = params.id;

  if (!doctorId) {
    return NextResponse.json({ error: "Missing doctor id" }, { status: 400 });
  }

  try {
    const doctor = await prisma.doctorProfile.findUnique({
      where: { id: doctorId },
      include: {
        user: {
          select: {
            name: true,
            phone: true,
          },
        },
      },
    });

    if (!doctor || !doctor.isVerified) {
      return NextResponse.json({ error: "Doctor profile not found" }, { status: 404 });
    }

    const slots = await prisma.availableSlot.findMany({
      where: {
        doctorProfileId: doctor.id,
        isBooked: false,
        start: {
          gt: new Date(), // Only upcoming slots
        },
      },
      orderBy: { start: "asc" },
    });

    return NextResponse.json({ doctor, slots });
  } catch (error) {
    console.error("Failed to fetch doctor profile detail:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
