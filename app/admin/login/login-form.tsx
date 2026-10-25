"use client";
import { useEffect, useState } from "react";

export default function LoginForm({ email }: { email: string }) {
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/auth/refresh", { method: "POST" }).then(response => {
      if (response.ok && active) window.location.replace("/admin");
    }).catch(() => {}).finally(() => { if (active) setChecking(false); });
    return () => { active = false; };
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: form.get("email"), password: form.get("password") }) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Could not sign in. Please try again.");
      window.location.replace("/admin");
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Could not sign in. Please try again."); setBusy(false); }
  }

  return <form className="login-form" onSubmit={submit}><label>Email address<input type="email" name="email" defaultValue={email} autoComplete="username" required maxLength={254} disabled={busy || checking} /></label><label>Password<input type="password" name="password" autoComplete="current-password" required maxLength={1024} disabled={busy || checking} /></label>{error && <p className="login-error" role="alert">{error}</p>}<button className="primary-button" type="submit" disabled={busy || checking}>{checking ? "Checking session…" : busy ? "Signing in…" : "Sign in ↗"}</button><p className="field-hint">This sign-in is only for managing the portfolio. Everyone can view the website freely.</p></form>;
}
