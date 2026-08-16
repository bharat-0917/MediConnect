-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DoctorProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "specialization" TEXT NOT NULL,
    "qualifications" TEXT NOT NULL,
    "hospitalAffiliation" TEXT NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "bio" TEXT,
    "consultationFee" REAL NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "DoctorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_DoctorProfile" ("bio", "consultationFee", "hospitalAffiliation", "id", "licenseNumber", "qualifications", "specialization", "userId") SELECT "bio", "consultationFee", "hospitalAffiliation", "id", "licenseNumber", "qualifications", "specialization", "userId" FROM "DoctorProfile";
DROP TABLE "DoctorProfile";
ALTER TABLE "new_DoctorProfile" RENAME TO "DoctorProfile";
CREATE UNIQUE INDEX "DoctorProfile_userId_key" ON "DoctorProfile"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
