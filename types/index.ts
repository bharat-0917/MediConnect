/**
 * Shared TypeScript types for MediConnect
 * Add domain-specific types here as the project grows.
 */

// Re-export prisma types for convenience
export type { User, Account, Session } from "@prisma/client";

// Auth types
export interface AuthUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

// API response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
