"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Browser-only Supabase client.
 *
 * There is no server in this deployment (Next.js static export on Cloudflare
 * Pages), so the anon key ships to the browser — which is exactly what it is
 * designed for. Every read and write is authorised by PostgreSQL Row Level
 * Security (supabase/migrations), never by anything in this file.
 *
 * The service-role key is deliberately absent from this project's frontend
 * env, and must never be added here: `.env.example` documents that it belongs
 * only in local scripts and CI, never in a NEXT_PUBLIC_ variable.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || "";

let client: SupabaseClient | null = null;

export function isBackendConfigured(): boolean {
  return Boolean(url && anonKey);
}

export function getSupabase(): SupabaseClient | null {
  if (!isBackendConfigured()) return null;
  if (!client) {
    client = createClient(url as string, anonKey as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: "pkce",
      },
      global: {
        headers: { "x-application-name": "kosa-website" },
      },
    });
  }
  return client;
}

/** Turnstile tokens are single-use; call this before each auth attempt. */
export async function getCaptchaToken(): Promise<string | undefined> {
  if (!TURNSTILE_SITE_KEY || typeof window === "undefined") return undefined;
  const turnstile = (window as unknown as {
    turnstile?: { getResponse: (id?: string) => string | undefined };
  }).turnstile;
  return turnstile?.getResponse();
}

export function siteUrl(): string {
  if (typeof window !== "undefined") return window.location.origin;
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://localhost:3000";
}
