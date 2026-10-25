import { readContent } from "../../lib/content";
import PrintButton from "./print-button";
export const dynamic = "force-dynamic";
export const metadata = { title: "Résumé — Shirsho Karmakar" };
export default async function Resume() {
  const content = await readContent();
  return <main className="resume-page wrap"><div className="resume-actions"><a href="/">← Portfolio</a><PrintButton /></div><h1>Shirsho Karmakar</h1><p className="resume-subtitle">B.Tech CSE Student · Full-stack Developer</p><p>Siliguri, India · <a href="mailto:2005shirsho@gmail.com">2005shirsho@gmail.com</a></p><p><a href="https://github.com/Shirsho-Karmakar">github.com/Shirsho-Karmakar</a></p><section><h2>Profile</h2><p>{content.bio}</p></section><section><h2>Skills</h2><p>{content.skills.join(" · ")}</p></section><section><h2>Projects</h2>{content.projects.filter(p => p.published).map(p => <article key={p.id}><h3>{p.title}</h3><p>{p.description}</p><p>{p.technologies.join(" · ")}</p>{p.repository && <a href={p.repository}>{p.repository.replace("https://", "")}</a>}</article>)}</section><section><h2>Education</h2><h3>Siliguri Institute of Technology</h3><p>B.Tech, Computer Science & Engineering · {content.graduationYear ? `Expected ${content.graduationYear}` : 'Currently studying'}</p><h3>DAV School, Siliguri</h3><p>Classes 8–12</p><h3>Don Bosco School, Siliguri</h3><p>Classes 1–7</p></section></main>;
}
