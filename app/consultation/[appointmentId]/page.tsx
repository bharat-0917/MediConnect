import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ConsultationView from "./ConsultationView";

interface PageProps {
  params: {
    appointmentId: string;
  };
}

export default async function ConsultationPage({ params }: PageProps) {
  const session = await auth();
  const appointmentId = params.appointmentId;

  if (!session || !session.user) {
    redirect("/");
  }

  // Fetch the appointment along with profiles
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      doctor: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      patient: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      consultation: true,
    },
  });

  if (!appointment) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-6 text-center">
        <div className="max-w-md bg-slate-800/40 border border-slate-700/60 p-8 rounded-3xl">
          <h2 className="text-red-400 font-bold text-xl mb-3">Appointment Not Found</h2>
          <p className="text-slate-400">The consultation session you are trying to access does not exist.</p>
        </div>
      </div>
    );
  }

  const userId = session.user.id;
  const userRole = session.user.role;

  let role: "DOCTOR" | "PATIENT";
  const displayName = session.user.name || "User";

  // Access check
  if (userRole === "DOCTOR" && appointment.doctor.user.id === userId) {
    role = "DOCTOR";
  } else if (userRole === "PATIENT" && appointment.patient.user.id === userId) {
    role = "PATIENT";
  } else {
    // Unauthorized access
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-6 text-center">
        <div className="max-w-md bg-slate-800/40 border border-slate-700/60 p-8 rounded-3xl">
          <h2 className="text-red-400 font-bold text-xl mb-3">Access Denied</h2>
          <p className="text-slate-400">You are not authorized to join this consultation room.</p>
        </div>
      </div>
    );
  }

  if (appointment.type !== "VIRTUAL" || !appointment.consultation) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-6 text-center">
        <div className="max-w-md bg-slate-800/40 border border-slate-700/60 p-8 rounded-3xl">
          <h2 className="text-red-400 font-bold text-xl mb-3">Invalid Session Type</h2>
          <p className="text-slate-400">This consultation does not support virtual video calls.</p>
        </div>
      </div>
    );
  }

  const isCompleted = appointment.status === "COMPLETED";

  return (
    <ConsultationView
      appointmentId={appointment.id}
      videoRoomId={appointment.consultation.videoRoomId || ""}
      role={role}
      patientName={appointment.patient.user.name || "Patient"}
      doctorName={appointment.doctor.user.name || "Doctor"}
      reasonForVisit={appointment.reasonForVisit}
      initialNotes={appointment.consultation.doctorNotes}
      isCompleted={isCompleted}
      doctorUserId={role === "DOCTOR" ? userId : undefined}
      displayName={displayName}
    />
  );
}
