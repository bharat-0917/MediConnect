import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT_CHAT = `
You are a professional medical triage nurse for MediConnect. 
Your goal is to understand the patient's symptoms by asking clarifying follow-up questions one at a time.
Guidelines:
1. Act like a triage nurse: ask logical follow-up questions to understand severity, duration, and context of symptoms.
2. Avoid giving any definitive medical diagnosis.
3. Avoid prescribing or recommending any specific medications.
4. If the patient mentions severe warning signs (e.g. chest pain, difficulty breathing, sudden severe headache), immediately advise them to contact emergency services.
5. Keep your responses concise, empathetic, and professional.
`;

const SYSTEM_PROMPT_SUMMARY = `
You are a medical summarization assistant. 
Review the conversation history between a patient describing symptoms and a triage nurse.
Generate a structured medical summary suitable for a doctor to read before an appointment.
Format the summary EXACTLY using the following markdown outline:

### 📋 CLINICAL TRIAGE SUMMARY

*   **CHIEF COMPLAINT**: [Clear description of the main symptom]
*   **DURATION**: [How long the symptoms have been present]
*   **ASSOCIATED SYMPTOMS**: [Bullet points of other symptoms mentioned]
*   **SUGGESTED URGENCY LEVEL**: [Low / Medium / High - with a 1-sentence clinical explanation based on triage guidelines]

Do not include any conversational text or other sections. Keep it highly readable and clean.
`;

interface GeminiContentPart {
  role: string;
  parts: { text: string }[];
}

async function callGemini(systemPrompt: string, contents: GeminiContentPart[]) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY in environment variables");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents,
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
      generationConfig: {
        temperature: 0.2,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Gemini API error details:", errorText);
    throw new Error(`Gemini API failed with status ${response.status}`);
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
    const { messages, conclude } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid messages format" }, { status: 400 });
    }

    // Map messages to Gemini API format
    const contents: GeminiContentPart[] = messages.map((msg: { role: string; content: string }) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));

    if (conclude) {
      // 1. Generate final summary
      const summaryText = await callGemini(SYSTEM_PROMPT_SUMMARY, contents);

      // 2. Fetch patient profile to save the session
      const patient = await prisma.patientProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!patient) {
        return NextResponse.json({ error: "Patient profile not found" }, { status: 404 });
      }

      // 3. Create SymptomCheckSession record
      const checkSession = await prisma.symptomCheckSession.create({
        data: {
          patientId: patient.id,
          conversationLog: JSON.stringify(messages),
          aiSummary: summaryText,
        },
      });

      return NextResponse.json({
        success: true,
        sessionId: checkSession.id,
        summary: summaryText,
      });
    } else {
      // Just continue the chat session
      const reply = await callGemini(SYSTEM_PROMPT_CHAT, contents);
      return NextResponse.json({ reply });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    console.error("Symptom checker API error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
