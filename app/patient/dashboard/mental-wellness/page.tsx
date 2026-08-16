"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Send, ArrowLeft, LifeBuoy, RefreshCw, Sparkles, HeartPulse } from "lucide-react";

interface Message {
  role: "user" | "model";
  content: string;
}

export default function MentalWellnessPage() {
  const { status } = useSession();
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "model",
      content:
        "Hello, I am your MediConnect Wellness Listener. I am here to provide a safe, calm, and non-judgmental space to talk about stress, emotional balance, or whatever is on your mind today. How are you feeling right now?",
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
          "Hello, I am your MediConnect Wellness Listener. I am here to provide a safe, calm, and non-judgmental space to talk about stress, emotional balance, or whatever is on your mind today. How are you feeling right now?",
      },
    ]);
    setSessionId(null);
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#FAF9F5] text-stone-700 flex items-center justify-center font-sans">
        <div className="flex items-center gap-3 bg-white px-6 py-4 rounded-2xl border border-stone-200/80 shadow-warm-sm">
          <HeartPulse className="w-5 h-5 text-[#042618] animate-pulse" />
          <div className="text-sm font-semibold text-[#042618]">Loading Wellness Space...</div>
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
              Mental Wellness Space
            </h1>
            <p className="text-stone-600 text-sm mt-0.5">A confidential, empathetic space for stress relief and emotional support</p>
          </div>
          
          <button
            onClick={startNewSession}
            className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-stone-50 border border-stone-200/80 rounded-2xl text-stone-700 font-bold transition-all text-xs shadow-warm-sm w-fit"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Conversation</span>
          </button>
        </header>

        {/* Disclaimer / Crisis Banner */}
        <div className="mb-6 p-5 sm:p-6 bg-[#E0F2E7]/70 border border-[#C1E5D0] text-[#042618] rounded-3xl text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 shadow-warm-sm">
          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-2xl bg-[#042618] text-[#E0F2E7] flex items-center justify-center shrink-0 shadow-warm-sm">
              <LifeBuoy className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-[#042618] mb-0.5">Confidential Wellness Space</p>
              <p className="text-stone-700 text-xs leading-relaxed">
                This space is completely private and not visible to connected doctors. If you or someone you know is in crisis, free support is available 24/7.
              </p>
            </div>
          </div>
          <a
            href="https://988lifeline.org"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 bg-[#042618] hover:bg-[#073824] text-white font-bold rounded-2xl text-center text-xs shrink-0 transition-all shadow-warm-sm"
          >
            Crisis Support (988)
          </a>
        </div>

        {/* Chat window */}
        <div className="flex-grow flex flex-col bg-white border border-stone-200/80 rounded-3xl p-6 sm:p-8 justify-between min-h-[420px] shadow-warm-sm">
          {/* Chat log */}
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
                  <span>Listening mindfully...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Form Input */}
          <div className="pt-4 border-t border-stone-100 shrink-0">
            <form onSubmit={handleSend} className="flex gap-3">
              <input
                type="text"
                required
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={chatLoading}
                placeholder="Share your thoughts or what is causing stress today..."
                className="flex-grow bg-stone-50/70 border border-stone-200 rounded-2xl px-5 py-3 text-stone-900 placeholder-stone-400 focus:outline-none focus:bg-white focus:border-[#042618] focus:ring-1 focus:ring-[#042618] text-xs sm:text-sm transition-all"
              />
              <button
                type="submit"
                disabled={chatLoading || !input.trim()}
                className="px-6 py-3 bg-[#042618] hover:bg-[#073824] text-white font-bold rounded-2xl text-xs sm:text-sm transition-all shadow-warm-sm flex items-center gap-1.5 disabled:opacity-50"
              >
                <span>Share</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
