import { handlers } from "@/lib/auth";

/**
 * NextAuth.js v5 route handler for the App Router.
 * This exports the GET and POST handlers to handle all auth endpoints:
 * - /api/auth/signin
 * - /api/auth/signout
 * - /api/auth/callback/*
 * - /api/auth/session
 */
export const { GET, POST } = handlers;
