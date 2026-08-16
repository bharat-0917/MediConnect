import NextAuth from "next-auth";
import { authConfig } from "./lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;
  const pathname = req.nextUrl.pathname;

  // Protect /doctor/*
  if (pathname.startsWith("/doctor")) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/auth/doctor", req.nextUrl));
    }
    if (role !== "DOCTOR") {
      return NextResponse.redirect(new URL("/", req.nextUrl));
    }
  }

  // Protect /patient/*
  if (pathname.startsWith("/patient")) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/auth/patient", req.nextUrl));
    }
    if (role !== "PATIENT") {
      return NextResponse.redirect(new URL("/", req.nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/doctor/:path*", "/patient/:path*"],
};
