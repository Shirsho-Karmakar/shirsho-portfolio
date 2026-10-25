import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ACCESS_COOKIE, clearSessionCookies, sameOrigin } from "../../../../lib/admin-auth";
import { authConfigured, supabaseRequest } from "../../../../lib/supabase";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  const response = NextResponse.json({ signedOut: true }, { headers: { "Cache-Control": "no-store" } });
  clearSessionCookies(response);
  if (token && authConfigured()) {
    try { await supabaseRequest("/auth/v1/logout?scope=local", { method: "POST", headers: { Authorization: `Bearer ${token}` } }, "publishable"); } catch { /* Local cookies are cleared even if the provider is unreachable. */ }
  }
  return response;
}
