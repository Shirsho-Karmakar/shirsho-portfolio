import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../app/chatgpt-auth";
export async function isAdmin() {
  const user = await getChatGPTUser();
  const email = (env as Cloudflare.Env & { ADMIN_EMAIL?: string }).ADMIN_EMAIL || "2005shirsho@gmail.com";
  return Boolean(user && user.email.toLowerCase() === email.toLowerCase());
}
export function sameOrigin(request: Request) {
  return request.headers.get("origin") === new URL(request.url).origin;
}
