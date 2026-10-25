import { z } from "zod";
const safeLink = z.string().max(500).refine(value => {
  if (value === "") return true;
  try { return new URL(value).protocol === "https:"; } catch { return false; }
}, "Use a full https:// link.");
const assetPath = z.string().max(200).regex(/^$|^\/api\/media\/[a-f0-9-]{36}\.(png|jpg|webp|pdf)$/);
export const projectSchema = z.object({
  id: z.string().min(1).max(80).regex(/^[a-zA-Z0-9-]+$/),
  title: z.string().trim().min(1).max(100),
  category: z.string().trim().min(1).max(100),
  description: z.string().trim().max(700),
  details: z.string().trim().max(3000),
  technologies: z.array(z.string().trim().min(1).max(40)).max(15),
  repository: safeLink,
  liveUrl: safeLink,
  image: assetPath.refine(v => !v.endsWith(".pdf"), "Choose an image, not a PDF."),
  artwork: z.enum(["eyewear", "orbit", "custom"]),
  published: z.boolean(),
}).superRefine((project, context) => {
  if (project.published && !project.description) context.addIssue({ code: z.ZodIssueCode.custom, path: ["description"], message: "Add a description before publishing this project." });
});
export const contentSchema = z.object({
  projects: z.array(projectSchema).max(60).refine(p => new Set(p.map(x => x.id)).size === p.length, "Project IDs must be unique."),
  bio: z.string().trim().min(1).max(2000),
  skills: z.array(z.string().trim().min(1).max(50)).max(30),
  graduationYear: z.string().regex(/^$|^20\d{2}$/),
  cv: assetPath.refine(v => !v || v.endsWith(".pdf"), "Choose a PDF."),
});
export type Project = z.infer<typeof projectSchema>;
export type PortfolioContent = z.infer<typeof contentSchema>;
export const initialContent: PortfolioContent = {
  bio: "I'm Shirsho, a B.Tech Computer Science and Engineering student at Siliguri Institute of Technology. I enjoy turning practical ideas into working software, from an eyewear storefront to a file conversion tool that lives inside your desktop. I'm working towards opportunities in full-stack web development and prompt engineering.",
  skills: ["React", "Next.js", "JavaScript", "MongoDB", "PostgreSQL"],
  graduationYear: "2028", cv: "",
  projects: [
    { id: "chokher-alo", title: "Chokher Alo", category: "Full-stack web application",
      description: "An eyewear commerce platform connecting a Next.js storefront with a Django backend. Built around the practical needs of buying glasses online.",
      details: "The repository covers eyeglasses, sunglasses and prescription lenses, with phone OTP authentication, prescription uploads and review, Razorpay and Cash on Delivery, and a separate wholesale workspace. Delivery is scoped to configured serviceable PIN codes in West Bengal. Explore the source for implementation details and current launch status.",
      technologies: ["Next.js", "TypeScript", "Django", "PostgreSQL"], repository: "https://github.com/Shirsho-Karmakar/chokher_alo", liveUrl: "", image: "", artwork: "eyewear", published: true },
    { id: "orbit-converter", title: "Orbit", category: "Desktop utility · Prototype",
      description: "A local file converter with a circular menu inside your file manager. Hold Shift, drag a file, and choose a compatible output format.",
      details: "A background Node.js service handles local conversion while desktop adapters provide the drag interaction. The repository reports working Hyprland interaction and Windows image conversion. GNOME, Plasma and parts of the Windows document workflow remain experimental or need live validation. Files are processed locally. See the repository for supported formats and platform limitations.",
      technologies: ["Node.js", "JavaScript", "C++", "Sharp", "FFmpeg"], repository: "https://github.com/Shirsho-Karmakar/orbit-converter", liveUrl: "", image: "", artwork: "orbit", published: true },
  ],
};
