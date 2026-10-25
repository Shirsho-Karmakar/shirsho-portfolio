import { isAdmin, sameOrigin } from "../../../lib/admin-auth";
import { backendConfigured, storageBucket, supabaseRequest } from "../../../lib/supabase";
export async function POST(request: Request) {
  if (!await isAdmin() || !sameOrigin(request)) return Response.json({ error: "Unauthorized" }, { status: 403 });
  if (!backendConfigured()) return Response.json({ error: "Upload storage is unavailable" }, { status: 503 });
  if (Number(request.headers.get("content-length")) > 4_400_000) return Response.json({ error: "Maximum file size is 4 MB" }, { status: 413 });
  let data: FormData;
  try { data = await request.formData(); } catch { return Response.json({ error: "Choose a file to upload" }, { status: 400 }); }
  const file = data.get("file");
  if (!(file instanceof File) || !file.size) return Response.json({ error: "Choose a file to upload" }, { status: 400 });
  if (file.size > 4 * 1024 * 1024) return Response.json({ error: "Maximum file size is 4 MB" }, { status: 413 });
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
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
  try {
    const response = await supabaseRequest(`/storage/v1/object/${encodeURIComponent(storageBucket())}/${key}`, {
      method: "POST", headers: { "Content-Type": file.type, "x-upsert": "false" }, body: buffer,
    });
    if (!response.ok) return Response.json({ error: "Could not upload the file. Please try again." }, { status: 503 });
  } catch { return Response.json({ error: "Upload storage is temporarily unavailable." }, { status: 503 }); }
  return Response.json({ path: `/api/media/${key}` });
}
