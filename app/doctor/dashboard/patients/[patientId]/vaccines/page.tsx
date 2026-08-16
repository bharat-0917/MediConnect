import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { canDoctorAccessPatient } from "@/lib/access";
import DoctorVaccinesView from "./DoctorVaccinesView";

interface PageProps {
  params: {
    patientId: string;
  };
}

export default async function DoctorPatientVaccinesPage({ params }: PageProps) {
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
      <div className="min-h-screen bg-[#FAF9F5] text-stone-800 flex items-center justify-center p-6 text-center font-sans">
        <div className="max-w-md bg-white border border-stone-200/80 p-8 rounded-3xl shadow-warm-sm">
          <h2 className="text-rose-700 font-bold text-lg mb-2">Access Denied</h2>
          <p className="text-stone-600 text-xs">Doctor profile not found.</p>
        </div>
      </div>
    );
  }

  // 2. Perform Access Control Check
  const isAuthorized = await canDoctorAccessPatient(doctor.id, patientId);

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#FAF9F5] text-stone-800 flex items-center justify-center p-6 text-center font-sans">
        <div className="max-w-md bg-white border border-stone-200/80 p-8 rounded-3xl shadow-warm-sm">
          <h2 className="text-rose-700 font-bold text-lg mb-2">Access Unauthorized</h2>
          <p className="text-stone-600 text-xs leading-relaxed">
            You do not have authorization to view or update this patient&apos;s immunization schedule. An active doctor-patient connection is required.
          </p>
        </div>
      </div>
    );
  }

  // 3. Fetch Patient details along with vaccines
  const patient = await prisma.patientProfile.findUnique({
    where: { id: patientId },
    include: {
      user: {
        select: {
          name: true,
        },
      },
      vaccines: {
        orderBy: { scheduledDate: "asc" },
      },
    },
  });

  if (!patient) {
    return (
      <div className="min-h-screen bg-[#FAF9F5] text-stone-800 flex items-center justify-center p-6 text-center font-sans">
        <div className="max-w-md bg-white border border-stone-200/80 p-8 rounded-3xl shadow-warm-sm">
          <h2 className="text-rose-700 font-bold text-lg mb-2">Patient Not Found</h2>
          <p className="text-stone-600 text-xs">The patient record you requested could not be resolved.</p>
        </div>
      </div>
    );
  }

  return (
    <DoctorVaccinesView
      patientId={patientId}
      patientName={patient.user.name || "Patient"}
      vaccines={patient.vaccines}
      doctorUserId={session.user.id}
    />
  );
}
