import { contentSchema, initialContent, type PortfolioContent } from "./portfolio-data";
import { backendConfigured, supabaseRequest } from "./supabase";

export async function readContent(): Promise<PortfolioContent> {
  // The public portfolio can be deployed before its editing backend is set up.
  if (!backendConfigured()) return structuredClone(initialContent);
  const response = await supabaseRequest("/rest/v1/portfolio_content?id=eq.portfolio&select=data&limit=1");
  if (!response.ok) throw new Error(`Could not load portfolio content (${response.status}).`);
  const rows = await response.json() as { data: unknown }[];
  return rows.length ? contentSchema.parse(rows[0].data) : structuredClone(initialContent);
}

export async function writeContent(content: PortfolioContent) {
  const response = await supabaseRequest("/rest/v1/portfolio_content?on_conflict=id", {
    method: "POST",
    headers: { "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({ id: "portfolio", data: content, updated_at: new Date().toISOString() }),
  });
  if (!response.ok) throw new Error(`Could not save portfolio content (${response.status}).`);
}
