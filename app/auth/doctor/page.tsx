"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { signIn } from "next-auth/react";
import { registerDoctor } from "@/app/actions/auth";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  specialization: z.string().min(2, "Specialization is required"),
  qualifications: z.string().min(2, "Qualifications are required"),
  hospitalAffiliation: z.string().min(2, "Hospital affiliation is required"),
  licenseNumber: z.string().min(2, "License number is required"),
  consultationFee: z.coerce.number().min(0, "Fee must be a positive number"),
  bio: z.string().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type SignupFormValues = z.infer<typeof signupSchema>;

export default function DoctorAuthPage() {
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const router = useRouter();

  // Login Form
  const {
    register: loginRegister,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  // Signup Form
  const {
    register: signupRegister,
    handleSubmit: handleSignupSubmit,
    formState: { errors: signupErrors },
    reset: resetSignup,
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
  });

  const onLogin = async (data: LoginFormValues) => {
    setError(null);
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (res?.error) {
        setError("Invalid email or password");
      } else {
        router.push("/doctor/dashboard");
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const onSignup = async (data: SignupFormValues) => {
    setError(null);
    setLoading(true);
    try {
      const res = await registerDoctor(data);
      if (res.success) {
        setSignupSuccess(true);
        resetSignup();
        setActiveTab("login");
      } else {
        setError(res.error || "Failed to register");
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-stone-800 flex flex-col justify-center items-center py-12 px-6 relative font-sans">
      <div className="absolute top-[-5%] left-[-5%] w-[45%] h-[45%] rounded-full bg-[#E0F2E7]/40 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-5%] right-[-5%] w-[45%] h-[45%] rounded-full bg-[#EAE7DC]/50 blur-[100px] pointer-events-none" />

      <div className="w-full max-w-2xl bg-white border border-stone-200/80 rounded-3xl p-8 sm:p-10 shadow-warm-md relative z-10">
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex items-center gap-2 mb-4 group">
            <div className="w-9 h-9 rounded-xl bg-[#042618] flex items-center justify-center text-white font-bold text-sm shadow-warm-sm group-hover:scale-105 transition-transform">
              M
            </div>
            <span className="text-xl font-bold tracking-tight text-[#042618]">
              MediConnect
            </span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#042618] mb-2">
            Doctor Portal
          </h1>
          <p className="text-stone-600 text-sm text-center">
            Access your clinical dashboard and manage patient consultations
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-stone-200 mb-8">
          <button
            onClick={() => {
              setActiveTab("login");
              setError(null);
              setSignupSuccess(false);
            }}
            className={`flex-1 pb-3.5 text-base font-bold border-b-2 transition-colors ${
              activeTab === "login"
                ? "border-[#042618] text-[#042618]"
                : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setActiveTab("signup");
              setError(null);
              setSignupSuccess(false);
            }}
            className={`flex-1 pb-3.5 text-base font-bold border-b-2 transition-colors ${
              activeTab === "signup"
                ? "border-[#042618] text-[#042618]"
                : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div className="p-4 mb-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium">
            {error}
          </div>
        )}

        {signupSuccess && (
          <div className="p-4 mb-6 rounded-2xl bg-[#E0F2E7] border border-[#C1E5D0] text-[#042618] text-sm font-medium">
            Registration submitted! Your profile is pending administrative verification. You may now sign in.
          </div>
        )}

        {/* Forms */}
        {activeTab === "login" ? (
          <form onSubmit={handleLoginSubmit(onLogin)} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-2">
                Email Address
              </label>
              <input
                type="email"
                {...loginRegister("email")}
                className="w-full bg-stone-50/60 border border-stone-200 rounded-2xl px-4 py-3 text-stone-900 placeholder-stone-400 focus:outline-none focus:bg-white focus:border-[#042618] focus:ring-1 focus:ring-[#042618] transition-all text-sm"
                placeholder="doctor@mediconnect.com"
              />
              {loginErrors.email && (
                <p className="mt-1.5 text-xs text-rose-600 font-medium">{loginErrors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-2">
                Password
              </label>
              <input
                type="password"
                {...loginRegister("password")}
                className="w-full bg-stone-50/60 border border-stone-200 rounded-2xl px-4 py-3 text-stone-900 placeholder-stone-400 focus:outline-none focus:bg-white focus:border-[#042618] focus:ring-1 focus:ring-[#042618] transition-all text-sm"
                placeholder="••••••••"
              />
              {loginErrors.password && (
                <p className="mt-1.5 text-xs text-rose-600 font-medium">{loginErrors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#042618] hover:bg-[#073824] text-white font-bold rounded-2xl shadow-warm-sm hover:shadow-warm-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {loading ? "Authenticating..." : "Sign In to Portal"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignupSubmit(onSignup)} className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  {...signupRegister("name")}
                  className="w-full bg-stone-50/60 border border-stone-200 rounded-2xl px-4 py-2.5 text-stone-900 focus:outline-none focus:bg-white focus:border-[#042618] text-sm"
                  placeholder="Dr. Jane Doe"
                />
                {signupErrors.name && (
                  <p className="mt-1 text-xs text-rose-600">{signupErrors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  {...signupRegister("email")}
                  className="w-full bg-stone-50/60 border border-stone-200 rounded-2xl px-4 py-2.5 text-stone-900 focus:outline-none focus:bg-white focus:border-[#042618] text-sm"
                  placeholder="jane.doe@hospital.com"
                />
                {signupErrors.email && (
                  <p className="mt-1 text-xs text-rose-600">{signupErrors.email.message}</p>
                )}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  {...signupRegister("password")}
                  className="w-full bg-stone-50/60 border border-stone-200 rounded-2xl px-4 py-2.5 text-stone-900 focus:outline-none focus:bg-white focus:border-[#042618] text-sm"
                  placeholder="••••••••"
                />
                {signupErrors.password && (
                  <p className="mt-1 text-xs text-rose-600">{signupErrors.password.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-2">
                  Phone Number
                </label>
                <input
                  type="text"
                  {...signupRegister("phone")}
                  className="w-full bg-stone-50/60 border border-stone-200 rounded-2xl px-4 py-2.5 text-stone-900 focus:outline-none focus:bg-white focus:border-[#042618] text-sm"
                  placeholder="9876543210"
                />
                {signupErrors.phone && (
                  <p className="mt-1 text-xs text-rose-600">{signupErrors.phone.message}</p>
                )}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-2">
                  Specialization
                </label>
                <input
                  type="text"
                  {...signupRegister("specialization")}
                  className="w-full bg-stone-50/60 border border-stone-200 rounded-2xl px-4 py-2.5 text-stone-900 focus:outline-none focus:bg-white focus:border-[#042618] text-sm"
                  placeholder="Cardiologist, Neurologist..."
                />
                {signupErrors.specialization && (
                  <p className="mt-1 text-xs text-rose-600">{signupErrors.specialization.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-2">
                  Qualifications
                </label>
                <input
                  type="text"
                  {...signupRegister("qualifications")}
                  className="w-full bg-stone-50/60 border border-stone-200 rounded-2xl px-4 py-2.5 text-stone-900 focus:outline-none focus:bg-white focus:border-[#042618] text-sm"
                  placeholder="MD, MBBS, DM"
                />
                {signupErrors.qualifications && (
                  <p className="mt-1 text-xs text-rose-600">{signupErrors.qualifications.message}</p>
                )}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-2">
                  Hospital Affiliation
                </label>
                <input
                  type="text"
                  {...signupRegister("hospitalAffiliation")}
                  className="w-full bg-stone-50/60 border border-stone-200 rounded-2xl px-4 py-2.5 text-stone-900 focus:outline-none focus:bg-white focus:border-[#042618] text-sm"
                  placeholder="Apollo Hospitals, AIIMS"
                />
                {signupErrors.hospitalAffiliation && (
                  <p className="mt-1 text-xs text-rose-600">{signupErrors.hospitalAffiliation.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-2">
                  License Number
                </label>
                <input
                  type="text"
                  {...signupRegister("licenseNumber")}
                  className="w-full bg-stone-50/60 border border-stone-200 rounded-2xl px-4 py-2.5 text-stone-900 focus:outline-none focus:bg-white focus:border-[#042618] text-sm"
                  placeholder="MCI-12345"
                />
                {signupErrors.licenseNumber && (
                  <p className="mt-1 text-xs text-rose-600">{signupErrors.licenseNumber.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-2">
                Consultation Fee ($ / ₹)
              </label>
              <input
                type="number"
                {...signupRegister("consultationFee")}
                className="w-full bg-stone-50/60 border border-stone-200 rounded-2xl px-4 py-2.5 text-stone-900 focus:outline-none focus:bg-white focus:border-[#042618] text-sm"
                placeholder="500"
              />
              {signupErrors.consultationFee && (
                <p className="mt-1 text-xs text-rose-600">{signupErrors.consultationFee.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-2">
                Professional Bio
              </label>
              <textarea
                {...signupRegister("bio")}
                rows={3}
                className="w-full bg-stone-50/60 border border-stone-200 rounded-2xl px-4 py-2.5 text-stone-900 focus:outline-none focus:bg-white focus:border-[#042618] resize-none text-sm"
                placeholder="Brief clinical background and areas of interest..."
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#042618] hover:bg-[#073824] text-white font-bold rounded-2xl shadow-warm-sm hover:shadow-warm-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {loading ? "Registering..." : "Submit Doctor Registration"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
