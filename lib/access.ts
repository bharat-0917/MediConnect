import { prisma } from "./prisma";

/**
 * Access control helper to verify if a doctor has authorization to view a patient's records.
 * A doctor is only authorized if there is an ACTIVE connection in the database.
 * 
 * @param doctorId The ID of the DoctorProfile
 * @param patientId The ID of the PatientProfile
 * @returns Promise<boolean> True if the connection exists and status is ACTIVE
 */
export async function canDoctorAccessPatient(doctorId: string, patientId: string): Promise<boolean> {
  if (!doctorId || !patientId) return false;

  try {
    const connection = await prisma.doctorPatientConnection.findUnique({
      where: {
        doctorId_patientId: {
          doctorId,
          patientId,
        },
      },
    });

    return connection?.status === "ACTIVE";
  } catch (error) {
    console.error("Error checking doctor patient connection:", error);
    return false;
  }
}
