-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Appointment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "doctorId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "scheduledAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "type" TEXT NOT NULL,
    "reasonForVisit" TEXT NOT NULL,
    "notes" TEXT,
    "symptomCheckSessionId" TEXT,
    CONSTRAINT "Appointment_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "DoctorProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Appointment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "PatientProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Appointment_symptomCheckSessionId_fkey" FOREIGN KEY ("symptomCheckSessionId") REFERENCES "SymptomCheckSession" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Appointment" ("doctorId", "id", "notes", "patientId", "reasonForVisit", "scheduledAt", "status", "type") SELECT "doctorId", "id", "notes", "patientId", "reasonForVisit", "scheduledAt", "status", "type" FROM "Appointment";
DROP TABLE "Appointment";
ALTER TABLE "new_Appointment" RENAME TO "Appointment";
CREATE UNIQUE INDEX "Appointment_symptomCheckSessionId_key" ON "Appointment"("symptomCheckSessionId");
CREATE INDEX "Appointment_doctorId_idx" ON "Appointment"("doctorId");
CREATE INDEX "Appointment_patientId_idx" ON "Appointment"("patientId");
CREATE INDEX "Appointment_symptomCheckSessionId_idx" ON "Appointment"("symptomCheckSessionId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
