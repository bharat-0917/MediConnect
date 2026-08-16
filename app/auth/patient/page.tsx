"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { signIn } from "next-auth/react";
import { registerPatient } from "@/app/actions/auth";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  dateOfBirth: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date of birth",
  }),
  gender: z.string().min(1, "Gender is required"),
  bloodGroup: z.string().optional(),
  emergencyContact: z.string().min(10, "Emergency contact must be at least 10 digits"),
  address: z.string().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type SignupFormValues = z.infer<typeof signupSchema>;

export default function PatientAuthPage() {
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
        router.push("/patient/dashboard");
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
      const res = await registerPatient(data);
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
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-teal-500/5 blur-[120px] pointer-events-none" />

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
            Patient Portal
          </h1>
          <p className="text-slate-400 text-center">
            Create an account or login to track health metrics and consult doctors
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
                ? "border-cyan-500 text-cyan-400"
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
                ? "border-cyan-500 text-cyan-400"
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
          <div className="p-4 mb-6 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm">
            Registration successful! You can now login.
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
                className="w-full bg-slate-900/60 border border-slate-700 rounded-2xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                placeholder="patient@mediconnect.com"
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
                className="w-full bg-slate-900/60 border border-slate-700 rounded-2xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                placeholder="••••••••"
              />
              {loginErrors.password && (
                <p className="mt-2 text-sm text-red-400">{loginErrors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold rounded-2xl shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                  className="w-full bg-slate-900/60 border border-slate-700 rounded-2xl px-4 py-3 text-slate-100 focus:outline-none focus:border-cyan-500"
                  placeholder="John Doe"
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
                  className="w-full bg-slate-900/60 border border-slate-700 rounded-2xl px-4 py-3 text-slate-100 focus:outline-none focus:border-cyan-500"
                  placeholder="john.doe@gmail.com"
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
                  className="w-full bg-slate-900/60 border border-slate-700 rounded-2xl px-4 py-3 text-slate-100 focus:outline-none focus:border-cyan-500"
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
                  className="w-full bg-slate-900/60 border border-slate-700 rounded-2xl px-4 py-3 text-slate-100 focus:outline-none focus:border-cyan-500"
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
                  Date of Birth
                </label>
                <input
                  type="date"
                  {...signupRegister("dateOfBirth")}
                  className="w-full bg-slate-900/60 border border-slate-700 rounded-2xl px-4 py-3 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
                {signupErrors.dateOfBirth && (
                  <p className="mt-2 text-sm text-red-400">{signupErrors.dateOfBirth.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Gender
                </label>
                <select
                  {...signupRegister("gender")}
                  className="w-full bg-slate-900/60 border border-slate-700 rounded-2xl px-4 py-3 text-slate-100 focus:outline-none focus:border-cyan-500"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                {signupErrors.gender && (
                  <p className="mt-2 text-sm text-red-400">{signupErrors.gender.message}</p>
                )}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Blood Group (Optional)
                </label>
                <select
                  {...signupRegister("bloodGroup")}
                  className="w-full bg-slate-900/60 border border-slate-700 rounded-2xl px-4 py-3 text-slate-100 focus:outline-none focus:border-cyan-500"
                >
                  <option value="">Select Blood Group</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Emergency Contact Number
                </label>
                <input
                  type="text"
                  {...signupRegister("emergencyContact")}
                  className="w-full bg-slate-900/60 border border-slate-700 rounded-2xl px-4 py-3 text-slate-100 focus:outline-none focus:border-cyan-500"
                  placeholder="1234567890"
                />
                {signupErrors.emergencyContact && (
                  <p className="mt-2 text-sm text-red-400">{signupErrors.emergencyContact.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Home Address (Optional)
              </label>
              <textarea
                {...signupRegister("address")}
                rows={3}
                className="w-full bg-slate-900/60 border border-slate-700 rounded-2xl px-4 py-3 text-slate-100 focus:outline-none focus:border-cyan-500 resize-none"
                placeholder="Enter your street address..."
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold rounded-2xl shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Registering..." : "Submit Registration"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
