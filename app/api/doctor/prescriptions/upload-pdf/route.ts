import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const prescriptionId = formData.get("prescriptionId") as string;

    if (!file || !prescriptionId) {
      return NextResponse.json({ error: "Missing file or prescriptionId" }, { status: 400 });
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    // 1. Ensure public/prescriptions exists
    const prescriptionsDir = path.join(process.cwd(), "public", "prescriptions");
    await fs.mkdir(prescriptionsDir, { recursive: true });

    // 2. Write file to local disk
    const uniqueFilename = `${prescriptionId}.pdf`;
    const filePath = path.join(prescriptionsDir, uniqueFilename);
    await fs.writeFile(filePath, fileBuffer);

    const pdfUrl = `/prescriptions/${uniqueFilename}`;

    // 3. Update database record
    await prisma.prescription.update({
      where: { id: prescriptionId },
      data: { pdfUrl },
    });

    return NextResponse.json({ success: true, pdfUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    console.error("Prescription PDF upload failed:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
