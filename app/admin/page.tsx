import { requireChatGPTUser, chatGPTSignOutPath } from "../chatgpt-auth";
import { isAdmin } from "../../lib/admin-auth";
import { readContent } from "../../lib/content";
import Dashboard from "./dashboard";
export const dynamic = "force-dynamic";
export const metadata = { title: "Private Dashboard — Shirsho Karmakar", robots: { index: false, follow: false } };
export default async function AdminPage() {
  await requireChatGPTUser("/admin");
  if (!await isAdmin()) return <main className="access-page wrap"><a href="/" className="text-link">← Back to portfolio</a><h1>Private dashboard</h1><p>This account does not have editing access. Sign in using the portfolio’s administrator email.</p><a className="primary-button" href={chatGPTSignOutPath("/admin")} target="_top">Sign out and switch account ↗</a></main>;
  return <Dashboard initial={await readContent()} signOutPath={chatGPTSignOutPath("/")} />;
}
