"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveConsultationNotes } from "@/app/actions/appointment";
import Link from "next/link";

interface ConsultationViewProps {
  appointmentId: string;
  videoRoomId: string;
  role: "DOCTOR" | "PATIENT";
  patientName: string;
  doctorName: string;
  reasonForVisit: string;
  initialNotes: string | null;
  isCompleted: boolean;
  doctorUserId?: string;
  displayName: string;
}

export default function ConsultationView({
  appointmentId,
  videoRoomId,
  role,
  patientName,
  doctorName,
  reasonForVisit,
  initialNotes,
  isCompleted,
  doctorUserId,
  displayName,
}: ConsultationViewProps) {
  const router = useRouter();
  const [notes, setNotes] = useState(initialNotes || "");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(isCompleted);
  const [error, setError] = useState<string | null>(null);

  const handleSubmitNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim() || !doctorUserId) return;

    setError(null);
    setLoading(true);

    try {
      const res = await saveConsultationNotes(doctorUserId, appointmentId, notes);
      if (res.success) {
        setSuccess(true);
        router.refresh();
      } else {
        setError(res.error || "Failed to save notes");
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const backPath = role === "DOCTOR" ? "/doctor/dashboard/appointments" : "/patient/dashboard";

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-6 sm:p-12 relative flex flex-col justify-between">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-teal-500/5 blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto w-full z-10 relative flex-grow flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-slate-800 pb-6 mb-8 shrink-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-1">
              Virtual Consultation Room
            </h1>
            <p className="text-slate-400 text-sm">
              Consulting: <span className="text-slate-200 font-semibold">{patientName}</span> with <span className="text-slate-200 font-semibold">{doctorName}</span>
            </p>
          </div>
          <Link
            href={backPath}
            className="px-5 py-2 bg-slate-850 hover:bg-slate-800 border border-slate-700 rounded-xl text-slate-300 font-medium transition-colors text-sm"
          >
            Leave Room
          </Link>
        </header>

        {/* Reason for Visit banner */}
        <div className="mb-6 px-6 py-4 bg-slate-800/30 border border-slate-700/40 rounded-2xl shrink-0">
          <p className="text-sm text-slate-400">
            <span className="font-semibold text-slate-300">Reason for Visit:</span> &ldquo;{reasonForVisit}&rdquo;
          </p>
        </div>

        {/* Video & Notes area */}
        <div className="grid lg:grid-cols-4 gap-8 flex-grow">
          {/* Jitsi Video Embed */}
          <div className="lg:col-span-3 bg-slate-950/60 border border-slate-800 rounded-3xl overflow-hidden min-h-[500px] flex flex-col">
            {!success ? (
              <iframe
                src={`${videoRoomId}#config.prejoinPageEnabled=false&userInfo.displayName=${encodeURIComponent(
                  displayName
                )}`}
                allow="camera; microphone; fullscreen; display-capture; autoplay"
                className="w-full flex-grow border-none"
                style={{ height: "600px" }}
              />
            ) : (
              <div className="flex-grow flex flex-col items-center justify-center p-8 text-center bg-slate-900/40">
                <div className="w-16 h-16 rounded-full bg-teal-500/10 text-teal-400 flex items-center justify-center text-3xl mb-4">
                  ✓
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Session Completed</h3>
                <p className="text-slate-400 max-w-sm">
                  This virtual consultation call has ended and is marked as completed in the records.
                </p>
              </div>
            )}
          </div>

          {/* Notes Panel */}
          <div className="lg:col-span-1 flex flex-col h-full">
            <div className="bg-slate-800/40 border border-slate-700/60 p-6 rounded-3xl flex flex-col h-full justify-between">
              <div className="space-y-4">
                <h3 className="font-bold text-lg text-white border-b border-slate-700/60 pb-3">
                  Consultation Notes
                </h3>

                {error && (
                  <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                    {error}
                  </div>
                )}

                {role === "DOCTOR" && !success ? (
                  <form onSubmit={handleSubmitNotes} className="space-y-4">
                    <label className="block text-xs text-slate-400">
                      Write notes for the patient. Saving will end the video call and complete the appointment.
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      required
                      rows={12}
                      className="w-full bg-slate-900/60 border border-slate-700 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 resize-none font-sans"
                      placeholder="Diagnoses, recommendations, medications, etc..."
                    />
                    <button
                      type="submit"
                      disabled={loading || !notes.trim()}
                      className="w-full py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg disabled:opacity-50"
                    >
                      {loading ? "Saving..." : "End & Save Notes"}
                    </button>
                  </form>
                ) : (
                  <div className="space-y-3">
                    <span className="text-xs text-slate-500 block">
                      {role === "PATIENT"
                        ? "Notes will appear here once the doctor concludes the session."
                        : "Concluded notes:"}
                    </span>
                    <div className="bg-slate-900/60 border border-slate-850 rounded-xl p-4 text-sm text-slate-300 min-h-[150px] whitespace-pre-wrap leading-relaxed">
                      {notes || <span className="text-slate-600 italic">No notes recorded yet.</span>}
                    </div>
                  </div>
                )}
              </div>

              {success && (
                <Link
                  href={backPath}
                  className="mt-6 w-full py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold rounded-xl text-center text-sm transition-colors"
                >
                  Return to Dashboard
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
