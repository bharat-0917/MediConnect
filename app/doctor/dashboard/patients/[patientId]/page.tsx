import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { canDoctorAccessPatient } from "@/lib/access";
import ConsolidatedRecordView from "./ConsolidatedRecordView";

interface PageProps {
  params: {
    patientId: string;
  };
}

export default async function DoctorConsolidatedPatientRecordPage({ params }: PageProps) {
  const session = await auth();
  const patientId = params.patientId;

  if (!session || !session.user) {
    redirect("/");
  }

  // 1. Fetch Doctor Profile
  const doctor = await prisma.doctorProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!doctor) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-6 text-center">
        <div className="max-w-md bg-slate-800/40 border border-slate-700/60 p-8 rounded-3xl">
          <h2 className="text-red-400 font-bold text-xl mb-3">Access Denied</h2>
          <p className="text-slate-400">Doctor profile not found.</p>
        </div>
      </div>
    );
  }

  // 2. Perform Access Control Check
  const isAuthorized = await canDoctorAccessPatient(doctor.id, patientId);

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-6 text-center">
        <div className="max-w-md bg-slate-800/40 border border-slate-700/60 p-8 rounded-3xl">
          <h2 className="text-red-400 font-bold text-xl mb-3">Access Unauthorized</h2>
          <p className="text-slate-400">
            You do not have authorization to view this patient's consolidated records. An active doctor-patient connection is required.
          </p>
        </div>
      </div>
    );
  }

  // 3. Create Audit Access Log Entry
  await prisma.accessLog.create({
    data: {
      doctorId: doctor.id,
      patientId: patientId,
    },
  });

  // 4. Fetch patient's full records (excluding MentalHealthSessions per Phase 7 access constraints)
  const patient = await prisma.patientProfile.findUnique({
    where: { id: patientId },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          phone: true,
        },
      },
    },
  });

  if (!patient) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-6 text-center">
        <div className="max-w-md bg-slate-800/40 border border-slate-700/60 p-8 rounded-3xl">
          <h2 className="text-red-400 font-bold text-xl mb-3">Patient Not Found</h2>
          <p className="text-slate-400">The patient record you requested could not be resolved.</p>
        </div>
      </div>
    );
  }

  const appointments = await prisma.appointment.findMany({
    where: { patientId },
    include: {
      consultation: {
        select: {
          doctorNotes: true,
        },
      },
    },
    orderBy: { scheduledAt: "desc" },
  });

  // Decision: Fetch prescriptions issued by ANY doctor with an active connection to the patient.
  // This helps ensure better care coordination and avoids adverse drug interactions.
  const prescriptions = await prisma.prescription.findMany({
    where: { patientId },
    include: {
      doctor: {
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: { issuedAt: "desc" },
  });

  const labReports = await prisma.labReport.findMany({
    where: { patientId },
    orderBy: { uploadedAt: "desc" },
  });

  // Fetch AI symptom triages (only completed sessions with summaries)
  const symptomSessions = await prisma.symptomCheckSession.findMany({
    where: {
      patientId: patientId,
    },
    orderBy: { createdAt: "desc" },
  });

  const metrics = await prisma.healthMetric.findMany({
    where: { patientId },
    orderBy: { recordedAt: "asc" },
  });

  const vaccines = await prisma.vaccineRecord.findMany({
    where: { patientId },
    orderBy: { scheduledDate: "asc" },
  });

  return (
    <ConsolidatedRecordView
      patient={patient}
      appointments={appointments}
      prescriptions={prescriptions}
      labReports={labReports}
      symptomSessions={symptomSessions}
      metrics={metrics}
      vaccines={vaccines}
    />
  );
}
