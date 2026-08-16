"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { canDoctorAccessPatient } from "@/lib/access";

export async function logHealthMetric(
  patientUserId: string,
  type: "WEIGHT" | "BLOOD_PRESSURE" | "BLOOD_SUGAR" | "SLEEP" | "STEPS" | "HEART_RATE",
  valueObj: Record<string, number | string>
) {
  try {
    const patient = await prisma.patientProfile.findUnique({
      where: { userId: patientUserId },
    });

    if (!patient) {
      return { success: false, error: "Patient profile not found" };
    }

    await prisma.healthMetric.create({
      data: {
        patientId: patient.id,
        type,
        value: JSON.stringify(valueObj),
      },
    });

    revalidatePath("/patient/dashboard/health-tracker");
    return { success: true };
  } catch (error) {
    console.error("Failed to log health metric:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function savePatientGoals(patientUserId: string, goalsObj: Record<string, number | string>) {
  try {
    const patient = await prisma.patientProfile.findUnique({
      where: { userId: patientUserId },
    });

    if (!patient) {
      return { success: false, error: "Patient profile not found" };
    }

    await prisma.patientProfile.update({
      where: { id: patient.id },
      data: {
        goals: JSON.stringify(goalsObj),
      },
    });

    revalidatePath("/patient/dashboard/health-tracker");
    return { success: true };
  } catch (error) {
    console.error("Failed to save patient goals:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

const UIP_SCHEDULE = [
  // Birth
  { name: "BCG", dose: 1, delayDays: 0 },
  { name: "OPV", dose: 0, delayDays: 0 },
  { name: "Hepatitis B", dose: 1, delayDays: 0 },
  // 6 weeks
  { name: "OPV", dose: 1, delayDays: 42 },
  { name: "Pentavalent (DPT + HepB + Hib)", dose: 1, delayDays: 42 },
  { name: "Rotavirus (RVV)", dose: 1, delayDays: 42 },
  { name: "Fractionated IPV (fIPV)", dose: 1, delayDays: 42 },
  { name: "Pneumococcal Conjugate (PCV)", dose: 1, delayDays: 42 },
  // 10 weeks
  { name: "OPV", dose: 2, delayDays: 70 },
  { name: "Pentavalent (DPT + HepB + Hib)", dose: 2, delayDays: 70 },
  { name: "Rotavirus (RVV)", dose: 2, delayDays: 70 },
  // 14 weeks
  { name: "OPV", dose: 3, delayDays: 98 },
  { name: "Pentavalent (DPT + HepB + Hib)", dose: 3, delayDays: 98 },
  { name: "Rotavirus (RVV)", dose: 3, delayDays: 98 },
  { name: "Fractionated IPV (fIPV)", dose: 2, delayDays: 98 },
  { name: "Pneumococcal Conjugate (PCV)", dose: 2, delayDays: 98 },
  // 9 months
  { name: "Measles & Rubella (MR)", dose: 1, delayDays: 270 },
  { name: "JE Vaccine (endemic zones)", dose: 1, delayDays: 270 },
  { name: "Pneumococcal Conjugate Booster", dose: 3, delayDays: 270 },
  { name: "Vitamin A (1st dose)", dose: 1, delayDays: 270 },
  // 16-24 months
  { name: "DPT Booster-1", dose: 1, delayDays: 480 },
  { name: "OPV Booster", dose: 4, delayDays: 480 },
  { name: "Measles & Rubella (MR)", dose: 2, delayDays: 480 },
  { name: "JE Vaccine (endemic zones)", dose: 2, delayDays: 480 },
  { name: "Vitamin A (2nd dose)", dose: 2, delayDays: 480 },
];

export async function createChildProfile(
  parentUserId: string,
  name: string,
  dateOfBirthStr: string,
  gender: string,
  bloodGroup: string | null,
  emergencyContact: string,
  address: string | null
) {
  try {
    const parent = await prisma.user.findUnique({
      where: { id: parentUserId },
    });

    if (!parent) {
      return { success: false, error: "Parent user record not found" };
    }

    const dob = new Date(dateOfBirthStr);
    if (isNaN(dob.getTime())) {
      return { success: false, error: "Invalid date of birth" };
    }

    // Run as a transaction to ensure dependent record and seed vaccines are both inserted
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create a dummy/shadow user record representing the child dependent
      const childEmail = `dependent-${crypto.randomUUID()}@mediconnect.local`;
      const shadowUser = await tx.user.create({
        data: {
          name,
          email: childEmail,
          role: "PATIENT",
        },
      });

      // 2. Create the child's PatientProfile
      const childProfile = await tx.patientProfile.create({
        data: {
          userId: shadowUser.id,
          dateOfBirth: dob,
          gender,
          bloodGroup,
          emergencyContact,
          address,
          guardianUserId: parentUserId,
        },
      });

      // 3. Seed vaccine schedule records
      const vaccineRecordsData = UIP_SCHEDULE.map((v) => {
        const scheduledDate = new Date(dob);
        scheduledDate.setDate(scheduledDate.getDate() + v.delayDays);
        return {
          patientId: childProfile.id,
          vaccineName: v.name,
          doseNumber: v.dose,
          scheduledDate,
          status: "UPCOMING",
        };
      });

      await tx.vaccineRecord.createMany({
        data: vaccineRecordsData,
      });

      return childProfile;
    });

    revalidatePath("/patient/dashboard/vaccine-tracker");
    return { success: true, childProfileId: result.id };
  } catch (error) {
    console.error("Failed to create child profile and seed vaccine schedule:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function administerVaccine(
  doctorUserId: string,
  vaccineRecordId: string,
  administeredDateStr: string
) {
  try {
    const doctor = await prisma.doctorProfile.findUnique({
      where: { userId: doctorUserId },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!doctor) {
      return { success: false, error: "Doctor profile not found" };
    }

    const vaccineRecord = await prisma.vaccineRecord.findUnique({
      where: { id: vaccineRecordId },
    });

    if (!vaccineRecord) {
      return { success: false, error: "Vaccine record not found" };
    }

    // Check doctor-patient connection security gate
    const isAuthorized = await canDoctorAccessPatient(doctor.id, vaccineRecord.patientId);
    if (!isAuthorized) {
      return { success: false, error: "Unauthorized access: no active doctor-patient connection" };
    }

    const administeredDate = new Date(administeredDateStr);
    if (isNaN(administeredDate.getTime())) {
      return { success: false, error: "Invalid administration date" };
    }

    await prisma.vaccineRecord.update({
      where: { id: vaccineRecordId },
      data: {
        status: "COMPLETED",
        administeredDate,
        administeredBy: doctor.user.name || "Doctor",
      },
    });

    revalidatePath("/patient/dashboard/vaccine-tracker");
    return { success: true };
  } catch (error) {
    console.error("Failed to mark vaccine as administered:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

