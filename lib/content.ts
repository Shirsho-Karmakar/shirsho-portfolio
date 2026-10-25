import { env } from "cloudflare:workers";
import { contentSchema, initialContent, type PortfolioContent } from "./portfolio-data";
export async function readContent(): Promise<PortfolioContent> {
  if (!env.DB) throw new Error("The portfolio database is not configured.");
  const row = await env.DB.prepare("SELECT data FROM portfolio_content WHERE id = ?").bind("portfolio").first<{ data: string }>();
  return row ? contentSchema.parse(JSON.parse(row.data)) : structuredClone(initialContent);
}
export async function writeContent(content: PortfolioContent) {
  if (!env.DB) throw new Error("The portfolio database is not configured.");
  await env.DB.prepare("INSERT INTO portfolio_content (id, data, updated_at) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at")
    .bind("portfolio", JSON.stringify(content), new Date().toISOString()).run();
}
