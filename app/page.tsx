import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans">
      {/* Background ambient light */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-teal-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between border-b border-slate-800 z-10">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-cyan-400 flex items-center justify-center font-bold text-slate-950 text-xl shadow-lg shadow-teal-500/20">
            M
          </div>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-teal-400 to-cyan-300 bg-clip-text text-transparent">
            MediConnect
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto w-full px-6 flex-grow flex flex-col items-center justify-center py-12 z-10">
        <div className="text-center max-w-3xl mb-16">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            Healthcare, reconnected.
          </h1>
          <p className="text-lg sm:text-xl text-slate-400 leading-relaxed max-w-2xl mx-auto">
            A secure, AI-powered platform linking patients with verified doctors, managing medical records, and tracking daily metrics.
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid sm:grid-cols-2 gap-8 w-full max-w-4xl">
          {/* Doctor Card */}
          <Link href="/auth/doctor" className="group">
            <div className="h-full p-8 rounded-3xl bg-slate-800/40 border border-slate-700/60 hover:border-teal-500/50 hover:bg-slate-800/80 transition-all duration-300 flex flex-col justify-between hover:shadow-2xl hover:shadow-teal-500/5 hover:-translate-y-1 relative">
              <div className="absolute top-6 right-6 w-12 h-12 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-400 group-hover:bg-teal-500 group-hover:text-slate-950 transition-colors duration-300">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3"
                  />
                </svg>
              </div>
              <div>
                <div className="w-12 h-12 rounded-2xl bg-teal-500/10 flex items-center justify-center text-teal-400 mb-6 font-bold text-xl">
                  Dr.
                </div>
                <h2 className="text-2xl font-bold mb-3 text-slate-100 group-hover:text-teal-400 transition-colors">
                  I'm a Doctor
                </h2>
                <p className="text-slate-400">
                  Manage consultations, issue digital prescriptions, review patient metrics, and connect with your patients.
                </p>
              </div>
              <div className="mt-8 text-sm font-semibold text-teal-400 flex items-center gap-1 group-hover:underline">
                Enter Doctor Portal
              </div>
            </div>
          </Link>

          {/* Patient Card */}
          <Link href="/auth/patient" className="group">
            <div className="h-full p-8 rounded-3xl bg-slate-800/40 border border-slate-700/60 hover:border-cyan-500/50 hover:bg-slate-800/80 transition-all duration-300 flex flex-col justify-between hover:shadow-2xl hover:shadow-cyan-500/5 hover:-translate-y-1 relative">
              <div className="absolute top-6 right-6 w-12 h-12 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500 group-hover:text-slate-950 transition-colors duration-300">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3"
                  />
                </svg>
              </div>
              <div>
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 mb-6 font-bold text-xl">
                  Pt.
                </div>
                <h2 className="text-2xl font-bold mb-3 text-slate-100 group-hover:text-cyan-400 transition-colors">
                  I'm a Patient
                </h2>
                <p className="text-slate-400">
                  Book appointments, track metrics, consult doctors, and get AI-assisted symptom summaries in your portal.
                </p>
              </div>
              <div className="mt-8 text-sm font-semibold text-cyan-400 flex items-center gap-1 group-hover:underline">
                Enter Patient Portal
              </div>
            </div>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto w-full px-6 py-8 text-center text-slate-500 text-sm border-t border-slate-800/60 z-10">
        <p>&copy; {new Date().getFullYear()} MediConnect. All rights reserved.</p>
      </footer>
    </div>
  );
}
