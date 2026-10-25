"use client";
import { useEffect, useState } from "react";
import type { PortfolioContent, Project } from "../lib/portfolio-data";

function Arrow() { return <span aria-hidden="true">↗</span>; }

export function ThemeSwitch() {
  const [theme, setTheme] = useState<string | null>(null);
  useEffect(() => { try { setTheme(localStorage.getItem("sk-theme") || "dark"); } catch {} }, []);
  useEffect(() => {
    if (!theme) return;
    const media = matchMedia("(prefers-color-scheme: light)");
    const apply = () => { document.documentElement.dataset.theme = theme === "system" ? (media.matches ? "light" : "dark") : theme; };
    apply(); media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [theme]);
  return <div className="theme-switch" role="group" aria-label="Colour theme">{([['dark', 'Dark', '◐'], ['light', 'Light', '☼'], ['system', 'System', '▣']] as const).map(([value, label, icon]) => <button key={value} type="button" aria-label={`${label} theme`} aria-pressed={theme === value} title={label} onClick={() => { setTheme(value); try { localStorage.setItem("sk-theme", value); } catch {} }}><span aria-hidden="true">{icon}</span><span className="sr-only">{label}</span></button>)}</div>;
}

function Artwork({ project }: { project: Project }) {
  if (project.image) return <div className="project-art custom-art"><img src={project.image} alt={`${project.title} project screenshot`} loading="lazy" /></div>;
  if (project.artwork === "eyewear") return <div className="project-art eyewear-art" aria-label="Chokher Alo eyewear illustration" role="img">
    <div className="art-top"><span>CHOKHER ALO</span><span>EYEWEAR / COMMERCE</span></div>
    <svg className="glasses" viewBox="0 0 560 230" fill="none" aria-hidden="true"><path d="M38 82 13 65M522 82l25-17M52 80c-8 0-11 9-9 22l8 45c4 23 20 37 49 39h76c29-2 45-17 48-43l5-43c0-15-9-22-22-22H52Zm456 0c8 0 11 9 9 22l-8 45c-4 23-20 37-49 39h-76c-29-2-45-17-48-43l-5-43c0-15 9-22 22-22h155ZM229 101c25-17 77-17 102 0" stroke="currentColor" strokeWidth="12" strokeLinecap="round"/><path d="m67 103 18 49m-4-49 10 28m269-28 18 49m-4-49 10 28" stroke="currentColor" strokeOpacity=".12" strokeWidth="5" strokeLinecap="round"/></svg>
    <div className="art-bottom"><span>A clearer point of view.</span><span className="art-cross">+</span></div>
  </div>;
  if (project.artwork === "orbit") return <div className="project-art orbit-art" aria-label="Orbit circular file conversion menu illustration" role="img">
    <div className="art-top"><span>ORBIT</span><span>LOCAL / FILE CONVERSION</span></div>
    <div className="orbit-visual"><div className="orbit-ring"><span className="orbit-format f1">PNG</span><span className="orbit-format f2">WEBP</span><span className="orbit-format f3">JPG</span><span className="orbit-format f4">PDF</span><span className="orbit-centre"><svg viewBox="0 0 28 32" width="28" height="32" fill="none" aria-hidden="true"><path d="M5 2h12l7 7v21H5V2Zm12 0v8h7M10 17h9m-9 5h7" stroke="currentColor" strokeWidth="1.5"/></svg></span></div><span className="orbit-cursor" aria-hidden="true">↖</span></div>
    <div className="art-bottom"><span>One less window. One less step.</span><span className="art-cross">↗</span></div>
  </div>;
  return <div className="project-art generic-art"><span className="generic-letter">{project.title.slice(0, 1)}</span><span className="mono">{project.category}</span></div>;
}

export default function Portfolio({ content }: { content: PortfolioContent }) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  async function copyEmail() { try { await navigator.clipboard.writeText("2005shirsho@gmail.com"); setCopied(true); setCopyError(false); setTimeout(() => setCopied(false), 2500); } catch { setCopyError(true); } }
  return <>
    <a className="skip-link" href="#main">Skip to content</a>
    <header className="site-header wrap"><a className="brand" href="#" aria-label="Shirsho Karmakar home"><svg viewBox="0 0 64 64" aria-hidden="true"><path d="M27 15H13v17h14v17H11m29-34v34m1-17 16-17M41 32l16 17" fill="none" stroke="currentColor" strokeWidth="4" /></svg><span>Shirsho Karmakar<span className="brand-sub">DEVELOPER & CSE STUDENT</span></span></a>
      <nav aria-label="Main navigation"><a href="#work">Work</a><a href="#about">About</a><a href="#contact">Contact <Arrow /></a></nav><ThemeSwitch />
    </header>
    <main id="main">
      <section className="hero wrap" aria-labelledby="intro-heading">
        <div className="hero-eyebrow"><span className="mono"><span className="status-dot" /> SILIGURI, INDIA</span><span className="mono hero-index">PERSONAL PORTFOLIO / {new Date().getFullYear()}</span></div>
        <h1 id="intro-heading">Shirsho<br /><span>Karmakar.</span></h1>
        <div className="hero-bottom"><p>I build for the web.<br /><span>And for the way people use it.</span></p><div className="hero-note"><p>Computer science student, focused on full-stack development. Curious about the possibilities of prompt engineering.</p><a className="text-link" href="#work">Explore selected work <span aria-hidden="true">↓</span></a></div></div>
        <div className="hero-foot mono"><span>B.TECH CSE · {content.graduationYear ? `CLASS OF ${content.graduationYear}` : "CURRENTLY STUDYING"}</span><span>SCROLL TO EXPLORE <span aria-hidden="true">↓</span></span></div>
      </section>
      <section className="work-section wrap" id="work" aria-labelledby="work-heading">
        <div className="section-title"><span className="mono section-number">01 / SELECTED WORK</span><h2 id="work-heading">Ideas, made tangible.</h2><span className="section-aside">A selection of things I’m building.</span></div>
        <div className="projects-grid">{content.projects.map((project, i) => <article className="project" key={project.id}>
          <Artwork project={project} />
          <div className="project-meta mono"><span>{String(i + 1).padStart(2, "0")} / {project.category}</span><span>PROJECT</span></div>
          <div className="project-heading"><h3>{project.title}</h3>{(project.repository || project.liveUrl) && <a className="round-link" href={project.repository || project.liveUrl} target="_blank" rel="noreferrer" aria-label={`Open ${project.title} ${project.repository ? 'repository' : 'website'}`}><Arrow /></a>}</div>
          <p className="project-description">{project.description}</p>
          <ul className="tech-list" aria-label="Technologies">{project.technologies.map(t => <li key={t}>{t}</li>)}</ul>
          <div className="project-links">{project.repository && <a className="text-link" href={project.repository} target="_blank" rel="noreferrer">Source code <Arrow /></a>}{project.liveUrl && <a className="text-link" href={project.liveUrl} target="_blank" rel="noreferrer">Visit website <Arrow /></a>}</div>
          {project.details && <details className="project-details"><summary>Project notes <span aria-hidden="true">+</span></summary><p>{project.details}</p></details>}
        </article>)}</div>
        {!content.projects.length && <p className="empty-state">New work is on the way. In the meantime, explore <a href="https://github.com/Shirsho-Karmakar">my GitHub</a>.</p>}
      </section>
      <section className="about-section wrap" id="about" aria-labelledby="about-heading"><div className="section-label mono">02 / A LITTLE CONTEXT</div><div className="about-content"><h2 id="about-heading">Learning by<br /><em>building things.</em></h2><p className="about-bio">{content.bio}</p><div className="skills-block"><h3 className="mono">CORE SKILLS</h3><ul>{content.skills.map(s => <li key={s}>{s}</li>)}</ul></div><a className="text-link" href="https://github.com/Shirsho-Karmakar" target="_blank" rel="noreferrer">More on GitHub <Arrow /></a></div></section>
      <section className="education-section wrap" aria-labelledby="education-heading"><div><span className="mono section-label">03 / THE FOUNDATION</span><h2 id="education-heading">Education</h2></div><div className="education-list"><article><span className="mono education-date">CURRENT{content.graduationYear ? ` · EXPECTED ${content.graduationYear}` : ''}</span><h3>Siliguri Institute of Technology</h3><p>B.Tech · Computer Science & Engineering</p></article><article><span className="mono education-date">CLASSES 08 — 12</span><h3>DAV School, Siliguri</h3><p>Secondary & higher secondary education</p></article><article><span className="mono education-date">CLASSES 01 — 07</span><h3>Don Bosco School, Siliguri</h3><p>Foundational education</p></article></div></section>
      <section className="contact-section wrap" id="contact" aria-labelledby="contact-heading"><div className="contact-top"><span className="mono">04 / WHAT’S NEXT</span><span className="mono">OPEN TO OPPORTUNITIES</span></div><h2 id="contact-heading">Let’s build<br /><em>something useful.</em></h2><div className="contact-bottom"><p>Have a role, a project, or an idea in mind?<br />I’d be happy to hear from you.</p><div className="contact-actions"><a className="contact-email" href="mailto:2005shirsho@gmail.com">2005shirsho@gmail.com <Arrow /></a><button className="copy-button" onClick={copyEmail}>{copied ? "Email copied ✓" : "Copy email"}</button><span role="status" className="sr-only">{copied ? "Email copied to clipboard" : ''}</span>{copyError && <p role="alert" className="copy-error">Please copy the email address above.</p>}</div></div></section>
    </main>
    <footer className="site-footer wrap"><span>© {new Date().getFullYear()} Shirsho Karmakar</span><div><a href="https://github.com/Shirsho-Karmakar" target="_blank" rel="noreferrer">GitHub <Arrow /></a><a href={content.cv || "/cv"} target={content.cv ? "_blank" : undefined} rel={content.cv ? "noreferrer" : undefined}>{content.cv ? "View CV" : "Résumé"} <Arrow /></a><a href="/admin" className="dashboard-link">Dashboard</a><a href="#" aria-label="Back to top">↑</a></div></footer>
  </>;
}
