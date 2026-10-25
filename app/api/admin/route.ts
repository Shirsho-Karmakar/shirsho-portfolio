import { isAdmin, sameOrigin } from "../../../lib/admin-auth";
import { readContent, writeContent } from "../../../lib/content";
import { contentSchema } from "../../../lib/portfolio-data";
export async function GET() {
  if (!await isAdmin()) return Response.json({ error: "Unauthorized" }, { status: 403 });
  return Response.json(await readContent(), { headers: { "Cache-Control": "no-store" } });
}
export async function PUT(request: Request) {
  if (!await isAdmin()) return Response.json({ error: "Unauthorized" }, { status: 403 });
  if (!sameOrigin(request)) return Response.json({ error: "Invalid request origin" }, { status: 403 });
  const body = await request.text();
  if (body.length > 300_000) return Response.json({ error: "Content is too large" }, { status: 413 });
  let value;
  try { value = contentSchema.safeParse(JSON.parse(body)); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }
  if (!value.success) return Response.json({ error: value.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join("; ") }, { status: 400 });
  try {
    await writeContent(value.data);
    return Response.json({ saved: true });
  } catch { return Response.json({ error: "Could not save changes. Please check the editing backend and try again." }, { status: 503 }); }
}
