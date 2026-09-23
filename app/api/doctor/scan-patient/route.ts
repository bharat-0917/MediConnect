import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/doctor/scan-patient?patientId=<id>
 * 
 * Called when a doctor scans a patient's QR code.
 * Unlike the normal consolidated view, this allows walk-in access:
 *  - The doctor must be verified
 *  - An audit access log is always created
 *  - No prior doctor-patient connection is required (walk-in consultation)
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const patientId = searchParams.get("patientId");

  if (!patientId) {
    return NextResponse.json({ error: "Missing patientId" }, { status: 400 });
  }

  // Fetch doctor profile and verify it exists + is verified
  const doctor = await prisma.doctorProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!doctor) {
    return NextResponse.json({ error: "Doctor profile not found" }, { status: 403 });
  }

  if (!doctor.isVerified) {
    return NextResponse.json({ error: "Your account is pending verification. QR scan access requires a verified practitioner badge." }, { status: 403 });
  }

  // Fetch the patient's full record
  const patient = await prisma.patientProfile.findUnique({
    where: { id: patientId },
    include: {
      user: {
        select: { name: true, email: true, phone: true },
      },
    },
  });

  if (!patient) {
    return NextResponse.json({ error: "Patient not found. The QR code may be invalid or expired." }, { status: 404 });
  }

  // Log the access (audit trail — always)
  await prisma.accessLog.create({
    data: {
      doctorId: doctor.id,
      patientId: patient.id,
    },
  });

  // Fetch all clinical data
  const [appointments, prescriptions, labReports, symptomSessions, metrics, vaccines] =
    await Promise.all([
      prisma.appointment.findMany({
        where: { patientId: patient.id },
        include: {
          consultation: { select: { doctorNotes: true } },
        },
        orderBy: { scheduledAt: "desc" },
      }),
      prisma.prescription.findMany({
        where: { patientId: patient.id },
        include: {
          doctor: {
            include: { user: { select: { name: true } } },
          },
        },
        orderBy: { issuedAt: "desc" },
      }),
      prisma.labReport.findMany({
        where: { patientId: patient.id },
        orderBy: { uploadedAt: "desc" },
      }),
      prisma.symptomCheckSession.findMany({
        where: { patientId: patient.id },
        orderBy: { createdAt: "desc" },
      }),
      prisma.healthMetric.findMany({
        where: { patientId: patient.id },
        orderBy: { recordedAt: "asc" },
      }),
      prisma.vaccineRecord.findMany({
        where: { patientId: patient.id },
        orderBy: { scheduledDate: "asc" },
      }),
    ]);

  return NextResponse.json({
    patient,
    appointments,
    prescriptions,
    labReports,
    symptomSessions,
    metrics,
    vaccines,
  });
}
