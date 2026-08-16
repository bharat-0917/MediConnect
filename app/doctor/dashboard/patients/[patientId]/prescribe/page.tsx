import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { canDoctorAccessPatient } from "@/lib/access";
import PrescribeForm from "./PrescribeForm";

interface PageProps {
  params: {
    patientId: string;
  };
}

export default async function PrescribePage({ params }: PageProps) {
  const session = await auth();
  const patientId = params.patientId;

  if (!session || !session.user) {
    redirect("/");
  }

  // 1. Fetch Doctor Profile
  const doctor = await prisma.doctorProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      user: {
        select: {
          name: true,
        },
      },
    },
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
          <h2 className="text-red-400 font-bold text-xl mb-3">Unauthorized Portal Access</h2>
          <p className="text-slate-400">
            You do not have authorization to prescribe medications to this patient. An active doctor-patient connection is required.
          </p>
        </div>
      </div>
    );
  }

  // 3. Fetch Patient details
  const patient = await prisma.patientProfile.findUnique({
    where: { id: patientId },
    include: {
      user: {
        select: {
          name: true,
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

  // 4. Fetch patient's appointments with this doctor to associate
  const appointments = await prisma.appointment.findMany({
    where: {
      doctorId: doctor.id,
      patientId: patient.id,
    },
    select: {
      id: true,
      scheduledAt: true,
      reasonForVisit: true,
    },
    orderBy: { scheduledAt: "desc" },
  });

  return (
    <PrescribeForm
      patientId={patient.id}
      patientName={patient.user.name || "Patient"}
      doctorName={doctor.user.name || "Doctor"}
      doctorUserId={session.user.id}
      appointments={appointments}
    />
  );
}
