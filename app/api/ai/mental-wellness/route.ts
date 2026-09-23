import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import {
  callGeminiSafe,
  generateLocalWellnessReply,
  GeminiContentPart,
} from "@/lib/gemini";

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

    const contents: GeminiContentPart[] = messages.map((msg: { role: string; content: string }) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));

    // Try Gemini API first, fallback to supportive local wellness engine
    let reply = await callGeminiSafe(SYSTEM_PROMPT_WELLNESS, contents, {
      temperature: 0.4,
      maxOutputTokens: 300,
      timeoutMs: 5000,
    });

    if (!reply) {
      reply = generateLocalWellnessReply(messages);
    }

    const completeMessages = [...messages, { role: "model", content: reply }];

    // Fetch patient profile to save the session
    const patient = await prisma.patientProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!patient) {
      return NextResponse.json({ error: "Patient profile not found" }, { status: 404 });
    }

    let activeSessionId = sessionId;

    if (activeSessionId) {
      await prisma.mentalHealthSession.update({
        where: { id: activeSessionId },
        data: {
          conversationLog: JSON.stringify(completeMessages),
        },
      });
    } else {
      const newSession = await prisma.mentalHealthSession.create({
        data: {
          patientId: patient.id,
          conversationLog: JSON.stringify(completeMessages),
        },
      });
      activeSessionId = newSession.id;
    }

    return NextResponse.json({ reply, sessionId: activeSessionId });
  } catch (error) {
    console.error("Mental wellness API error:", error);
    try {
      const { messages } = await request.json();
      const fallbackReply = generateLocalWellnessReply(messages || []);
      return NextResponse.json({ reply: fallbackReply });
    } catch {
      return NextResponse.json(
        { error: "An unexpected error occurred. Please try again." },
        { status: 500 }
      );
    }
  }
}
