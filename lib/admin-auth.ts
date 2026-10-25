import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { authConfigured, supabaseRequest } from "./supabase";

export const ACCESS_COOKIE = "portfolio-access";
export const REFRESH_COOKIE = "portfolio-refresh";
type AuthUser = { id: string; email?: string; email_confirmed_at?: string };
export type AuthSession = { access_token: string; refresh_token: string; expires_in: number; user: AuthUser };

export function adminEmail() {
  return (process.env.ADMIN_EMAIL || "2005shirsho@gmail.com").trim().toLowerCase();
}

export function allowedUser(user: AuthUser | null | undefined) {
  return Boolean(user?.id && user.email?.toLowerCase() === adminEmail() && user.email_confirmed_at);
}

export async function isAdmin() {
  if (!authConfigured()) return false;
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) return false;
  try {
    // Verify with the identity provider. Never trust caller-supplied identity
    // headers or a decoded JWT payload on the public Vercel deployment.
    const response = await supabaseRequest("/auth/v1/user", { headers: { Authorization: `Bearer ${token}` } }, "publishable");
    return response.ok && allowedUser(await response.json() as AuthUser);
  } catch { return false; }
}

export function setSessionCookies(response: NextResponse, session: AuthSession) {
  const options = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/" };
  response.cookies.set(ACCESS_COOKIE, session.access_token, { ...options, maxAge: Math.min(session.expires_in, 3600) });
  response.cookies.set(REFRESH_COOKIE, session.refresh_token, { ...options, maxAge: 60 * 60 * 24 * 7 });
}

export function clearSessionCookies(response: NextResponse) {
  const options = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/", maxAge: 0 };
  response.cookies.set(ACCESS_COOKIE, "", options);
  response.cookies.set(REFRESH_COOKIE, "", options);
}

export function sameOrigin(request: Request) {
  return request.headers.get("origin") === new URL(request.url).origin;
}
