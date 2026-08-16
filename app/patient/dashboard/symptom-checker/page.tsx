"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";

interface Message {
  role: "user" | "model";
  content: string;
}

export default function SymptomCheckerPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "model",
      content:
        "Hello, I am your MediConnect AI triage nurse. Please describe your symptoms and what you are experiencing. How long have you felt this way?",
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
        { role: "model", content: "Failed to connect. Please check your internet connection." },
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
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center">
        <div className="text-xl font-semibold">Loading Symptom Checker...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-6 sm:p-12 relative flex flex-col justify-between">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-500/5 blur-[120px] pointer-events-none" />

      <div className="max-w-4xl mx-auto w-full z-10 relative flex-grow flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-slate-800 pb-6 mb-8 shrink-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-1">
              AI Symptom Checker
            </h1>
            <p className="text-slate-400 text-sm">Consult our AI triage nurse before booking a specialist</p>
          </div>
          <button
            onClick={() => router.push("/patient/dashboard")}
            className="px-5 py-2 bg-slate-850 hover:bg-slate-800 border border-slate-700 rounded-xl text-slate-300 font-medium transition-colors text-sm"
          >
            Back to Dashboard
          </button>
        </header>

        {/* Disclaimer banner */}
        <div className="mb-6 px-6 py-4 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-2xl text-xs sm:text-sm flex items-center gap-3 shrink-0">
          <span className="text-lg">⚠️</span>
          <p>
            <span className="font-bold text-white">Medical Disclaimer:</span> This is not a medical diagnosis. For emergencies, contact emergency services.
          </p>
        </div>

        {/* Chat area vs Final Summary */}
        <div className="flex-grow flex flex-col min-h-[400px]">
          {!summary ? (
            <div className="flex-grow flex flex-col bg-slate-800/20 border border-slate-800 rounded-3xl p-6 justify-between">
              {/* Message History */}
              <div className="flex-grow overflow-y-auto space-y-4 max-h-[450px] pr-2 mb-6">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] p-4 rounded-2xl text-sm ${
                        msg.role === "user"
                          ? "bg-cyan-500 text-slate-950 rounded-tr-none font-medium"
                          : "bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-none leading-relaxed"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-800 border border-slate-700 text-slate-400 text-xs px-4 py-3 rounded-2xl rounded-tl-none animate-pulse">
                      Triage nurse is typing...
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Form Input and Conclude buttons */}
              <div className="space-y-4 pt-4 border-t border-slate-800 shrink-0">
                <form onSubmit={handleSend} className="flex gap-4">
                  <input
                    type="text"
                    required
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={chatLoading}
                    placeholder="Describe how you feel (e.g. I have a throbbing headache since yesterday morning)..."
                    className="flex-grow bg-slate-900/60 border border-slate-700 rounded-2xl px-5 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-sm focus:ring-1 focus:ring-cyan-500"
                  />
                  <button
                    type="submit"
                    disabled={chatLoading || !input.trim()}
                    className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-2xl text-sm transition-all disabled:opacity-50"
                  >
                    Send
                  </button>
                </form>

                {messages.length >= 3 && (
                  <button
                    onClick={handleConclude}
                    disabled={concludeLoading}
                    className="w-full py-3 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold rounded-2xl text-sm shadow-lg transition-all disabled:opacity-50"
                  >
                    {concludeLoading ? "Compiling Medical Summary..." : "Conclude & Generate Doctor Summary"}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="max-w-xl mx-auto w-full bg-slate-800/40 border border-slate-700/60 p-8 rounded-3xl flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center text-xl mb-6 mx-auto">
                  ✓
                </div>
                <h2 className="text-xl font-bold text-center text-white mb-6">
                  Medical Summary Compiled
                </h2>

                {/* Markdown representation of summary */}
                <div className="bg-slate-950/40 border border-slate-850 p-6 rounded-2xl text-sm leading-relaxed text-slate-300 font-sans whitespace-pre-wrap mb-8">
                  {summary}
                </div>
              </div>

              <div className="space-y-4">
                <Link
                  href={`/patient/dashboard/find-doctor?symptomSessionId=${sessionId}`}
                  className="block w-full py-3.5 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 text-center font-bold rounded-2xl shadow-lg transition-all"
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
                          "Hello, I am your MediConnect AI triage nurse. Please describe your symptoms and what you are experiencing. How long have you felt this way?",
                      },
                    ]);
                  }}
                  className="w-full py-3 border border-slate-700 hover:bg-slate-800 text-slate-300 font-bold rounded-2xl text-sm transition-all"
                >
                  Start New Session
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
