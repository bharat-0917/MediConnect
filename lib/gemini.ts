import dns from "dns";

try {
  dns.setDefaultResultOrder("ipv4first");
} catch {
  // Ignored if already configured or unsupported in environment
}

export interface GeminiContentPart {
  role: string;
  parts: { text: string }[];
}

export interface CallGeminiOptions {
  temperature?: number;
  maxOutputTokens?: number;
  timeoutMs?: number;
}

const CANDIDATE_MODELS = [
  "gemini-3.5-flash",
  "gemini-3.6-flash",
  "gemma-4-26b-a4b-it",
  "gemini-flash-latest",
];

export async function callGeminiSafe(
  systemPrompt: string,
  contents: GeminiContentPart[],
  options: CallGeminiOptions = {}
): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("Missing GEMINI_API_KEY in environment variables");
    return null;
  }

  const timeoutMs = options.timeoutMs || 8000; // 8s timeout per attempt

  for (const model of CANDIDATE_MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const payload: Record<string, unknown> = {
        contents,
        generationConfig: {
          temperature: options.temperature ?? 0.2,
          maxOutputTokens: options.maxOutputTokens ?? 600,
        },
      };

      if (systemPrompt && !model.startsWith("gemma-")) {
        payload.systemInstruction = {
          parts: [{ text: systemPrompt }],
        };
      }

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify(payload),
      });
      clearTimeout(timer);

      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text && typeof text === "string" && text.trim().length > 0) {
          return text.trim();
        }
      } else {
        const errText = await res.text();
        console.warn(`[Gemini API] Model ${model} returned status ${res.status}:`, errText.slice(0, 120));
      }
    } catch (err: unknown) {
      clearTimeout(timer);
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[Gemini API] Model ${model} request failed:`, msg);
    }
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Clinical Rule-Based Triage Engine (Fallback when cloud AI is overloaded)
// ─────────────────────────────────────────────────────────────────────────────

export function generateLocalTriageReply(
  messages: Array<{ role: string; content: string }>
): string {
  const userMessages = messages.filter((m) => m.role === "user").map((m) => m.content.toLowerCase());
  const allUserText = userMessages.join(" ");
  const turnCount = userMessages.length;

  // 1. Red flag emergency check
  if (
    allUserText.includes("chest pain") ||
    allUserText.includes("cant breathe") ||
    allUserText.includes("difficulty breathing") ||
    allUserText.includes("shortness of breath") ||
    allUserText.includes("unconscious") ||
    allUserText.includes("severe bleeding")
  ) {
    return "🚨 **Urgent Safety Notice**: The symptoms you described could indicate a serious medical emergency. Please seek immediate medical care by calling emergency services (such as 112 / 911) or visit the nearest emergency department right away.";
  }

  // 2. Assess fever / temperature
  const hasFeverKeywords = allUserText.includes("hot") || allUserText.includes("fever") || allUserText.includes("temperature") || allUserText.includes("chills");
  const hasDuration = allUserText.includes("day") || allUserText.includes("week") || allUserText.includes("hour") || allUserText.includes("yesterday") || allUserText.includes("since");
  const hasPain = allUserText.includes("pain") || allUserText.includes("ache") || allUserText.includes("hurt") || allUserText.includes("sore");

  if (turnCount === 1) {
    if (!hasDuration) {
      return "I understand you are experiencing these symptoms. To help me triage accurately, approximately how many days or hours have you had them?";
    }
    return "Thank you for letting me know. On a scale of 1 to 10 (where 10 is severe), how intense do these symptoms feel right now?";
  }

  if (turnCount === 2) {
    if (hasFeverKeywords && !allUserText.includes("°") && !allUserText.includes("degree")) {
      return "Have you measured your body temperature with a thermometer? Also, are you having any shortness of breath or chest discomfort?";
    }
    if (hasPain) {
      return "Is the pain constant or does it come and go? Have you noticed any other symptoms like nausea, dizziness, or fatigue?";
    }
    return "Are you experiencing any other associated symptoms, such as sore throat, body aches, nausea, or headache?";
  }

  if (turnCount === 3) {
    return "Have you taken any over-the-counter remedies or medications yet? And do you have any pre-existing medical conditions (like asthma, diabetes, or hypertension)?";
  }

  return "Thank you for providing these details. I have enough information to prepare your triage summary. Whenever you're ready, click the 'Conclude & Compile Doctor Summary' button below to generate the report for your doctor.";
}

export function generateLocalTriageSummary(
  messages: Array<{ role: string; content: string }>
): string {
  const userMessages = messages.filter((m) => m.role === "user").map((m) => m.content);
  const firstMessage = userMessages[0] || "Symptoms reported by patient";
  const allUserText = userMessages.join(" ").toLowerCase();

  // Extract duration
  let duration = "Reported during consultation (approx. 1–3 days)";
  const durationMatch = allUserText.match(/(\d+\s*(?:days?|hours?|weeks?|months?))/i);
  if (durationMatch) {
    duration = durationMatch[1];
  } else if (allUserText.includes("yesterday")) {
    duration = "Since yesterday";
  } else if (allUserText.includes("today")) {
    duration = "Started today";
  }

  // Extract associated symptoms
  const associated: string[] = [];
  if (allUserText.includes("cough")) associated.push("Cough present");
  if (allUserText.includes("nose") || allUserText.includes("cold") || allUserText.includes("congestion") || allUserText.includes("runny") || allUserText.includes("watery")) associated.push("Rhinorrhea / nasal congestion");
  if (allUserText.includes("fever") || allUserText.includes("hot") || allUserText.includes("temp") || allUserText.includes("chills")) associated.push("Subjective fever / elevated body warmth");
  if (allUserText.includes("throat") || allUserText.includes("sore throat")) associated.push("Sore throat / pharyngeal irritation");
  if (allUserText.includes("headache") || allUserText.includes("head pain")) associated.push("Headache");
  if (allUserText.includes("body ache") || allUserText.includes("fatigue") || allUserText.includes("tired")) associated.push("General fatigue / malaise / body aches");
  if (allUserText.includes("nausea") || allUserText.includes("vomit")) associated.push("Gastrointestinal symptoms (nausea / vomiting)");

  if (associated.length === 0) {
    associated.push(firstMessage);
  }

  // Urgency classification
  let urgency = "Medium - Symptoms are symptomatic and require clinical correlation by a medical professional.";
  if (
    allUserText.includes("chest pain") ||
    allUserText.includes("breathing") ||
    allUserText.includes("breath") ||
    allUserText.includes("severe") ||
    allUserText.includes("high fever") ||
    allUserText.includes("103") ||
    allUserText.includes("104")
  ) {
    urgency = "High - Acute or respiratory symptoms reported. Expedited physician evaluation recommended.";
  } else if (
    !allUserText.includes("fever") &&
    !allUserText.includes("pain") &&
    (allUserText.includes("mild") || allUserText.includes("minor"))
  ) {
    urgency = "Low - Mild presentation. Standard non-emergency outpatient consultation recommended.";
  }

  return `### 📋 CLINICAL TRIAGE SUMMARY

*   **CHIEF COMPLAINT**: ${firstMessage}
*   **DURATION**: ${duration}
*   **ASSOCIATED SYMPTOMS**:
${associated.map((s) => `    - ${s}`).join("\n")}
*   **SUGGESTED URGENCY LEVEL**: ${urgency}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Mental Wellness Supportive Listener Fallback
// ─────────────────────────────────────────────────────────────────────────────

export function generateLocalWellnessReply(
  messages: Array<{ role: string; content: string }>
): string {
  const userMessages = messages.filter((m) => m.role === "user").map((m) => m.content.toLowerCase());
  const latestMessage = userMessages[userMessages.length - 1] || "";
  const allText = userMessages.join(" ");

  // Crisis check
  if (
    allText.includes("suicide") ||
    allText.includes("kill myself") ||
    allText.includes("end my life") ||
    allText.includes("self harm") ||
    allText.includes("hurt myself") ||
    allText.includes("want to die")
  ) {
    return `It sounds like you are going through a very difficult time right now. Please know that you are not alone and compassionate support is available immediately 24/7.

🚨 **Immediate Help Lines:**
• **Call or Text 988** (Suicide & Crisis Lifeline - Free & Confidential 24/7)
• **Text HOME to 741741** (Crisis Text Line)
• **Emergency Services**: Call 112 / 911 or visit your nearest hospital emergency room.

Please reach out to one of these resources right away. Your life and wellbeing matter deeply.`;
  }

  if (latestMessage.includes("anxious") || latestMessage.includes("anxiety") || latestMessage.includes("panic")) {
    return "I hear how overwhelming anxiety can feel. When anxious thoughts peak, ground yourself with the 4-7-8 breathing rhythm: Inhale deeply through your nose for 4 seconds, hold gently for 7 seconds, and exhale slowly through your mouth for 8 seconds. Would you like to try taking a slow breath together?";
  }

  if (latestMessage.includes("sleep") || latestMessage.includes("insomnia") || latestMessage.includes("tired")) {
    return "Sleep struggles and feeling drained make everything feel much harder. Taking small moments to rest your eyes, dim bright screens, and release shoulder tension can help your body decompress. What is on your mind as you try to rest?";
  }

  if (latestMessage.includes("stress") || latestMessage.includes("work") || latestMessage.includes("overwhelmed")) {
    return "Juggling so much at once can definitely take a toll on both your mind and body. You don't have to carry everything all at once. What feels like the heaviest thing on your plate today?";
  }

  return "Thank you for sharing that with me. It takes courage to open up about how you're feeling. I am here to listen with empathy. Take all the time you need — what else is on your mind today?";
}
