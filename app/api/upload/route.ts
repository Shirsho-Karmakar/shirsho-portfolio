import { env } from "cloudflare:workers";
import { isAdmin, sameOrigin } from "../../../lib/admin-auth";
export async function POST(request: Request) {
  if (!await isAdmin() || !sameOrigin(request)) return Response.json({ error: "Unauthorized" }, { status: 403 });
  if (!env.BUCKET) return Response.json({ error: "Upload storage is unavailable" }, { status: 503 });
  if (Number(request.headers.get("content-length")) > 5_300_000) return Response.json({ error: "Maximum file size is 5 MB" }, { status: 413 });
  const data = await request.formData();
  const file = data.get("file");
  if (!(file instanceof File) || !file.size) return Response.json({ error: "Choose a file to upload" }, { status: 400 });
  if (file.size > 5 * 1024 * 1024) return Response.json({ error: "Maximum file size is 5 MB" }, { status: 413 });
  const bytes = new Uint8Array(await file.arrayBuffer());
  const prefix = new TextDecoder().decode(bytes.slice(0, 12));
  const types: Record<string, { extension: string; valid: boolean }> = {
    "image/png": { extension: "png", valid: bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71 && bytes[4] === 13 && bytes[5] === 10 && bytes[6] === 26 && bytes[7] === 10 },
    "image/jpeg": { extension: "jpg", valid: bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 },
    "image/webp": { extension: "webp", valid: prefix.startsWith("RIFF") && prefix.slice(8) === "WEBP" },
    "application/pdf": { extension: "pdf", valid: prefix.startsWith("%PDF-") },
  };
  const type = types[file.type];
  if (!type?.valid) return Response.json({ error: "Upload a valid PNG, JPEG, WebP, or PDF" }, { status: 400 });
  const key = `${crypto.randomUUID()}.${type.extension}`;
  await env.BUCKET.put(key, bytes, { httpMetadata: { contentType: file.type } });
  return Response.json({ path: `/api/media/${key}` });
}
