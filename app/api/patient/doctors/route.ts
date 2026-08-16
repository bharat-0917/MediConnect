import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const verifiedDoctors = await prisma.doctorProfile.findMany({
      where: { isVerified: true },
      select: {
        id: true,
        specialization: true,
        qualifications: true,
        hospitalAffiliation: true,
        consultationFee: true,
        user: {
          select: {
            name: true,
            phone: true,
          },
        },
      },
    });

    return NextResponse.json(verifiedDoctors);
  } catch (error) {
    console.error("Failed to fetch verified doctors:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
