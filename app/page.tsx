import Portfolio from "./portfolio";
import { readContent } from "../lib/content";
export const dynamic = "force-dynamic";
export default async function Home() {
  const content = await readContent();
  return <Portfolio content={{ ...content, projects: content.projects.filter(p => p.published) }} />;
}
