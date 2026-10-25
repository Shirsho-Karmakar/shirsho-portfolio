import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  metadataBase: new URL("https://shirsho-karmakar-portfolio.savoryvenus2.chatgpt.site"),
  title: "Shirsho Karmakar — Developer & CSE Student",
  description: "Computer science student in Siliguri, building full-stack web applications and exploring prompt engineering. Selected projects, background, and contact.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  openGraph: { title: "Shirsho Karmakar", description: "CSE student. Full-stack development & prompt engineering.", type: "website" },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" data-theme="dark" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: `try{const t=localStorage.getItem('sk-theme')||'dark';document.documentElement.dataset.theme=t==='system'?(matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'):t}catch{}` }} /></head><body>{children}</body></html>;
}
