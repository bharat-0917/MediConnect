import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const dependents = await prisma.patientProfile.findMany({
      where: { guardianUserId: session.user.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        vaccines: {
          orderBy: { scheduledDate: "asc" },
        },
      },
    });

    return NextResponse.json(dependents);
  } catch (error) {
    console.error("Failed to fetch dependents and vaccine records:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
