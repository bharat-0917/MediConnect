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
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center items-center py-12 px-6 relative font-sans">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-teal-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-500/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-2xl bg-slate-800/40 border border-slate-700/60 rounded-3xl p-8 shadow-2xl backdrop-blur-md relative z-10">
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-teal-500 to-cyan-400 flex items-center justify-center font-bold text-slate-950 text-base">
              M
            </div>
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-teal-400 to-cyan-300 bg-clip-text text-transparent">
              MediConnect
            </span>
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">
            Doctor Portal
          </h1>
          <p className="text-slate-400 text-center">
            Access your medical dashboard and manage your patient care
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700 mb-8">
          <button
            onClick={() => {
              setActiveTab("login");
              setError(null);
              setSignupSuccess(false);
            }}
            className={`flex-1 pb-4 text-lg font-semibold border-b-2 transition-colors ${
              activeTab === "login"
                ? "border-teal-500 text-teal-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Login
          </button>
          <button
            onClick={() => {
              setActiveTab("signup");
              setError(null);
              setSignupSuccess(false);
            }}
            className={`flex-1 pb-4 text-lg font-semibold border-b-2 transition-colors ${
              activeTab === "signup"
                ? "border-teal-500 text-teal-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Register
          </button>
        </div>

        {error && (
          <div className="p-4 mb-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        {signupSuccess && (
          <div className="p-4 mb-6 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 text-sm">
            Registration successful! Your account is pending verification. You can now login.
          </div>
        )}

        {/* Forms */}
        {activeTab === "login" ? (
          <form onSubmit={handleLoginSubmit(onLogin)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                {...loginRegister("email")}
                className="w-full bg-slate-900/60 border border-slate-700 rounded-2xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
                placeholder="doctor@mediconnect.com"
              />
              {loginErrors.email && (
                <p className="mt-2 text-sm text-red-400">{loginErrors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <input
                type="password"
                {...loginRegister("password")}
                className="w-full bg-slate-900/60 border border-slate-700 rounded-2xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
                placeholder="••••••••"
              />
              {loginErrors.password && (
                <p className="mt-2 text-sm text-red-400">{loginErrors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold rounded-2xl shadow-lg shadow-teal-500/10 hover:shadow-teal-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignupSubmit(onSignup)} className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  {...signupRegister("name")}
                  className="w-full bg-slate-900/60 border border-slate-700 rounded-2xl px-4 py-3 text-slate-100 focus:outline-none focus:border-teal-500"
                  placeholder="Dr. Jane Doe"
                />
                {signupErrors.name && (
                  <p className="mt-2 text-sm text-red-400">{signupErrors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  {...signupRegister("email")}
                  className="w-full bg-slate-900/60 border border-slate-700 rounded-2xl px-4 py-3 text-slate-100 focus:outline-none focus:border-teal-500"
                  placeholder="jane.doe@hospital.com"
                />
                {signupErrors.email && (
                  <p className="mt-2 text-sm text-red-400">{signupErrors.email.message}</p>
                )}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  {...signupRegister("password")}
                  className="w-full bg-slate-900/60 border border-slate-700 rounded-2xl px-4 py-3 text-slate-100 focus:outline-none focus:border-teal-500"
                  placeholder="••••••••"
                />
                {signupErrors.password && (
                  <p className="mt-2 text-sm text-red-400">{signupErrors.password.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Phone Number
                </label>
                <input
                  type="text"
                  {...signupRegister("phone")}
                  className="w-full bg-slate-900/60 border border-slate-700 rounded-2xl px-4 py-3 text-slate-100 focus:outline-none focus:border-teal-500"
                  placeholder="1234567890"
                />
                {signupErrors.phone && (
                  <p className="mt-2 text-sm text-red-400">{signupErrors.phone.message}</p>
                )}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Specialization
                </label>
                <input
                  type="text"
                  {...signupRegister("specialization")}
                  className="w-full bg-slate-900/60 border border-slate-700 rounded-2xl px-4 py-3 text-slate-100 focus:outline-none focus:border-teal-500"
                  placeholder="Cardiologist, Neurologist, etc."
                />
                {signupErrors.specialization && (
                  <p className="mt-2 text-sm text-red-400">{signupErrors.specialization.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Qualifications
                </label>
                <input
                  type="text"
                  {...signupRegister("qualifications")}
                  className="w-full bg-slate-900/60 border border-slate-700 rounded-2xl px-4 py-3 text-slate-100 focus:outline-none focus:border-teal-500"
                  placeholder="MD, MBBS, PhD"
                />
                {signupErrors.qualifications && (
                  <p className="mt-2 text-sm text-red-400">{signupErrors.qualifications.message}</p>
                )}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Hospital Affiliation
                </label>
                <input
                  type="text"
                  {...signupRegister("hospitalAffiliation")}
                  className="w-full bg-slate-900/60 border border-slate-700 rounded-2xl px-4 py-3 text-slate-100 focus:outline-none focus:border-teal-500"
                  placeholder="City General Hospital"
                />
                {signupErrors.hospitalAffiliation && (
                  <p className="mt-2 text-sm text-red-400">{signupErrors.hospitalAffiliation.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Medical License Number
                </label>
                <input
                  type="text"
                  {...signupRegister("licenseNumber")}
                  className="w-full bg-slate-900/60 border border-slate-700 rounded-2xl px-4 py-3 text-slate-100 focus:outline-none focus:border-teal-500"
                  placeholder="LIC-1234567"
                />
                {signupErrors.licenseNumber && (
                  <p className="mt-2 text-sm text-red-400">{signupErrors.licenseNumber.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Consultation Fee ($)
              </label>
              <input
                type="number"
                {...signupRegister("consultationFee")}
                className="w-full bg-slate-900/60 border border-slate-700 rounded-2xl px-4 py-3 text-slate-100 focus:outline-none focus:border-teal-500"
                placeholder="100"
              />
              {signupErrors.consultationFee && (
                <p className="mt-2 text-sm text-red-400">{signupErrors.consultationFee.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Short Bio / Description
              </label>
              <textarea
                {...signupRegister("bio")}
                rows={3}
                className="w-full bg-slate-900/60 border border-slate-700 rounded-2xl px-4 py-3 text-slate-100 focus:outline-none focus:border-teal-500 resize-none"
                placeholder="Tell us about your medical background..."
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold rounded-2xl shadow-lg shadow-teal-500/10 hover:shadow-teal-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Registering..." : "Submit Registration"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
