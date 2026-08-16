import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { canDoctorAccessPatient } from "@/lib/access";
import DoctorLabReportsView from "./DoctorLabReportsView";

interface PageProps {
  params: {
    patientId: string;
  };
}

export default async function DoctorPatientLabReportsPage({ params }: PageProps) {
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
          <h2 className="text-rose-700 font-bold text-lg mb-2">Unauthorized Records Access</h2>
          <p className="text-stone-600 text-xs leading-relaxed">
            You do not have authorization to view this patient&apos;s records. You can only view health records of patients with whom you have an active, confirmed consultation slot.
          </p>
        </div>
      </div>
    );
  }

  // 3. Fetch Patient Details
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
      <div className="min-h-screen bg-[#FAF9F5] text-stone-800 flex items-center justify-center p-6 text-center font-sans">
        <div className="max-w-md bg-white border border-stone-200/80 p-8 rounded-3xl shadow-warm-sm">
          <h2 className="text-rose-700 font-bold text-lg mb-2">Patient Not Found</h2>
          <p className="text-stone-600 text-xs">The patient record you requested could not be resolved.</p>
        </div>
      </div>
    );
  }

  // 4. Fetch Lab Reports
  const reports = await prisma.labReport.findMany({
    where: { patientId: patient.id },
    orderBy: { uploadedAt: "desc" },
  });

  return (
    <DoctorLabReportsView
      patientName={patient.user.name || "Patient"}
      reports={reports}
    />
  );
}
