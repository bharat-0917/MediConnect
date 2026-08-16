import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const PROMPT_ANALYSIS = `
You are a medical lab report analysis assistant.
Analyze the attached file (PDF or image).
Provide the explanation in two distinct blocks, separated by the exact delimiter '---SEPARATE---'.

Block 1: Plain language summary (markdown format). Explain the report in simple, easy-to-understand terms. Mention what was tested and what the overall findings mean. Add a clear disclaimer that this is for educational context only and is not a diagnosis.
Block 2: A JSON array containing ONLY the abnormal/flagged values. Do not wrap it in markdown code blocks. The JSON array must look exactly like this:
[
  {
    "metric": "Metric Name",
    "value": "Reported Value",
    "range": "Normal Reference Range",
    "status": "High"
  }
]
If there are no anomalies, return an empty array [].

CRITICAL:
- Do NOT prescribe any treatments or medications.
- Do NOT offer a definitive medical diagnosis.
- Keep the language empathetic and professional.
`;

async function callGeminiVision(fileBuffer: Buffer, mimeType: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY in environment variables");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const base64Data = fileBuffer.toString("base64");

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType,
                data: base64Data,
              },
            },
            {
              text: PROMPT_ANALYSIS,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Gemini Vision API error details:", errorText);
    throw new Error(`Gemini Vision API failed with status ${response.status}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const title = formData.get("title") as string || "Lab Report";

    if (!file) {
      return NextResponse.json({ error: "Missing file upload" }, { status: 400 });
    }

    const fileType = file.type;
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];

    if (!allowedTypes.includes(fileType)) {
      return NextResponse.json(
        { error: "Unsupported file format. Please upload a PDF, JPG, or PNG." },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    // 1. Ensure public/uploads exists
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadDir, { recursive: true });

    // 2. Write file to local disk
    const uniqueFilename = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
    const filePath = path.join(uploadDir, uniqueFilename);
    await fs.writeFile(filePath, fileBuffer);

    const fileUrl = `/uploads/${uniqueFilename}`;

    // 3. Invoke Gemini Vision to analyze PDF or Image
    let aiResponse = "";
    try {
      aiResponse = await callGeminiVision(fileBuffer, fileType);
    } catch (err) {
      console.error("Gemini parsing failed:", err);
      aiResponse = "Error: Failed to process report with AI analyzer.---SEPARATE---[]";
    }

    // 4. Parse Gemini response (split at separation token)
    const parts = aiResponse.split("---SEPARATE---");
    const aiSummary = parts[0]?.trim() || "No summary generated.";
    let aiFlaggedAnomalies = parts[1]?.trim() || "[]";

    // Clean up markdown block wraps if Gemini ignored the instruction
    if (aiFlaggedAnomalies.startsWith("```json")) {
      aiFlaggedAnomalies = aiFlaggedAnomalies.replace(/^```json/, "").replace(/```$/, "").trim();
    } else if (aiFlaggedAnomalies.startsWith("```")) {
      aiFlaggedAnomalies = aiFlaggedAnomalies.replace(/^```/, "").replace(/```$/, "").trim();
    }

    // Validate JSON structure
    try {
      JSON.parse(aiFlaggedAnomalies);
    } catch {
      aiFlaggedAnomalies = "[]";
    }

    // 5. Save report to DB under patient profile
    const patient = await prisma.patientProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!patient) {
      return NextResponse.json({ error: "Patient profile not found" }, { status: 404 });
    }

    const report = await prisma.labReport.create({
      data: {
        patientId: patient.id,
        uploadedByUserId: session.user.id,
        title,
        fileUrl,
        fileType,
        aiSummary,
        aiFlaggedAnomalies,
      },
    });

    return NextResponse.json({ success: true, report });
  } catch (error: any) {
    console.error("Lab report upload failed:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
