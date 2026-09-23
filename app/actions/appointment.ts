"use strict";
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { canDoctorAccessPatient } from "@/lib/access";

// Availability Actions
export async function createAvailableSlot(
  doctorUserId: string,
  startStr: string,
  endStr: string
) {
  try {
    const doctor = await prisma.doctorProfile.findUnique({
      where: { userId: doctorUserId },
    });

    if (!doctor) {
      return { success: false, error: "Doctor profile not found" };
    }

    const start = new Date(startStr);
    const end = new Date(endStr);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return { success: false, error: "Invalid date format" };
    }

    if (start >= end) {
      return { success: false, error: "Start time must be before end time" };
    }

    await prisma.availableSlot.create({
      data: {
        doctorProfileId: doctor.id,
        start,
        end,
        isBooked: false,
      },
    });

    revalidatePath("/doctor/availability");
    revalidatePath("/patient/dashboard/find-doctor");
    revalidatePath("/patient/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Failed to create available slot:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function deleteAvailableSlot(doctorUserId: string, slotId: string) {
  try {
    const doctor = await prisma.doctorProfile.findUnique({
      where: { userId: doctorUserId },
    });

    if (!doctor) {
      return { success: false, error: "Doctor profile not found" };
    }

    const slot = await prisma.availableSlot.findUnique({
      where: { id: slotId },
    });

    if (!slot || slot.doctorProfileId !== doctor.id) {
      return { success: false, error: "Slot not found" };
    }

    if (slot.isBooked) {
      return { success: false, error: "Cannot delete a booked slot" };
    }

    await prisma.availableSlot.delete({
      where: { id: slotId },
    });

    revalidatePath("/doctor/availability");
    revalidatePath("/patient/dashboard/find-doctor");
    revalidatePath("/patient/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete available slot:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// Booking Actions
export async function bookAppointment(
  patientUserId: string,
  doctorProfileId: string,
  slotId: string,
  reasonForVisit: string,
  type: string,
  symptomSessionId?: string
) {
  try {
    const patient = await prisma.patientProfile.findUnique({
      where: { userId: patientUserId },
    });

    if (!patient) {
      return { success: false, error: "Patient profile not found" };
    }

    const slot = await prisma.availableSlot.findUnique({
      where: { id: slotId },
    });

    if (!slot || slot.doctorProfileId !== doctorProfileId || slot.isBooked) {
      return { success: false, error: "Selected slot is unavailable" };
    }

    await prisma.$transaction(async (tx) => {
      // 1. Mark slot as booked
      await tx.availableSlot.update({
        where: { id: slotId },
        data: { isBooked: true },
      });

      // 2. Create appointment
      await tx.appointment.create({
        data: {
          doctorId: doctorProfileId,
          patientId: patient.id,
          scheduledAt: slot.start,
          status: "REQUESTED",
          type,
          reasonForVisit,
          symptomCheckSessionId: symptomSessionId || null,
        },
      });

      // 3. Establish or check connection
      const connection = await tx.doctorPatientConnection.findUnique({
        where: {
          doctorId_patientId: {
            doctorId: doctorProfileId,
            patientId: patient.id,
          },
        },
      });

      if (!connection) {
        await tx.doctorPatientConnection.create({
          data: {
            doctorId: doctorProfileId,
            patientId: patient.id,
            status: "PENDING",
          },
        });
      }
    });

    revalidatePath("/patient/dashboard/find-doctor");
    return { success: true };
  } catch (error) {
    console.error("Failed to book appointment:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// Doctor Management Actions
export async function acceptAppointment(doctorUserId: string, appointmentId: string) {
  try {
    const doctor = await prisma.doctorProfile.findUnique({
      where: { userId: doctorUserId },
    });

    if (!doctor) {
      return { success: false, error: "Doctor profile not found" };
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment || appointment.doctorId !== doctor.id) {
      return { success: false, error: "Appointment not found" };
    }

    await prisma.$transaction(async (tx) => {
      // 1. Confirm appointment
      await tx.appointment.update({
        where: { id: appointmentId },
        data: { status: "CONFIRMED" },
      });

      // 2. Update connection to ACTIVE
      await tx.doctorPatientConnection.update({
        where: {
          doctorId_patientId: {
            doctorId: doctor.id,
            patientId: appointment.patientId,
          },
        },
        data: { status: "ACTIVE" },
      });

      // 3. Create consultation if virtual
      if (appointment.type === "VIRTUAL") {
        const roomUrl = `https://meet.jit.si/mediconnect-${appointmentId}`;
        await tx.consultation.create({
          data: {
            appointmentId: appointmentId,
            videoRoomId: roomUrl,
          },
        });
      }
    });

    revalidatePath("/doctor/dashboard/appointments");
    return { success: true };
  } catch (error) {
    console.error("Failed to accept appointment:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function declineAppointment(doctorUserId: string, appointmentId: string) {
  try {
    const doctor = await prisma.doctorProfile.findUnique({
      where: { userId: doctorUserId },
    });

    if (!doctor) {
      return { success: false, error: "Doctor profile not found" };
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment || appointment.doctorId !== doctor.id) {
      return { success: false, error: "Appointment not found" };
    }

    await prisma.$transaction(async (tx) => {
      // 1. Cancel appointment
      await tx.appointment.update({
        where: { id: appointmentId },
        data: { status: "CANCELLED" },
      });

      // 2. Free up the slot if we can match by scheduledAt
      const slot = await tx.availableSlot.findFirst({
        where: {
          doctorProfileId: doctor.id,
          start: appointment.scheduledAt,
          isBooked: true,
        },
      });

      if (slot) {
        await tx.availableSlot.update({
          where: { id: slot.id },
          data: { isBooked: false },
        });
      }

      // 3. Keep or modify connection. If no other active appointments, we can keep PENDING or remove
      // The prompt says: "connection stays PENDING/gets removed". We'll update connection to PENDING.
      const otherAppointments = await tx.appointment.findFirst({
        where: {
          doctorId: doctor.id,
          patientId: appointment.patientId,
          status: "CONFIRMED",
          id: { not: appointmentId },
        },
      });

      if (!otherAppointments) {
        await tx.doctorPatientConnection.update({
          where: {
            doctorId_patientId: {
              doctorId: doctor.id,
              patientId: appointment.patientId,
            },
          },
          data: { status: "PENDING" },
        });
      }
    });

    revalidatePath("/doctor/dashboard/appointments");
    return { success: true };
  } catch (error) {
    console.error("Failed to decline appointment:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function saveConsultationNotes(
  doctorUserId: string,
  appointmentId: string,
  notes: string
) {
  try {
    const doctor = await prisma.doctorProfile.findUnique({
      where: { userId: doctorUserId },
    });

    if (!doctor) {
      return { success: false, error: "Doctor profile not found" };
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment || appointment.doctorId !== doctor.id) {
      return { success: false, error: "Appointment not found" };
    }

    await prisma.$transaction(async (tx) => {
      // 1. Upsert Consultation record with notes and end timestamp (works for both VIRTUAL and IN_PERSON)
      await tx.consultation.upsert({
        where: { appointmentId },
        update: {
          doctorNotes: notes,
          endedAt: new Date(),
        },
        create: {
          appointmentId: appointmentId,
          doctorNotes: notes,
          startedAt: new Date(),
          endedAt: new Date(),
        },
      });

      // 2. Mark Appointment as COMPLETED
      await tx.appointment.update({
        where: { id: appointmentId },
        data: {
          status: "COMPLETED",
        },
      });
    });

    revalidatePath(`/consultation/${appointmentId}`);
    revalidatePath("/doctor/dashboard/appointments");
    revalidatePath(`/doctor/dashboard/patients/${appointment.patientId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to save consultation notes:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function createPrescription(
  doctorUserId: string,
  patientId: string,
  appointmentId: string | null,
  medications: Array<{ name: string; dosage: string; frequency: string; duration: string }>
) {
  try {
    const doctor = await prisma.doctorProfile.findUnique({
      where: { userId: doctorUserId },
    });

    if (!doctor) {
      return { success: false, error: "Doctor profile not found" };
    }

    // Check relationship access
    const isAuthorized = await canDoctorAccessPatient(doctor.id, patientId);
    if (!isAuthorized) {
      return { success: false, error: "Unauthorized access: no active doctor-patient connection" };
    }

    const prescription = await prisma.prescription.create({
      data: {
        doctorId: doctor.id,
        patientId,
        appointmentId: appointmentId || null,
        medicines: JSON.stringify(medications),
      },
    });

    revalidatePath(`/doctor/dashboard/patients/${patientId}/prescribe`);
    return { success: true, prescriptionId: prescription.id };
  } catch (error) {
    console.error("Failed to create prescription:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}


