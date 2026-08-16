-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_LabReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "uploadedByUserId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Lab Report',
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "aiSummary" TEXT,
    "aiFlaggedAnomalies" TEXT,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LabReport_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "PatientProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LabReport_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_LabReport" ("aiFlaggedAnomalies", "aiSummary", "fileType", "fileUrl", "id", "patientId", "uploadedAt", "uploadedByUserId") SELECT "aiFlaggedAnomalies", "aiSummary", "fileType", "fileUrl", "id", "patientId", "uploadedAt", "uploadedByUserId" FROM "LabReport";
DROP TABLE "LabReport";
ALTER TABLE "new_LabReport" RENAME TO "LabReport";
CREATE INDEX "LabReport_patientId_idx" ON "LabReport"("patientId");
CREATE INDEX "LabReport_uploadedByUserId_idx" ON "LabReport"("uploadedByUserId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
