import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { canDoctorAccessPatient } from "@/lib/access";
import DoctorHealthTrackerView from "./DoctorHealthTrackerView";

interface PageProps {
  params: {
    patientId: string;
  };
}

export default async function DoctorPatientHealthTrackerPage({ params }: PageProps) {
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
            You do not have authorization to view this patient's health tracking charts. An active doctor-patient connection is required.
          </p>
        </div>
      </div>
    );
  }

  // 3. Fetch Patient details along with metrics
  const patient = await prisma.patientProfile.findUnique({
    where: { id: patientId },
    include: {
      user: {
        select: {
          name: true,
        },
      },
      metrics: {
        orderBy: { recordedAt: "asc" },
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

  const parsedGoals = patient.goals ? JSON.parse(patient.goals) : {};

  return (
    <DoctorHealthTrackerView
      patientName={patient.user.name || "Patient"}
      metrics={patient.metrics}
      goals={parsedGoals}
    />
  );
}
