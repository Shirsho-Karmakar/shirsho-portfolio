import { backendConfigured, storageBucket, supabaseRequest } from "../../../../lib/supabase";
export async function GET(_request: Request, context: { params: Promise<{ key: string }> }) {
  const { key } = await context.params;
  if (!/^[a-f0-9-]{36}\.(png|jpg|webp|pdf)$/.test(key) || !backendConfigured()) return new Response("Not found", { status: 404 });
  try {
    const object = await supabaseRequest(`/storage/v1/object/authenticated/${encodeURIComponent(storageBucket())}/${key}`);
    if (object.status === 404 || object.status === 400) return new Response("Not found", { status: 404 });
    if (!object.ok) return new Response("File storage is temporarily unavailable", { status: 503 });
    const type = key.endsWith(".pdf") ? "application/pdf" : key.endsWith(".png") ? "image/png" : key.endsWith(".webp") ? "image/webp" : "image/jpeg";
    return new Response(object.body, { headers: { "Content-Type": type, "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff", "Content-Security-Policy": "default-src 'none'; sandbox", "Content-Disposition": `inline; filename="${key}"` } });
  } catch { return new Response("File storage is temporarily unavailable", { status: 503 }); }
}
