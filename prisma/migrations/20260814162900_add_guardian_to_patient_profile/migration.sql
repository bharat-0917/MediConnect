-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PatientProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "dateOfBirth" DATETIME NOT NULL,
    "gender" TEXT NOT NULL,
    "bloodGroup" TEXT,
    "emergencyContact" TEXT NOT NULL,
    "address" TEXT,
    "goals" TEXT,
    "guardianUserId" TEXT,
    CONSTRAINT "PatientProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PatientProfile_guardianUserId_fkey" FOREIGN KEY ("guardianUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_PatientProfile" ("address", "bloodGroup", "dateOfBirth", "emergencyContact", "gender", "goals", "id", "userId") SELECT "address", "bloodGroup", "dateOfBirth", "emergencyContact", "gender", "goals", "id", "userId" FROM "PatientProfile";
DROP TABLE "PatientProfile";
ALTER TABLE "new_PatientProfile" RENAME TO "PatientProfile";
CREATE UNIQUE INDEX "PatientProfile_userId_key" ON "PatientProfile"("userId");
CREATE INDEX "PatientProfile_guardianUserId_idx" ON "PatientProfile"("guardianUserId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
