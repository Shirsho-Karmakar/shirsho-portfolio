import "server-only";

export function backendConfigured() {
  return Boolean(process.env.SUPABASE_URL && (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY));
}

export function authConfigured() {
  return Boolean(process.env.SUPABASE_URL && (process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY));
}

export function storageBucket() {
  return process.env.SUPABASE_STORAGE_BUCKET || "portfolio-assets";
}

export async function supabaseRequest(path: string, options: RequestInit = {}, access: "secret" | "publishable" = "secret") {
  const base = process.env.SUPABASE_URL;
  const key = access === "secret"
    ? process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
    : process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!base || !key) throw new Error("Portfolio storage or authentication has not been connected.");
  const url = new URL(base);
  if (url.protocol !== "https:" && !(process.env.NODE_ENV !== "production" && ["localhost", "127.0.0.1"].includes(url.hostname))) {
    throw new Error("SUPABASE_URL must use HTTPS.");
  }
  const headers = new Headers(options.headers);
  headers.set("apikey", key);
  // New publishable/secret keys belong only on apikey. Legacy JWT keys also
  // need Authorization when there is no signed-in user's access token.
  if (key.startsWith("eyJ") && !headers.has("Authorization")) headers.set("Authorization", `Bearer ${key}`);
  return fetch(`${url.origin}${path}`, {
    ...options,
    headers,
    cache: "no-store",
    signal: options.signal || AbortSignal.timeout(15_000),
  });
}
