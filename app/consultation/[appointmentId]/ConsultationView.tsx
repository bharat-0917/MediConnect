"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FileText, CheckCircle2, ArrowLeft } from "lucide-react";
import { saveConsultationNotes } from "@/app/actions/appointment";

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
    <div className="min-h-screen bg-[#FAF9F5] text-stone-800 font-sans p-6 sm:p-10 relative flex flex-col justify-between">
      <div className="absolute top-[-5%] right-[-5%] w-[45%] h-[45%] rounded-full bg-[#E0F2E7]/40 blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto w-full z-10 relative flex-grow flex flex-col">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200/80 pb-6 mb-6 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link 
                href={backPath}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#042618] hover:text-[#0F3824] bg-[#E0F2E7]/70 hover:bg-[#E0F2E7] px-3 py-1 rounded-full border border-[#C1E5D0]/60 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Exit Session</span>
              </Link>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#042618]">
              Encrypted Consultation Room
            </h1>
            <p className="text-stone-600 text-xs sm:text-sm mt-0.5">
              Consultation between <span className="text-[#042618] font-bold">{patientName}</span> and <span className="text-[#042618] font-bold">Dr. {doctorName}</span>
            </p>
          </div>
        </header>

        {/* Reason for Visit banner */}
        <div className="mb-6 px-5 py-3.5 bg-white border border-stone-200/80 rounded-2xl shadow-warm-sm shrink-0 flex items-center gap-2">
          <span className="text-xs font-bold text-stone-600 uppercase tracking-wider">Reason for Visit:</span>
          <span className="text-xs text-stone-800 italic">&ldquo;{reasonForVisit}&rdquo;</span>
        </div>

        {/* Video & Notes area */}
        <div className="grid lg:grid-cols-4 gap-6 flex-grow">
          {/* Jitsi Video Embed */}
          <div className="lg:col-span-3 bg-stone-900 border border-stone-200/80 rounded-3xl overflow-hidden min-h-[500px] flex flex-col shadow-warm-sm">
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
              <div className="flex-grow flex flex-col items-center justify-center p-8 text-center bg-white text-stone-800">
                <div className="w-16 h-16 rounded-full bg-[#E0F2E7] text-[#042618] flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-[#042618] mb-1">Consultation Concluded</h3>
                <p className="text-stone-600 text-xs max-w-sm leading-relaxed">
                  This virtual consultation call has ended and clinical notes have been saved to the permanent EHR record.
                </p>
              </div>
            )}
          </div>

          {/* Notes Panel */}
          <div className="lg:col-span-1 flex flex-col h-full">
            <div className="bg-white border border-stone-200/80 p-6 rounded-3xl shadow-warm-sm flex flex-col h-full justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
                  <FileText className="w-4 h-4 text-[#042618]" />
                  <h3 className="font-bold text-base text-[#042618]">
                    Clinical Notes
                  </h3>
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                    {error}
                  </div>
                )}

                {role === "DOCTOR" && !success ? (
                  <form onSubmit={handleSubmitNotes} className="space-y-3.5">
                    <label className="block text-[11px] text-stone-500 font-medium leading-relaxed">
                      Record clinical notes for the patient. Submitting notes will finalize the appointment record.
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      required
                      rows={12}
                      className="w-full bg-stone-50/70 border border-stone-200 rounded-xl p-3 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:bg-white focus:border-[#042618] resize-none font-sans"
                      placeholder="Diagnoses, clinical observations, recommendations..."
                    />
                    <button
                      type="submit"
                      disabled={loading || !notes.trim()}
                      className="w-full py-3 bg-[#042618] hover:bg-[#073824] text-white font-bold rounded-2xl text-xs transition-all shadow-warm-sm disabled:opacity-50"
                    >
                      {loading ? "Saving Notes..." : "End & Finalize Notes"}
                    </button>
                  </form>
                ) : (
                  <div className="space-y-2">
                    <span className="text-xs text-stone-500 block font-medium">
                      {role === "PATIENT"
                        ? "Notes will appear here once the doctor concludes the session."
                        : "Finalized clinical notes:"}
                    </span>
                    <div className="bg-stone-50/70 border border-stone-200 rounded-xl p-4 text-xs text-stone-800 min-h-[160px] whitespace-pre-wrap leading-relaxed">
                      {notes || <span className="text-stone-400 italic">No notes recorded yet.</span>}
                    </div>
                  </div>
                )}
              </div>

              {success && (
                <Link
                  href={backPath}
                  className="mt-6 w-full py-2.5 bg-[#E0F2E7] hover:bg-[#D0EBD9] text-[#042618] font-bold rounded-2xl text-center text-xs transition-colors border border-[#C1E5D0]"
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
