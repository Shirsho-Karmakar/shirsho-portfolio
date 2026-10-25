# Shirsho Karmakar — Portfolio

A responsive portfolio for Shirsho Karmakar, a B.Tech CSE student at Siliguri Institute of Technology, expected graduation 2028. It uses Next.js, React, TypeScript and plain CSS, with Supabase for optional editing, storage and authentication.

The public website works immediately without environment variables or visitor sign-in. It includes the two existing projects, education, skills, contact details, a printable résumé, dark/light/system themes and a custom SVG favicon.

## Deploy to Vercel

Import `Shirsho-Karmakar/shirsho-portfolio` from GitHub, or redeploy the latest `main` commit if it is already imported.

| Setting | Value |
| --- | --- |
| Framework preset | Next.js |
| Root directory | `./` |
| Install command | `npm ci` |
| Build command | `npm run build` |
| Output directory | `.next` (Next.js default) |
| Node.js | 22.x |

`vercel.json` declares the framework and build settings. The build runs `next build`, which generates `.next/routes-manifest.json`. Clear any old Vite/Vinext/Workers build overrides in the Vercel dashboard. No Turborepo setup or custom output path is needed.

The public portfolio and `/cv` require no backend configuration. Vercel's Git integration can redeploy future pushes to `main`. In **Settings → Deployment Protection**, ensure the production domain is publicly accessible so recruiters do not have to sign in to Vercel. The dashboard has its own separate authentication.

## Activate the private dashboard

The dashboard at `/admin` uses your own email and password, independently of ChatGPT. You need one Supabase project for the database, file storage and administrator account.

1. Create a project at [Supabase](https://supabase.com/dashboard).
2. Open its SQL Editor and run [`supabase/setup.sql`](supabase/setup.sql). This creates the content table and a private `portfolio-assets` bucket. Direct anonymous and signed-in database access is denied; the application's server authorizes operations.
3. In **Authentication → Users**, create a confirmed user with email `2005shirsho@gmail.com` and a password you choose. The email must be confirmed, including when creating the account manually. Disable public signups if this project is only for this portfolio.
4. In the project settings, copy the project URL, publishable key and secret key. Enter these directly into your Vercel project's environment variables; do not put keys or passwords in GitHub or chat.
5. Set these Vercel environment variables for Production (and Preview if you want preview deployments to use this backend):

| Variable | Value |
| --- | --- |
| `SUPABASE_URL` | Your project URL, such as `https://your-project.supabase.co` |
| `SUPABASE_PUBLISHABLE_KEY` | Your `sb_publishable_...` key |
| `SUPABASE_SECRET_KEY` | Your server-only `sb_secret_...` key |
| `ADMIN_EMAIL` | `2005shirsho@gmail.com` |

6. Redeploy after adding or changing environment variables.
7. Open `/admin` and sign in with the administrator email and the password you created in Supabase.

Optional variables:

- `SUPABASE_STORAGE_BUCKET`: defaults to `portfolio-assets`, matching the setup SQL.
- `NEXT_PUBLIC_SITE_URL`: your production URL or custom domain for metadata. Vercel's production URL is detected automatically when this is omitted.
- Legacy Supabase projects can use `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` instead of publishable/secret keys. New key types are preferred.

Do not give any secret/service-role key a `NEXT_PUBLIC_` prefix. All backend requests and secret keys stay on the server. Only the configured, provider-verified and confirmed administrator can edit. Caller-supplied identity headers cannot grant access.

Before connecting all backend settings, `/admin` shows a setup notice. That does not restrict public portfolio access. After connecting the backend, failures to read existing saved data are reported rather than silently overwriting it with initial content.

## Update projects and your CV

- Add or edit projects in `/admin`. Drafts can be unfinished and stay off the public page.
- Add descriptions, project notes, technologies, repository/live links, and screenshots.
- Tick **Published** and choose **Save changes** to make a project visible.
- Use **Move up** and **Move down** to set project order.
- Update the About text, skills and graduation year in the profile section.
- Upload a PDF CV when ready. Until then, the footer links to the printable résumé at `/cv`.

Uploads accept PNG, JPEG, WebP and PDF, up to **4 MB**. This keeps multipart requests below Vercel's function request limit. Screenshots must be images and the CV must be a PDF. Files are held in a private bucket and delivered through the application's media endpoint; anyone with an application's media URL can read that file. Use files intended for sharing. Removing an attachment unlinks it without deleting the underlying stored object.

The editor renews expired access sessions before saving or uploading. Sessions use HttpOnly cookies. Sign out revokes the current provider session and clears local cookies. If you need to sign in again while editing, use another tab and retry the save so your unsaved work stays in place.

## Local development

Use Node.js 22.x:

```sh
npm ci
npm run dev
```

The public portfolio runs without a `.env.local` file. To enable editing locally, copy `.env.example` to `.env.local` and enter your Supabase settings. Do not commit `.env.local`.

```sh
npm test
npm run typecheck
npm run build
npm start
```

## Maintain and extend

- `app/portfolio.tsx`: public sections and custom project artwork.
- `app/globals.css`: design tokens, responsive layout, themes and print rules.
- `lib/portfolio-data.ts`: initial profile/projects, shared types and validation.
- `app/admin/dashboard.tsx`: project/profile editor.
- `app/admin/login/`: private sign-in interface.
- `app/api/auth/`: sign-in, session refresh and sign-out.
- `lib/admin-auth.ts`: provider-verified administrator access and session cookies.
- `lib/supabase.ts`: server-only API configuration and requests.
- `lib/content.ts`: persistent content reads/writes.
- `app/api/admin/route.ts`: authorized document editing.
- `app/api/upload/route.ts`: authorized uploads and file validation.
- `app/api/media/[key]/route.ts`: public file delivery.
- `supabase/setup.sql`: database and bucket setup.
- `public/favicon.svg`: monogram favicon.

Initial content is only used when no backend is configured or when its content table has no saved document yet. Once you save via the dashboard, changes to the initial source content do not overwrite the saved document. New projects can be added without changing layout code.

There are no invented employment dates, testimonials, experience claims or proficiency percentages. Project descriptions are grounded in the supplied repositories.

The old Sites registration in `.openai/hosting.json` is retained only as historical project identity. This Next.js/Vercel application does not use its Cloudflare resources or require ChatGPT sign-in.

See [implementation status](docs/IMPLEMENTATION-STATUS.md) for verification details and remaining live-service checks.
