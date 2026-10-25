import { redirect } from "next/navigation";
import { isAdmin } from "../../lib/admin-auth";
import { authConfigured, backendConfigured } from "../../lib/supabase";
import { readContent } from "../../lib/content";
import SetupNotice from "./setup-notice";
import Dashboard from "./dashboard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Private Dashboard — Shirsho Karmakar", robots: { index: false, follow: false } };

export default async function AdminPage() {
  if (!authConfigured() || !backendConfigured()) return <SetupNotice />;
  if (!await isAdmin()) redirect("/admin/login");
  return <Dashboard initial={await readContent()} />;
}
