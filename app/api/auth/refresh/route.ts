import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { isAdmin, allowedUser, REFRESH_COOKIE, sameOrigin, setSessionCookies, clearSessionCookies, type AuthSession } from "../../../../lib/admin-auth";
import { authConfigured, supabaseRequest } from "../../../../lib/supabase";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  if (await isAdmin()) return NextResponse.json({ signedIn: true }, { headers: { "Cache-Control": "no-store" } });
  const token = (await cookies()).get(REFRESH_COOKIE)?.value;
  if (!token || !authConfigured()) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  try {
    const result = await supabaseRequest("/auth/v1/token?grant_type=refresh_token", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ refresh_token: token }) }, "publishable");
    if (!result.ok) {
      if (result.status >= 500 || result.status === 429) return NextResponse.json({ error: "Sign-in is temporarily unavailable." }, { status: 503 });
      const response = NextResponse.json({ error: "Please sign in again." }, { status: 401 });
      clearSessionCookies(response);
      return response;
    }
    const session = await result.json() as AuthSession;
    if (!allowedUser(session.user) || !session.access_token || !session.refresh_token || !Number.isFinite(session.expires_in)) {
      const response = NextResponse.json({ error: "Please sign in again." }, { status: 401 });
      clearSessionCookies(response);
      return response;
    }
    const response = NextResponse.json({ signedIn: true }, { headers: { "Cache-Control": "no-store" } });
    setSessionCookies(response, session);
    return response;
  } catch { return NextResponse.json({ error: "Sign-in is temporarily unavailable." }, { status: 503 }); }
}
