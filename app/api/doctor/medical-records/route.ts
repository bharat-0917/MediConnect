import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { canDoctorAccessPatient } from "@/lib/access";

// GET /api/doctor/medical-records?patientId=...
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const patientId = searchParams.get("patientId");

  if (!patientId) {
    return NextResponse.json({ error: "patientId is required" }, { status: 400 });
  }

  const doctor = await prisma.doctorProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!doctor) {
    return NextResponse.json({ error: "Doctor profile not found" }, { status: 403 });
  }

  // Check authorization: doctor can view if active connection or verified doctor with walk-in access
  const isConnected = await canDoctorAccessPatient(doctor.id, patientId);
  if (!isConnected && !doctor.isVerified) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const records = await prisma.medicalRecord.findMany({
    where: { patientId },
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
  });

  return NextResponse.json(records);
}

// POST /api/doctor/medical-records
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const doctor = await prisma.doctorProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!doctor) {
    return NextResponse.json({ error: "Only verified doctors can record medical history entries" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { patientId, category, title, description, dateOccurred, status, hospital, attachments } = body;

    if (!patientId || !category || !title || !description || !dateOccurred) {
      return NextResponse.json(
        { error: "patientId, category, title, description, and dateOccurred are required" },
        { status: 400 }
      );
    }

    // Verify patient exists
    const patient = await prisma.patientProfile.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // Create medical record entry
    const newRecord = await prisma.medicalRecord.create({
      data: {
        patientId,
        doctorId: doctor.id,
        category,
        title,
        description,
        dateOccurred: new Date(dateOccurred),
        status: status || "RESOLVED",
        hospital: hospital || null,
        attachments: attachments ? JSON.stringify(attachments) : null,
      },
      include: {
        doctor: {
          include: {
            user: {
              select: { name: true },
            },
          },
        },
      },
    });

    // Also record audit access log
    await prisma.accessLog.create({
      data: {
        doctorId: doctor.id,
        patientId: patient.id,
      },
    });

    return NextResponse.json(newRecord, { status: 201 });
  } catch (err) {
    console.error("Failed to create medical record:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
