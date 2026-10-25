import { redirect } from "next/navigation";
import { adminEmail, isAdmin } from "../../../lib/admin-auth";
import { authConfigured, backendConfigured } from "../../../lib/supabase";
import SetupNotice from "../setup-notice";
import LoginForm from "./login-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard sign-in — Shirsho Karmakar", robots: { index: false, follow: false } };

export default async function LoginPage() {
  if (!authConfigured() || !backendConfigured()) return <SetupNotice />;
  if (await isAdmin()) redirect("/admin");
  return <main className="access-page login-page wrap"><a className="text-link" href="/">← Back to portfolio</a><span className="mono login-eyebrow">PRIVATE WORKSPACE</span><h1>Welcome back.</h1><p>Sign in to update your projects and profile.</p><LoginForm email={adminEmail()} /></main>;
}
