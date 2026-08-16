import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT_WELLNESS = `
You are a supportive, non-judgmental wellness listener for MediConnect. 
Your goal is to provide a safe, empathetic, and encouraging space for patients to share their thoughts, manage stress, and explore wellness strategies.

CRITICAL RULES:
1. YOU ARE NOT A CLINICAL DIAGNOSTIC TOOL OR THERAPIST. Never diagnose psychiatric conditions, label mental disorders, or prescribe treatments or therapy regimens.
2. CRISIS PROTOCOL: If the patient mentions self-harm, suicide, harming themselves or others, or exhibits severe crisis indicators:
   - IMMEDIATELY stop normal conversational responses.
   - Respond calmly, warmly, and directly.
   - Provide immediate crisis contact information:
     "It sounds like you are going through a very difficult time. Please know you are not alone and there is support available. 
     If you are in immediate danger, call your local emergency services (like 911 or 112) or go to the nearest emergency room.
     For free, confidential support 24/7, you can reach the Suicide & Crisis Lifeline by calling or texting 988 (US & Canada), or text HOME to 741741 to connect with the Crisis Text Line."
   - Refuse to analyze or debate their self-harm intentions; keep safety resources at the center of your reply.
3. Keep conversational responses warm, concise, and focused on supportive listening, mindfulness, general coping strategies (e.g. deep breathing, physical movement), and encouraging them to reach out to professional therapists if needed.
`;

async function callGemini(systemPrompt: string, contents: any[]) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY in environment variables");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

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
        temperature: 0.5,
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
    const { messages, sessionId } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid messages format" }, { status: 400 });
    }

    // Map messages to Gemini API format
    const contents = messages.map((msg: any) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));

    // 1. Fetch AI response
    const reply = await callGemini(SYSTEM_PROMPT_WELLNESS, contents);

    // Append AI response to messages array to write to DB
    const completeMessages = [...messages, { role: "model", content: reply }];

    // 2. Fetch patient profile to save the session
    const patient = await prisma.patientProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!patient) {
      return NextResponse.json({ error: "Patient profile not found" }, { status: 404 });
    }

    let activeSessionId = sessionId;

    if (activeSessionId) {
      // Update existing session
      await prisma.mentalHealthSession.update({
        where: { id: activeSessionId },
        data: {
          conversationLog: JSON.stringify(completeMessages),
        },
      });
    } else {
      // Create new session
      const newSession = await prisma.mentalHealthSession.create({
        data: {
          patientId: patient.id,
          conversationLog: JSON.stringify(completeMessages),
        },
      });
      activeSessionId = newSession.id;
    }

    return NextResponse.json({ reply, sessionId: activeSessionId });
  } catch (error: any) {
    console.error("Mental wellness API error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
