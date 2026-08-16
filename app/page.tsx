"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { 
  HeartPulse, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  Stethoscope, 
  User, 
  Video, 
  FileText, 
  HeartHandshake, 
  Pill, 
  Activity, 
  Baby, 
  UploadCloud, 
  AlertTriangle, 
  CheckCircle2, 
  Lock, 
  Brain, 
  ChevronDown, 
  Menu,
  X
} from "lucide-react";

// Feature marquee items
const MARQUEE_ITEMS = [
  "Virtual Consultations",
  "AI Symptom Checker",
  "Digital Prescriptions (PDF)",
  "Plain-Language Lab Summaries",
  "Confidential Mental Wellness",
  "Longitudinal Vitals Tracker",
  "UIP Vaccine Schedule",
  "Verified Doctor Network",
  "100% Patient-Controlled Privacy",
];

// Stats config
const STATS = [
  { label: "Clinical System Uptime", value: 99.9, suffix: "%", decimals: 1 },
  { label: "Specialties Covered", value: 15, suffix: "+", decimals: 0 },
  { label: "Verified Practitioners", value: 100, suffix: "%", decimals: 0 },
  { label: "Average Triage Prep Time", value: 45, prefix: "< ", suffix: "s", decimals: 0 },
];

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [hasAnimatedStats, setHasAnimatedStats] = useState(false);
  const [statCounts, setStatCounts] = useState<number[]>([0, 0, 0, 0]);
  const statsRef = useRef<HTMLDivElement | null>(null);

  // Stat count-up trigger using IntersectionObserver
  useEffect(() => {
    const currentRef = statsRef.current;
    if (!currentRef) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimatedStats) {
          setHasAnimatedStats(true);

          const duration = 1800; // ms
          const steps = 40;
          const stepTime = duration / steps;
          let currentStep = 0;

          const timer = setInterval(() => {
            currentStep++;
            const progress = currentStep / steps;
            // easeOutExpo
            const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

            setStatCounts(
              STATS.map((s) => Number((s.value * easeProgress).toFixed(s.decimals)))
            );

            if (currentStep >= steps) {
              clearInterval(timer);
              setStatCounts(STATS.map((s) => s.value));
            }
          }, stepTime);
        }
      },
      { threshold: 0.25 }
    );

    observer.observe(currentRef);
    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, [hasAnimatedStats]);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-stone-800 font-sans relative overflow-x-hidden selection:bg-[#E0F2E7] selection:text-[#042618]">
      {/* Soft warm ambient background highlights */}
      <div className="absolute top-[-4%] left-[-6%] w-[50%] h-[50%] rounded-full bg-[#E0F2E7]/40 blur-[130px] pointer-events-none" />
      <div className="absolute top-[35%] right-[-8%] w-[45%] h-[45%] rounded-full bg-[#F0F9F3]/70 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-5%] left-[20%] w-[45%] h-[45%] rounded-full bg-[#EAE7DC]/40 blur-[140px] pointer-events-none" />

      {/* 1. TOP NAVIGATION */}
      <nav className="sticky top-0 z-50 bg-[#FAF9F5]/90 backdrop-blur-md border-b border-stone-200/70 transition-all">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-[#042618] flex items-center justify-center text-white shadow-warm-sm group-hover:scale-105 transition-transform duration-300">
              <HeartPulse className="w-5 h-5 text-[#E0F2E7]" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-[#042618]">
              MediConnect
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-8 text-xs font-semibold text-stone-600">
            <a href="#features" className="hover:text-[#042618] transition-colors">
              Features
            </a>
            <a href="#lab-analysis" className="hover:text-[#042618] transition-colors">
              Lab Intelligence
            </a>
            <a href="#how-it-works" className="hover:text-[#042618] transition-colors">
              How It Works
            </a>
            <a href="#why-mediconnect" className="hover:text-[#042618] transition-colors">
              Why Us
            </a>
            <a href="#faq" className="hover:text-[#042618] transition-colors">
              FAQ
            </a>
          </div>

          {/* Right Action */}
          <div className="hidden sm:flex items-center gap-3">
            <a
              href="#get-started"
              className="px-5 py-2.5 bg-[#042618] hover:bg-[#073824] text-white font-bold rounded-2xl text-xs transition-all shadow-warm-sm hover:shadow-warm-md flex items-center gap-1.5"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-[#042618] hover:bg-stone-100 transition-colors"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden px-6 pt-4 pb-6 bg-[#FAF9F5] border-b border-stone-200 shadow-warm-md space-y-3 text-sm font-semibold">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-stone-700 hover:text-[#042618]"
            >
              Features
            </a>
            <a
              href="#lab-analysis"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-stone-700 hover:text-[#042618]"
            >
              Lab Intelligence
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-stone-700 hover:text-[#042618]"
            >
              How It Works
            </a>
            <a
              href="#why-mediconnect"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-stone-700 hover:text-[#042618]"
            >
              Why MediConnect
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-stone-700 hover:text-[#042618]"
            >
              FAQ
            </a>
            <div className="pt-2">
              <a
                href="#get-started"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-3 bg-[#042618] text-white font-bold rounded-2xl text-xs text-center block"
              >
                Get Started
              </a>
            </div>
          </div>
        )}
      </nav>

      {/* 2. HERO SECTION */}
      <section className="relative pt-12 sm:pt-20 pb-16 px-6 sm:px-10 max-w-7xl mx-auto z-10">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#F0F9F3] border border-[#C1E5D0] text-[#0F3824] text-xs font-bold mb-8 shadow-warm-sm">
            <Sparkles className="w-3.5 h-3.5 text-[#27794D]" />
            <span>Intelligent Pre-Visit Triage & Verified Virtual Care</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-[#042618] leading-[1.12] mb-6">
            Healthcare that prepares you, before you step in.
          </h1>

          <p className="text-base sm:text-xl text-stone-600 leading-relaxed max-w-2xl mx-auto font-normal mb-10">
            Triage symptoms with AI, demystify dense lab panels in plain language, and connect with credential-verified doctors from home.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
            <a
              href="#get-started"
              className="w-full sm:w-auto px-8 py-4 bg-[#042618] hover:bg-[#073824] text-white font-bold rounded-2xl text-sm transition-all shadow-warm-md hover:shadow-warm-hover flex items-center justify-center gap-2"
            >
              <span>Access Your Portal</span>
              <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="#how-it-works"
              className="w-full sm:w-auto px-8 py-4 bg-[#E0F2E7]/80 hover:bg-[#E0F2E7] border border-[#C1E5D0] text-[#042618] font-bold rounded-2xl text-sm transition-colors flex items-center justify-center"
            >
              See How It Works
            </a>
          </div>
        </div>

        {/* Doctor / Patient Direct Portal Selectors */}
        <div id="get-started" className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto scroll-mt-28">
          {/* Patient Card */}
          <Link href="/auth/patient" className="group">
            <div className="h-full p-8 rounded-3xl bg-white border border-stone-200/80 hover:border-[#042618]/40 transition-all duration-300 flex flex-col justify-between shadow-warm-sm hover:shadow-warm-hover hover:-translate-y-1 relative">
              <div>
                <div className="flex items-start justify-between mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-[#E0F2E7] flex items-center justify-center text-[#042618] shadow-warm-sm group-hover:scale-105 transition-transform duration-300">
                    <User className="w-7 h-7" />
                  </div>
                  <span className="text-[11px] font-bold px-3 py-1 bg-[#F0F9F3] border border-[#C1E5D0] text-[#042618] rounded-full">
                    Patients & Families
                  </span>
                </div>
                <h2 className="text-2xl font-extrabold text-[#042618] mb-2 group-hover:text-[#0F3824] transition-colors">
                  I&apos;m a Patient
                </h2>
                <p className="text-stone-600 text-xs sm:text-sm leading-relaxed mb-6 font-normal">
                  Book specialist appointments, chat with the AI triage assistant, log biometrics, and view plain-language lab analyses.
                </p>
              </div>
              <div className="text-xs font-bold text-[#042618] flex items-center gap-1.5 pt-4 border-t border-stone-100">
                <span>Enter Patient Portal</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </Link>

          {/* Doctor Card */}
          <Link href="/auth/doctor" className="group">
            <div className="h-full p-8 rounded-3xl bg-white border border-stone-200/80 hover:border-[#042618]/40 transition-all duration-300 flex flex-col justify-between shadow-warm-sm hover:shadow-warm-hover hover:-translate-y-1 relative">
              <div>
                <div className="flex items-start justify-between mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-[#E0F2E7] flex items-center justify-center text-[#042618] shadow-warm-sm group-hover:scale-105 transition-transform duration-300">
                    <Stethoscope className="w-7 h-7" />
                  </div>
                  <span className="text-[11px] font-bold px-3 py-1 bg-[#F0F9F3] border border-[#C1E5D0] text-[#042618] rounded-full">
                    Healthcare Practitioners
                  </span>
                </div>
                <h2 className="text-2xl font-extrabold text-[#042618] mb-2 group-hover:text-[#0F3824] transition-colors">
                  I&apos;m a Doctor
                </h2>
                <p className="text-stone-600 text-xs sm:text-sm leading-relaxed mb-6 font-normal">
                  Conduct encrypted video consultations, review consolidated patient EHRs, and issue signed digital prescriptions.
                </p>
              </div>
              <div className="text-xs font-bold text-[#042618] flex items-center gap-1.5 pt-4 border-t border-stone-100">
                <span>Enter Doctor Portal</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </Link>
        </div>

        {/* Marquee Ticker */}
        <div className="mt-16 pt-8 border-t border-stone-200/60 overflow-hidden relative group">
          <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[#FAF9F5] to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#FAF9F5] to-transparent z-10 pointer-events-none" />
          
          <div className="animate-marquee gap-8 py-2">
            {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, idx) => (
              <div
                key={idx}
                className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white border border-stone-200/80 shadow-warm-sm shrink-0"
              >
                <div className="w-2 h-2 rounded-full bg-[#27794D]" />
                <span className="text-xs font-bold text-[#042618] tracking-tight whitespace-nowrap">
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. EXPERIENCE COMPREHENSIVE HEALTHCARE — FEATURE GRID */}
      <section id="features" className="py-20 px-6 sm:px-10 max-w-7xl mx-auto z-10 scroll-mt-20">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-extrabold uppercase tracking-widest text-[#27794D] block mb-2">
            End-to-End Care Architecture
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#042618] tracking-tight mb-4">
            Experience Comprehensive Healthcare
          </h2>
          <p className="text-stone-600 text-sm sm:text-base leading-relaxed">
            From preliminary AI triage to signed prescription dispatch, every stage of your clinical journey is connected in one calm space.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* 1. Virtual Consultations */}
          <div className="p-8 rounded-3xl bg-white border border-stone-200/80 shadow-warm-sm hover:shadow-warm-hover hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#E0F2E7] text-[#042618] flex items-center justify-center mb-6 shadow-warm-sm">
                <Video className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#042618] mb-2">
                Virtual Consultations
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed mb-6">
                Peer-to-peer encrypted video consultations with verified specialists and clinical notes recorded directly to your EHR.
              </p>
            </div>
            {/* Decorative CSS visual */}
            <div className="p-3 bg-[#F0F9F3] border border-[#C1E5D0] rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] font-bold text-[#042618]">Encrypted Room Active</span>
              </div>
              <span className="text-[10px] text-stone-500 font-mono">1080p WebRTC</span>
            </div>
          </div>

          {/* 2. AI Symptom Checker */}
          <div className="p-8 rounded-3xl bg-white border border-stone-200/80 shadow-warm-sm hover:shadow-warm-hover hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#E0F2E7] text-[#042618] flex items-center justify-center mb-6 shadow-warm-sm">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#042618] mb-2">
                AI Symptom Checker
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed mb-6">
                Guided clinical intake powered by Gemini that organizes your symptoms into structured pre-visit summaries for your doctor.
              </p>
            </div>
            {/* Decorative CSS visual */}
            <div className="flex flex-wrap gap-1.5">
              <span className="px-2.5 py-1 bg-stone-100 text-stone-700 rounded-lg text-[10px] font-bold">
                Tension Headache
              </span>
              <span className="px-2.5 py-1 bg-stone-100 text-stone-700 rounded-lg text-[10px] font-bold">
                Elevated BP
              </span>
              <span className="px-2.5 py-1 bg-[#E0F2E7] text-[#042618] rounded-lg text-[10px] font-bold border border-[#C1E5D0]">
                Triage Ready ✓
              </span>
            </div>
          </div>

          {/* 3. Mental Wellness Support */}
          <div className="p-8 rounded-3xl bg-white border border-stone-200/80 shadow-warm-sm hover:shadow-warm-hover hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#E0F2E7] text-[#042618] flex items-center justify-center mb-6 shadow-warm-sm">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#042618] mb-2">
                Mental Wellness Listener
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed mb-6">
                A private, judgment-free listening space with mindfulness tools and zero sharing with doctors to guarantee total patient privacy.
              </p>
            </div>
            {/* Decorative CSS visual */}
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-900">100% Confidential Space</span>
              <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full font-bold">
                SOS 24/7
              </span>
            </div>
          </div>

          {/* 4. Digital Prescriptions */}
          <div className="p-8 rounded-3xl bg-white border border-stone-200/80 shadow-warm-sm hover:shadow-warm-hover hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#E0F2E7] text-[#042618] flex items-center justify-center mb-6 shadow-warm-sm">
                <Pill className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#042618] mb-2">
                Digital Prescriptions
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed mb-6">
                Official prescriptions compiled with exact dosage instructions, signed with registration licenses, and available for instant PDF download.
              </p>
            </div>
            {/* Decorative CSS visual */}
            <div className="p-3 bg-[#F0F9F3] border border-[#C1E5D0] rounded-2xl flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#042618]">Telmisartan 40mg • 30D</span>
              <span className="text-[10px] font-bold text-[#27794D] bg-white px-2 py-0.5 rounded border border-[#C1E5D0]">
                Signed PDF
              </span>
            </div>
          </div>

          {/* 5. Health Tracking & Vitals */}
          <div className="p-8 rounded-3xl bg-white border border-stone-200/80 shadow-warm-sm hover:shadow-warm-hover hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#E0F2E7] text-[#042618] flex items-center justify-center mb-6 shadow-warm-sm">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#042618] mb-2">
                Health Tracking & Vitals
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed mb-6">
                Log blood pressure, weight, glucose, steps, and heart rate with interactive visual curves that your connected doctor can monitor over time.
              </p>
            </div>
            {/* Decorative CSS visual */}
            <div className="p-3 bg-stone-50 border border-stone-200 rounded-2xl flex items-center justify-between">
              <div className="text-[10px] text-stone-500">
                BP: <span className="font-bold text-[#042618]">122/80</span> • Target: <span className="font-bold text-[#042618]">72 kg</span>
              </div>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                Optimal
              </span>
            </div>
          </div>

          {/* 6. Vaccine Tracker */}
          <div className="p-8 rounded-3xl bg-white border border-stone-200/80 shadow-warm-sm hover:shadow-warm-hover hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#E0F2E7] text-[#042618] flex items-center justify-center mb-6 shadow-warm-sm">
                <Baby className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#042618] mb-2">
                UIP Immunization Tracker
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed mb-6">
                Manage dependents and children with the national immunization schedule, automated due-date alerts, and doctor administration stamps.
              </p>
            </div>
            {/* Decorative CSS visual */}
            <div className="flex gap-2">
              <span className="px-2 py-1 bg-[#E0F2E7] text-[#042618] rounded-lg text-[10px] font-bold">
                BCG ✓
              </span>
              <span className="px-2 py-1 bg-[#E0F2E7] text-[#042618] rounded-lg text-[10px] font-bold">
                OPV-1 ✓
              </span>
              <span className="px-2 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-[10px] font-bold">
                DTP-1 Due
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. UNDERSTAND YOUR LAB REPORTS */}
      <section id="lab-analysis" className="py-20 px-6 sm:px-10 max-w-7xl mx-auto z-10 scroll-mt-20">
        <div className="bg-white border border-stone-200/80 rounded-3xl p-8 sm:p-14 shadow-warm-md">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column: Value props */}
            <div>
              <span className="text-xs font-extrabold uppercase tracking-widest text-[#27794D] block mb-2">
                Automated Clinical AI Synopsis
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#042618] tracking-tight mb-4">
                Understand Your Lab Reports in Plain Language
              </h2>
              <p className="text-stone-600 text-sm sm:text-base leading-relaxed mb-8">
                Stop deciphering confusing clinical terminology alone. Upload diagnostic PDFs and receive structured breakdowns before speaking with your clinician.
              </p>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-[#E0F2E7] text-[#042618] flex items-center justify-center shrink-0 shadow-warm-sm">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#042618] mb-1">
                      Plain-Language Explanations
                    </h3>
                    <p className="text-xs text-stone-600 leading-relaxed">
                      Translates complex biochemical indicators (e.g. eGFR, HbA1c, lipid fractions) into clear everyday terminology.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-700 border border-rose-200 flex items-center justify-center shrink-0 shadow-warm-sm">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#042618] mb-1">
                      Highlighted Anomalies & Ranges
                    </h3>
                    <p className="text-xs text-stone-600 leading-relaxed">
                      Extracts reference intervals automatically and tags borderline or abnormal values for doctor review.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-[#E0F2E7] text-[#042618] flex items-center justify-center shrink-0 shadow-warm-sm">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#042618] mb-1">
                      Actionable Consultation Context
                    </h3>
                    <p className="text-xs text-stone-600 leading-relaxed">
                      Generates key questions you should ask your specialist during your upcoming virtual consultation.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Upload Zone Mockup */}
            <div className="bg-[#FAF9F5] border-2 border-dashed border-[#C1E5D0] rounded-3xl p-8 text-center flex flex-col items-center justify-center relative shadow-warm-sm">
              <div className="w-16 h-16 rounded-3xl bg-[#E0F2E7] text-[#042618] flex items-center justify-center mb-4 shadow-warm-sm">
                <UploadCloud className="w-8 h-8" />
              </div>
              <h4 className="text-base font-extrabold text-[#042618] mb-1">
                Upload Diagnostic Report
              </h4>
              <p className="text-xs text-stone-500 mb-6 max-w-xs">
                Drag and drop your blood tests, metabolic panels, or pathology PDFs
              </p>

              <div className="p-4 bg-white border border-stone-200/80 rounded-2xl w-full max-w-xs text-left text-xs mb-6 shadow-warm-sm space-y-2">
                <div className="flex items-center justify-between text-[11px] text-stone-500">
                  <span>Sample_Lipid_Panel.pdf</span>
                  <span className="text-emerald-700 font-bold">1.2 MB</span>
                </div>
                <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#042618] h-full w-[85%] rounded-full" />
                </div>
                <span className="text-[10px] text-stone-400 block">AI Anomaly Analysis Complete</span>
              </div>

              <Link
                href="/auth/patient"
                className="px-6 py-3 bg-[#042618] hover:bg-[#073824] text-white font-bold rounded-2xl text-xs transition-all shadow-warm-sm flex items-center gap-2"
              >
                <span>Upload Report in Patient Portal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <span className="text-[10px] text-stone-400 mt-3">Supports PDF, PNG, JPEG up to 10MB</span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. HOW IT WORKS — 3 STEPS */}
      <section id="how-it-works" className="py-20 px-6 sm:px-10 max-w-7xl mx-auto z-10 scroll-mt-20">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-extrabold uppercase tracking-widest text-[#27794D] block mb-2">
            Simple 3-Step Journey
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#042618] tracking-tight mb-4">
            How MediConnect Works
          </h2>
          <p className="text-stone-600 text-sm sm:text-base leading-relaxed">
            Eliminate chaotic clinic waiting rooms and arrive at your appointment fully organized and informed.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Step 1 */}
          <div className="p-8 bg-white border border-stone-200/80 rounded-3xl shadow-warm-sm flex flex-col justify-between relative">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#042618] text-white font-extrabold text-base flex items-center justify-center mb-6 shadow-warm-sm">
                01
              </div>
              <h3 className="text-lg font-bold text-[#042618] mb-2">
                Triage with AI
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                Describe your symptoms, onset, and duration. MediConnect organizes your medical complaint into a structured clinical brief.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-stone-100 text-[11px] font-bold text-[#27794D] flex items-center gap-1">
              <span>Symptom Checker</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </div>

          {/* Step 2 */}
          <div className="p-8 bg-white border border-stone-200/80 rounded-3xl shadow-warm-sm flex flex-col justify-between relative">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#042618] text-white font-extrabold text-base flex items-center justify-center mb-6 shadow-warm-sm">
                02
              </div>
              <h3 className="text-lg font-bold text-[#042618] mb-2">
                Upload Diagnostic Files
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                Add lab tests and biometrics. Our system highlights anomalies in plain language and syncs them to your health record.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-stone-100 text-[11px] font-bold text-[#27794D] flex items-center gap-1">
              <span>Lab Intelligence</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-8 bg-white border border-stone-200/80 rounded-3xl shadow-warm-sm flex flex-col justify-between relative">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#042618] text-white font-extrabold text-base flex items-center justify-center mb-6 shadow-warm-sm">
                03
              </div>
              <h3 className="text-lg font-bold text-[#042618] mb-2">
                Consult Verified Doctors
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                Join encrypted video sessions where your practitioner views your consolidated chart and issues verified prescriptions.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-stone-100 text-[11px] font-bold text-[#27794D] flex items-center gap-1">
              <span>Virtual Consultation</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </div>
        </div>
      </section>

      {/* 6. WHY MEDICONNECT & STATS */}
      <section id="why-mediconnect" className="py-20 px-6 sm:px-10 max-w-7xl mx-auto z-10 scroll-mt-20">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-extrabold uppercase tracking-widest text-[#27794D] block mb-2">
            Clinical Integrity & Safety
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#042618] tracking-tight mb-4">
            Why Healthcare Practitioners & Patients Trust MediConnect
          </h2>
        </div>

        {/* 3 Core Value Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="p-8 bg-white border border-stone-200/80 rounded-3xl shadow-warm-sm">
            <div className="w-12 h-12 rounded-2xl bg-[#E0F2E7] text-[#042618] flex items-center justify-center mb-6 shadow-warm-sm">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[#042618] mb-2">
              100% Verified Clinicians
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              Every doctor profile requires administrative medical license verification before appearing in search directories or taking appointments.
            </p>
          </div>

          <div className="p-8 bg-white border border-stone-200/80 rounded-3xl shadow-warm-sm">
            <div className="w-12 h-12 rounded-2xl bg-[#E0F2E7] text-[#042618] flex items-center justify-center mb-6 shadow-warm-sm">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[#042618] mb-2">
              Patient-Controlled Privacy
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              Doctors can only access records of patients with an active confirmed slot. Confidential mental wellness logs remain strictly isolated.
            </p>
          </div>

          <div className="p-8 bg-white border border-stone-200/80 rounded-3xl shadow-warm-sm">
            <div className="w-12 h-12 rounded-2xl bg-[#E0F2E7] text-[#042618] flex items-center justify-center mb-6 shadow-warm-sm">
              <Brain className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[#042618] mb-2">
              Structured Diagnostic Intake
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              Doctors save an average of 10 minutes per consult because symptom histories and flagged lab values are organized before the call begins.
            </p>
          </div>
        </div>

        {/* Stats Row with count-up animation */}
        <div
          ref={statsRef}
          className="bg-white border border-stone-200/80 rounded-3xl p-8 sm:p-12 shadow-warm-sm grid sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center"
        >
          {STATS.map((stat, idx) => (
            <div key={idx} className="space-y-1">
              <div className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#042618] tracking-tight">
                {stat.prefix || ""}
                {statCounts[idx]}
                {stat.suffix || ""}
              </div>
              <span className="text-xs font-bold text-stone-500 block">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* 7. TESTIMONIALS */}
      {/* Note: Starter placeholder feedback cards for previewing UI layout */}
      <section className="py-20 px-6 sm:px-10 max-w-7xl mx-auto z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-extrabold uppercase tracking-widest text-[#27794D] block mb-2">
            Early Patient & Clinician Feedback
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#042618] tracking-tight mb-3">
            Designed for Real Clinical Collaboration
          </h2>
          <p className="text-xs text-stone-400">
            * Starter placeholder reviews during preview rollout
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 bg-white border border-stone-200/80 rounded-3xl shadow-warm-sm flex flex-col justify-between">
            <p className="text-xs sm:text-sm text-stone-700 leading-relaxed italic mb-6">
              &ldquo;The plain-language lab breakdown helped me understand my cholesterol panel before my cardiology call. My doctor had the full summary ready immediately.&rdquo;
            </p>
            <div className="flex items-center gap-3 pt-4 border-t border-stone-100">
              <div className="w-9 h-9 rounded-full bg-[#E0F2E7] text-[#042618] font-bold text-xs flex items-center justify-center">
                RS
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#042618]">Rohan S.</h4>
                <span className="text-[10px] text-stone-500">Patient • New Delhi</span>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white border border-stone-200/80 rounded-3xl shadow-warm-sm flex flex-col justify-between">
            <p className="text-xs sm:text-sm text-stone-700 leading-relaxed italic mb-6">
              &ldquo;MediConnect eliminates the first 10 minutes of manual intake. Having patient vitals and flagged lab anomalies in one consolidated EHR view is game-changing.&rdquo;
            </p>
            <div className="flex items-center gap-3 pt-4 border-t border-stone-100">
              <div className="w-9 h-9 rounded-full bg-[#042618] text-[#E0F2E7] font-bold text-xs flex items-center justify-center">
                AR
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#042618]">Dr. Ananya R.</h4>
                <span className="text-[10px] text-stone-500">Cardiologist • Bengaluru</span>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white border border-stone-200/80 rounded-3xl shadow-warm-sm flex flex-col justify-between">
            <p className="text-xs sm:text-sm text-stone-700 leading-relaxed italic mb-6">
              &ldquo;Tracking my toddler&apos;s vaccination schedule with the built-in UIP tracker has made missed doses a thing of the past. Simple and reassuring.&rdquo;
            </p>
            <div className="flex items-center gap-3 pt-4 border-t border-stone-100">
              <div className="w-9 h-9 rounded-full bg-[#E0F2E7] text-[#042618] font-bold text-xs flex items-center justify-center">
                PM
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#042618]">Pooja M.</h4>
                <span className="text-[10px] text-stone-500">Parent • Mumbai</span>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white border border-stone-200/80 rounded-3xl shadow-warm-sm flex flex-col justify-between">
            <p className="text-xs sm:text-sm text-stone-700 leading-relaxed italic mb-6">
              &ldquo;Being able to prescribe medications digitally with license credentials and have the PDF delivered directly to the patient makes remote care effortless.&rdquo;
            </p>
            <div className="flex items-center gap-3 pt-4 border-t border-stone-100">
              <div className="w-9 h-9 rounded-full bg-[#042618] text-[#E0F2E7] font-bold text-xs flex items-center justify-center">
                RK
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#042618]">Dr. Rajesh K.</h4>
                <span className="text-[10px] text-stone-500">General Physician • Pune</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FAQ ACCORDION */}
      <section id="faq" className="py-20 px-6 sm:px-10 max-w-4xl mx-auto z-10 scroll-mt-20">
        <div className="text-center mb-16">
          <span className="text-xs font-extrabold uppercase tracking-widest text-[#27794D] block mb-2">
            Frequently Asked Questions
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#042618] tracking-tight mb-4">
            Clear Answers to Important Questions
          </h2>
        </div>

        <div className="space-y-4">
          {/* FAQ 1 */}
          <div className="bg-white border border-stone-200/80 rounded-3xl overflow-hidden shadow-warm-sm transition-all">
            <button
              onClick={() => toggleFaq(0)}
              className="w-full p-6 text-left font-bold text-sm sm:text-base text-[#042618] flex items-center justify-between gap-4"
            >
              <span>Is the AI symptom summary a medical diagnosis?</span>
              <ChevronDown
                className={`w-5 h-5 text-[#27794D] transition-transform duration-300 ${
                  openFaq === 0 ? "rotate-180" : ""
                }`}
              />
            </button>
            {openFaq === 0 && (
              <div className="px-6 pb-6 text-xs sm:text-sm text-stone-600 leading-relaxed border-t border-stone-100 pt-4 font-normal">
                No. MediConnect&apos;s AI triage and lab summaries are clinical decision-support and preparatory tools. They help you organize symptoms and understand reference metrics before your appointment. Formal diagnoses and treatment plans are exclusively provided by licensed, verified doctors during consultations.
              </div>
            )}
          </div>

          {/* FAQ 2 */}
          <div className="bg-white border border-stone-200/80 rounded-3xl overflow-hidden shadow-warm-sm transition-all">
            <button
              onClick={() => toggleFaq(1)}
              className="w-full p-6 text-left font-bold text-sm sm:text-base text-[#042618] flex items-center justify-between gap-4"
            >
              <span>Is my health data and mental wellness confidential?</span>
              <ChevronDown
                className={`w-5 h-5 text-[#27794D] transition-transform duration-300 ${
                  openFaq === 1 ? "rotate-180" : ""
                }`}
              />
            </button>
            {openFaq === 1 && (
              <div className="px-6 pb-6 text-xs sm:text-sm text-stone-600 leading-relaxed border-t border-stone-100 pt-4 font-normal">
                Yes. We enforce strict relationship-based authorization. Doctors can only view your consolidated health metrics if there is an active, confirmed consultation slot. Furthermore, your confidential Mental Wellness conversations are strictly isolated and are never accessible to doctors.
              </div>
            )}
          </div>

          {/* FAQ 3 */}
          <div className="bg-white border border-stone-200/80 rounded-3xl overflow-hidden shadow-warm-sm transition-all">
            <button
              onClick={() => toggleFaq(2)}
              className="w-full p-6 text-left font-bold text-sm sm:text-base text-[#042618] flex items-center justify-between gap-4"
            >
              <span>How does doctor verification work on MediConnect?</span>
              <ChevronDown
                className={`w-5 h-5 text-[#27794D] transition-transform duration-300 ${
                  openFaq === 2 ? "rotate-180" : ""
                }`}
              />
            </button>
            {openFaq === 2 && (
              <div className="px-6 pb-6 text-xs sm:text-sm text-stone-600 leading-relaxed border-t border-stone-100 pt-4 font-normal">
                When a doctor signs up, their account is initialized with an unverified status. They cannot accept appointments or appear in patient directory search results until their medical license, council registration, and credentials have been verified.
              </div>
            )}
          </div>

          {/* FAQ 4 */}
          <div className="bg-white border border-stone-200/80 rounded-3xl overflow-hidden shadow-warm-sm transition-all">
            <button
              onClick={() => toggleFaq(3)}
              className="w-full p-6 text-left font-bold text-sm sm:text-base text-[#042618] flex items-center justify-between gap-4"
            >
              <span>How do digital prescriptions and signed PDFs work?</span>
              <ChevronDown
                className={`w-5 h-5 text-[#27794D] transition-transform duration-300 ${
                  openFaq === 3 ? "rotate-180" : ""
                }`}
              />
            </button>
            {openFaq === 3 && (
              <div className="px-6 pb-6 text-xs sm:text-sm text-stone-600 leading-relaxed border-t border-stone-100 pt-4 font-normal">
                Following a virtual consultation, your doctor compiles the prescribed medications, dosages, and administration intervals. The system generates a signed PDF prescription that is securely linked to your patient dashboard for immediate download.
              </div>
            )}
          </div>

          {/* FAQ 5 */}
          <div className="bg-white border border-stone-200/80 rounded-3xl overflow-hidden shadow-warm-sm transition-all">
            <button
              onClick={() => toggleFaq(4)}
              className="w-full p-6 text-left font-bold text-sm sm:text-base text-[#042618] flex items-center justify-between gap-4"
            >
              <span>Can I manage vaccines for my child or dependent?</span>
              <ChevronDown
                className={`w-5 h-5 text-[#27794D] transition-transform duration-300 ${
                  openFaq === 4 ? "rotate-180" : ""
                }`}
              />
            </button>
            {openFaq === 4 && (
              <div className="px-6 pb-6 text-xs sm:text-sm text-stone-600 leading-relaxed border-t border-stone-100 pt-4 font-normal">
                Yes. You can add dependent child profiles under your patient account. MediConnect automatically seeds the complete Universal Immunization Programme (UIP) schedule with automated due dates from birth. Connected doctors can also mark vaccines as administered.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 9. FOOTER */}
      <footer className="bg-white border-t border-stone-200/80 mt-20 pt-16 pb-12 px-6 sm:px-10 z-10 relative">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Col 1: Brand */}
          <div className="col-span-2 md:col-span-1 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#042618] flex items-center justify-center text-white shadow-warm-sm">
                <HeartPulse className="w-4 h-4 text-[#E0F2E7]" />
              </div>
              <span className="text-lg font-extrabold tracking-tight text-[#042618]">
                MediConnect
              </span>
            </div>
            <p className="text-xs text-stone-500 leading-relaxed">
              Calm, connected, and intelligent healthcare management linking patients and verified clinical practitioners.
            </p>
          </div>

          {/* Col 2: Solutions */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold text-[#042618] uppercase tracking-wider">
              Care Platform
            </h4>
            <ul className="space-y-2 text-xs text-stone-600">
              <li>
                <a href="#features" className="hover:text-[#042618]">Virtual Consultations</a>
              </li>
              <li>
                <a href="#features" className="hover:text-[#042618]">AI Symptom Checker</a>
              </li>
              <li>
                <a href="#lab-analysis" className="hover:text-[#042618]">Diagnostic Lab Summaries</a>
              </li>
              <li>
                <a href="#features" className="hover:text-[#042618]">UIP Vaccine Tracker</a>
              </li>
            </ul>
          </div>

          {/* Col 3: Portals */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold text-[#042618] uppercase tracking-wider">
              Portals
            </h4>
            <ul className="space-y-2 text-xs text-stone-600">
              <li>
                <Link href="/auth/patient" className="hover:text-[#042618]">Patient Login</Link>
              </li>
              <li>
                <Link href="/auth/doctor" className="hover:text-[#042618]">Doctor Portal</Link>
              </li>
              <li>
                <Link href="/auth/doctor" className="hover:text-[#042618]">Doctor Verification</Link>
              </li>
              <li>
                <Link href="/patient/dashboard" className="hover:text-[#042618]">Patient Dashboard</Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Trust & Compliance */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold text-[#042618] uppercase tracking-wider">
              Security & Privacy
            </h4>
            <ul className="space-y-2 text-xs text-stone-600">
              <li>
                <span className="text-stone-500">256-bit EHR Encryption</span>
              </li>
              <li>
                <span className="text-stone-500">Strict Relationship Gating</span>
              </li>
              <li>
                <span className="text-stone-500">Confidential Mental Logs</span>
              </li>
              <li>
                <span className="text-stone-500">Verified Licensure Badges</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-8 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-400">
          <p>&copy; {new Date().getFullYear()} MediConnect Healthcare Platform. All clinical records encrypted.</p>
          <p className="text-stone-400">Warm, compassionate healthcare technology</p>
        </div>
      </footer>
    </div>
  );
}

