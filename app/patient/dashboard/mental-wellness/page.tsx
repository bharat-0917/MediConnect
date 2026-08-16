"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";

interface Message {
  role: "user" | "model";
  content: string;
}

export default function MentalWellnessPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "model",
      content:
        "Hello, I am your MediConnect Wellness Listener. I am here to provide a safe, non-judgmental space to talk about stress, wellness, or how you are feeling today. What is on your mind?",
    },
  ]);
  const [input, setInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

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
      const res = await fetch("/api/ai/mental-wellness", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages, sessionId }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, { role: "model", content: data.reply }]);
        if (data.sessionId && !sessionId) {
          setSessionId(data.sessionId);
        }
      } else {
        const errData = await res.json();
        setMessages((prev) => [
          ...prev,
          { role: "model", content: `Error: ${errData.error || "Failed to process chat."}` },
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

  const startNewSession = () => {
    setMessages([
      {
        role: "model",
        content:
          "Hello, I am your MediConnect Wellness Listener. I am here to provide a safe, non-judgmental space to talk about stress, wellness, or how you are feeling today. What is on your mind?",
      },
    ]);
    setSessionId(null);
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center">
        <div className="text-xl font-semibold">Loading Wellness Space...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-6 sm:p-12 relative flex flex-col justify-between">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-teal-500/5 blur-[120px] pointer-events-none" />

      <div className="max-w-4xl mx-auto w-full z-10 relative flex-grow flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-slate-800 pb-6 mb-8 shrink-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-1">
              Mental Wellness Space
            </h1>
            <p className="text-slate-400 text-sm">Empathetic listening and stress management support</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={startNewSession}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl text-slate-300 font-medium transition-colors text-xs"
            >
              Reset Chat
            </button>
            <button
              onClick={() => router.push("/patient/dashboard")}
              className="px-5 py-2 bg-slate-850 hover:bg-slate-800 border border-slate-700 rounded-xl text-slate-300 font-medium transition-colors text-sm"
            >
              Back to Dashboard
            </button>
          </div>
        </header>

        {/* Disclaimer / Crisis Banner */}
        <div className="mb-6 p-6 bg-cyan-500/5 border border-cyan-500/10 text-cyan-300 rounded-3xl text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
          <div className="flex items-start gap-3">
            <span className="text-xl shrink-0 mt-0.5">🛋️</span>
            <div>
              <p className="font-semibold text-white mb-0.5">Wellness Support Space</p>
              <p className="text-slate-400">
                This is a supportive listening tool, not clinical therapy. For immediate danger or crises, dial 911 or call/text 988.
              </p>
            </div>
          </div>
          <a
            href="https://988lifeline.org"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-center text-xs shrink-0 transition-colors"
          >
            Visit 988 Lifeline
          </a>
        </div>

        {/* Chat window */}
        <div className="flex-grow flex flex-col bg-slate-800/20 border border-slate-800 rounded-3xl p-6 justify-between min-h-[400px]">
          {/* Chat log */}
          <div className="flex-grow overflow-y-auto space-y-4 max-h-[450px] pr-2 mb-6">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] p-4 rounded-2xl text-sm ${
                    msg.role === "user"
                      ? "bg-teal-500 text-slate-950 rounded-tr-none font-medium"
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
                  Listening...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Form Input */}
          <div className="pt-4 border-t border-slate-800 shrink-0">
            <form onSubmit={handleSend} className="flex gap-4">
              <input
                type="text"
                required
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={chatLoading}
                placeholder="How are you feeling today? Talk about stress, thoughts, or feelings..."
                className="flex-grow bg-slate-900/60 border border-slate-700 rounded-2xl px-5 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 text-sm focus:ring-1 focus:ring-teal-500"
              />
              <button
                type="submit"
                disabled={chatLoading || !input.trim()}
                className="px-6 py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-2xl text-sm transition-all disabled:opacity-50"
              >
                Share
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
