import Link from "next/link";
import { Stethoscope, User, ArrowRight, ShieldCheck, Sparkles, HeartPulse } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#FAF9F5] text-stone-800 flex flex-col justify-between relative overflow-hidden font-sans">
      {/* Soft warm ambient background tints */}
      <div className="absolute top-[-5%] left-[-5%] w-[45%] h-[45%] rounded-full bg-[#E0F2E7]/40 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-5%] right-[-5%] w-[45%] h-[45%] rounded-full bg-[#EAE7DC]/50 blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between border-b border-stone-200/70 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#042618] flex items-center justify-center text-white shadow-warm-sm">
            <HeartPulse className="w-5 h-5 text-[#E0F2E7]" />
          </div>
          <span className="text-xl font-bold tracking-tight text-[#042618]">
            MediConnect
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-[#042618] bg-[#E0F2E7]/70 px-3.5 py-1.5 rounded-full border border-[#C1E5D0]/60">
          <ShieldCheck className="w-3.5 h-3.5 text-[#0F3824]" />
          <span>Verified Clinical Network</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto w-full px-6 flex-grow flex flex-col items-center justify-center py-16 z-10">
        <div className="text-center max-w-3xl mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F0F9F3] border border-[#C1E5D0]/80 text-[#0F3824] text-xs font-semibold mb-6 shadow-warm-sm">
            <Sparkles className="w-3.5 h-3.5 text-[#27794D]" />
            <span>Modern Patient & Doctor Collaboration</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6 text-[#042618] leading-[1.15]">
            Healthcare, reconnected.
          </h1>
          <p className="text-base sm:text-lg text-stone-600 leading-relaxed max-w-2xl mx-auto font-normal">
            A calm, secure platform connecting you with verified healthcare professionals, automated lab insights, and daily wellness tracking.
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid sm:grid-cols-2 gap-8 w-full max-w-4xl">
          {/* Doctor Card */}
          <Link href="/auth/doctor" className="group">
            <div className="h-full p-8 rounded-3xl bg-white border border-stone-200/80 hover:border-[#042618]/30 transition-all duration-300 flex flex-col justify-between shadow-warm-md hover:shadow-warm-hover hover:-translate-y-1 relative">
              <div className="flex items-start justify-between mb-8">
                <div className="w-14 h-14 rounded-2xl bg-[#E0F2E7] flex items-center justify-center text-[#042618] shadow-warm-sm group-hover:scale-105 transition-transform duration-300">
                  <Stethoscope className="w-7 h-7" />
                </div>
                <div className="w-10 h-10 rounded-full bg-[#F0F9F3] border border-[#C1E5D0] flex items-center justify-center text-[#042618] group-hover:bg-[#042618] group-hover:text-white transition-colors duration-300">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
              
              <div>
                <h2 className="text-2xl font-bold mb-3 text-[#042618] group-hover:text-[#0F3824] transition-colors">
                  I&apos;m a Doctor
                </h2>
                <p className="text-stone-600 text-sm leading-relaxed mb-6 font-normal">
                  Manage consultations, issue digital prescriptions, review patient lab metrics, and connect with patients seamlessly.
                </p>
              </div>
              
              <div className="text-sm font-bold text-[#042618] flex items-center gap-1.5 pt-4 border-t border-stone-100">
                <span>Enter Doctor Portal</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </Link>

          {/* Patient Card */}
          <Link href="/auth/patient" className="group">
            <div className="h-full p-8 rounded-3xl bg-white border border-stone-200/80 hover:border-[#042618]/30 transition-all duration-300 flex flex-col justify-between shadow-warm-md hover:shadow-warm-hover hover:-translate-y-1 relative">
              <div className="flex items-start justify-between mb-8">
                <div className="w-14 h-14 rounded-2xl bg-[#E0F2E7] flex items-center justify-center text-[#042618] shadow-warm-sm group-hover:scale-105 transition-transform duration-300">
                  <User className="w-7 h-7" />
                </div>
                <div className="w-10 h-10 rounded-full bg-[#F0F9F3] border border-[#C1E5D0] flex items-center justify-center text-[#042618] group-hover:bg-[#042618] group-hover:text-white transition-colors duration-300">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
              
              <div>
                <h2 className="text-2xl font-bold mb-3 text-[#042618] group-hover:text-[#0F3824] transition-colors">
                  I&apos;m a Patient
                </h2>
                <p className="text-stone-600 text-sm leading-relaxed mb-6 font-normal">
                  Book appointments, track vitals, access lab summaries, chat with AI triage nurse, and manage prescriptions.
                </p>
              </div>
              
              <div className="text-sm font-bold text-[#042618] flex items-center gap-1.5 pt-4 border-t border-stone-100">
                <span>Enter Patient Portal</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto w-full px-6 py-6 text-center text-stone-500 text-xs border-t border-stone-200/70 z-10 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p>&copy; {new Date().getFullYear()} MediConnect Healthcare. All clinical data encrypted.</p>
        <p className="text-stone-400">Warm, compassionate clinical management</p>
      </footer>
    </div>
  );
}
