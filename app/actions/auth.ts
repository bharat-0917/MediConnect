"use strict";
"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const doctorSignupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  specialization: z.string().min(2, "Specialization is required"),
  qualifications: z.string().min(2, "Qualifications are required"),
  hospitalAffiliation: z.string().min(2, "Hospital affiliation is required"),
  licenseNumber: z.string().min(2, "License number is required"),
  consultationFee: z.coerce.number().min(0, "Fee must be a positive number"),
  bio: z.string().optional(),
});

const patientSignupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  dateOfBirth: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date of birth",
  }),
  gender: z.string().min(1, "Gender is required"),
  bloodGroup: z.string().optional(),
  emergencyContact: z.string().min(10, "Emergency contact must be at least 10 digits"),
  address: z.string().optional(),
});

export async function registerDoctor(formData: z.infer<typeof doctorSignupSchema>) {
  try {
    const validated = doctorSignupSchema.parse(formData);

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email },
    });

    if (existingUser) {
      return { success: false, error: "Email already registered" };
    }

    // Hash password
    const passwordHash = await bcrypt.hash(validated.password, 10);

    // Create User & DoctorProfile in a transaction
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: validated.name,
          email: validated.email,
          passwordHash,
          role: "DOCTOR",
          phone: validated.phone,
        },
      });

      await tx.doctorProfile.create({
        data: {
          userId: user.id,
          specialization: validated.specialization,
          qualifications: validated.qualifications,
          hospitalAffiliation: validated.hospitalAffiliation,
          licenseNumber: validated.licenseNumber,
          consultationFee: validated.consultationFee,
          bio: validated.bio || null,
          isVerified: false, // Pending verification by default
        },
      });
    });

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    console.error("Doctor registration error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function registerPatient(formData: z.infer<typeof patientSignupSchema>) {
  try {
    const validated = patientSignupSchema.parse(formData);

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email },
    });

    if (existingUser) {
      return { success: false, error: "Email already registered" };
    }

    // Hash password
    const passwordHash = await bcrypt.hash(validated.password, 10);

    // Create User & PatientProfile in a transaction
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: validated.name,
          email: validated.email,
          passwordHash,
          role: "PATIENT",
          phone: validated.phone,
        },
      });

      await tx.patientProfile.create({
        data: {
          userId: user.id,
          dateOfBirth: new Date(validated.dateOfBirth),
          gender: validated.gender,
          bloodGroup: validated.bloodGroup || null,
          emergencyContact: validated.emergencyContact,
          address: validated.address || null,
        },
      });
    });

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    console.error("Patient registration error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
