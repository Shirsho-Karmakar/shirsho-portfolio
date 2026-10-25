import { NextResponse } from "next/server";
import { z } from "zod";
import { adminEmail, allowedUser, sameOrigin, setSessionCookies, type AuthSession } from "../../../../lib/admin-auth";
import { authConfigured, supabaseRequest } from "../../../../lib/supabase";

const credentials = z.object({ email: z.string().trim().email().max(254), password: z.string().min(1).max(1024) });

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  if (!authConfigured()) return NextResponse.json({ error: "Dashboard sign-in has not been connected yet." }, { status: 503 });
  const text = await request.text();
  if (text.length > 8192) return NextResponse.json({ error: "Invalid credentials." }, { status: 400 });
  let parsed;
  try { parsed = credentials.safeParse(JSON.parse(text)); } catch { return NextResponse.json({ error: "Invalid credentials." }, { status: 400 }); }
  if (!parsed.success) return NextResponse.json({ error: "Enter your email and password." }, { status: 400 });
  if (parsed.data.email.toLowerCase() !== adminEmail()) return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 });
  try {
    const result = await supabaseRequest("/auth/v1/token?grant_type=password", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed.data),
    }, "publishable");
    if (!result.ok) {
      if (result.status >= 500) return NextResponse.json({ error: "Sign-in is temporarily unavailable. Please try again shortly." }, { status: 503 });
      return NextResponse.json({ error: result.status === 429 ? "Too many attempts. Please try again later." : "Email or password is incorrect." }, { status: result.status === 429 ? 429 : 401 });
    }
    const session = await result.json() as AuthSession;
    if (!allowedUser(session.user) || !session.access_token || !session.refresh_token || !Number.isFinite(session.expires_in)) {
      return NextResponse.json({ error: "This account does not have dashboard access." }, { status: 403 });
    }
    const response = NextResponse.json({ signedIn: true }, { headers: { "Cache-Control": "no-store" } });
    setSessionCookies(response, session);
    return response;
  } catch { return NextResponse.json({ error: "Sign-in is unavailable. Please try again shortly." }, { status: 503 }); }
}
