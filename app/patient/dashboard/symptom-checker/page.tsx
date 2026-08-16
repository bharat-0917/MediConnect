"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Send, ArrowLeft, AlertCircle, CheckCircle2, Sparkles, HeartPulse, RefreshCw } from "lucide-react";

interface Message {
  role: "user" | "model";
  content: string;
}

export default function SymptomCheckerPage() {
  const { status } = useSession();
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "model",
      content:
        "Hello, I am your MediConnect clinical triage assistant. Please describe what symptoms you are experiencing, when they began, and how severe they feel.",
    },
  ]);
  const [input, setInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  
  // Conclusion states
  const [summary, setSummary] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [concludeLoading, setConcludeLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/patient");
    }
  }, [status, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || chatLoading) return;

    const userMessage: Message = { role: "user", content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setChatLoading(true);

    try {
      const res = await fetch("/api/ai/symptom-checker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages, conclude: false }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, { role: "model", content: data.reply }]);
      } else {
        const errData = await res.json();
        setMessages((prev) => [
          ...prev,
          { role: "model", content: `Error: ${errData.error || "Failed to query AI."}` },
        ]);
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { role: "model", content: "Failed to connect. Please check your network connection." },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleConclude = async () => {
    if (messages.length < 2 || concludeLoading) return;

    setConcludeLoading(true);
    try {
      const res = await fetch("/api/ai/symptom-checker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages, conclude: true }),
      });

      if (res.ok) {
        const data = await res.json();
        setSummary(data.summary);
        setSessionId(data.sessionId);
      } else {
        alert("Failed to compile summary. Please try again.");
      }
    } catch (err) {
      console.error(err);
      alert("An unexpected connection error occurred.");
    } finally {
      setConcludeLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#FAF9F5] text-stone-700 flex items-center justify-center font-sans">
        <div className="flex items-center gap-3 bg-white px-6 py-4 rounded-2xl border border-stone-200/80 shadow-warm-sm">
          <HeartPulse className="w-5 h-5 text-[#042618] animate-pulse" />
          <div className="text-sm font-semibold text-[#042618]">Loading Symptom Assistant...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-stone-800 font-sans p-6 sm:p-10 relative flex flex-col justify-between">
      <div className="absolute top-[-5%] right-[-5%] w-[45%] h-[45%] rounded-full bg-[#E0F2E7]/40 blur-[100px] pointer-events-none" />

      <div className="max-w-4xl mx-auto w-full z-10 relative flex-grow flex flex-col">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200/80 pb-6 mb-8 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link 
                href="/patient/dashboard" 
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#042618] hover:text-[#0F3824] bg-[#E0F2E7]/70 hover:bg-[#E0F2E7] px-3 py-1 rounded-full border border-[#C1E5D0]/60 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </Link>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#042618]">
              AI Symptom Checker & Triage
            </h1>
            <p className="text-stone-600 text-sm mt-0.5">Describe your symptoms to generate a structured clinical summary for your doctor</p>
          </div>
        </header>

        {/* Disclaimer banner */}
        <div className="mb-6 px-5 py-3.5 bg-amber-50/90 border border-amber-200 text-amber-900 rounded-2xl text-xs flex items-center gap-3 shrink-0 shadow-warm-sm">
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
          <p className="leading-relaxed">
            <span className="font-bold text-amber-950">Medical Notice:</span> This AI tool provides pre-consultation triage assistance and is not a clinical diagnosis. If you have chest pain, shortness of breath, or emergency symptoms, call emergency services immediately.
          </p>
        </div>

        {/* Chat area vs Final Summary */}
        <div className="flex-grow flex flex-col min-h-[420px]">
          {!summary ? (
            <div className="flex-grow flex flex-col bg-white border border-stone-200/80 rounded-3xl p-6 sm:p-8 justify-between shadow-warm-sm">
              {/* Message History */}
              <div className="flex-grow overflow-y-auto space-y-4 max-h-[420px] pr-2 mb-6">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[82%] p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-[#042618] text-white rounded-tr-none font-medium shadow-warm-sm"
                          : "bg-[#F0F9F3] border border-[#E0F2E7] text-stone-800 rounded-tl-none font-normal"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-[#F0F9F3] border border-[#E0F2E7] text-stone-600 text-xs px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-[#27794D] animate-spin" />
                      <span>Triage assistant is formulating follow-up questions...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Form Input and Conclude buttons */}
              <div className="space-y-3 pt-4 border-t border-stone-100 shrink-0">
                <form onSubmit={handleSend} className="flex gap-3">
                  <input
                    type="text"
                    required
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={chatLoading}
                    placeholder="Describe how you feel (e.g. Sharp pain in lower abdomen since yesterday)..."
                    className="flex-grow bg-stone-50/70 border border-stone-200 rounded-2xl px-5 py-3 text-stone-900 placeholder-stone-400 focus:outline-none focus:bg-white focus:border-[#042618] focus:ring-1 focus:ring-[#042618] text-xs sm:text-sm transition-all"
                  />
                  <button
                    type="submit"
                    disabled={chatLoading || !input.trim()}
                    className="px-6 py-3 bg-[#042618] hover:bg-[#073824] text-white font-bold rounded-2xl text-xs sm:text-sm transition-all shadow-warm-sm flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <span>Send</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>

                {messages.length >= 3 && (
                  <button
                    onClick={handleConclude}
                    disabled={concludeLoading}
                    className="w-full py-3 bg-[#E0F2E7] hover:bg-[#D0EBD9] text-[#042618] font-bold rounded-2xl text-xs transition-all border border-[#C1E5D0] shadow-warm-sm disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#0F3824]" />
                    <span>{concludeLoading ? "Compiling Clinical Summary..." : "Conclude & Compile Doctor Summary"}</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="max-w-xl mx-auto w-full bg-white border border-stone-200/80 p-8 sm:p-10 rounded-3xl flex flex-col justify-between shadow-warm-md">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-[#E0F2E7] text-[#042618] flex items-center justify-center text-xl mb-5 mx-auto shadow-warm-sm">
                  <CheckCircle2 className="w-7 h-7 text-[#0F3824]" />
                </div>
                <h2 className="text-xl font-bold text-center text-[#042618] mb-4">
                  Clinical Summary Compiled
                </h2>

                {/* Markdown representation of summary */}
                <div className="bg-[#F0F9F3] border border-[#E0F2E7] p-6 rounded-2xl text-xs sm:text-sm leading-relaxed text-stone-800 font-sans whitespace-pre-wrap mb-8">
                  {summary}
                </div>
              </div>

              <div className="space-y-3">
                <Link
                  href={`/patient/dashboard/find-doctor?symptomSessionId=${sessionId}`}
                  className="block w-full py-3.5 bg-[#042618] hover:bg-[#073824] text-white text-center font-bold rounded-2xl text-xs shadow-warm-sm transition-all"
                >
                  Book Appointment With This Summary
                </Link>
                <button
                  onClick={() => {
                    setSummary(null);
                    setSessionId(null);
                    setMessages([
                      {
                        role: "model",
                        content:
                          "Hello, I am your MediConnect clinical triage assistant. Please describe what symptoms you are experiencing, when they began, and how severe they feel.",
                      },
                    ]);
                  }}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-700 font-bold rounded-2xl text-xs transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Start New Assessment</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
