# Shirsho Karmakar — Portfolio

A restrained, responsive portfolio for Shirsho Karmakar: B.Tech CSE student at Siliguri Institute of Technology, expected graduation 2028. The design uses charcoal, warm white, a muted sage accent, serif display typography, and custom project illustrations. No external font service is required.

## What is included

- Dark by default, with persistent light and system theme options.
- Verified descriptions of Chokher Alo and Orbit, repository links, expandable notes, and technology labels.
- About, core skills, education, and contact sections.
- Custom SVG monogram favicon.
- A printable résumé at `/cv`, built from the same content as the portfolio.
- A protected `/admin` dashboard for adding, editing, deleting and reordering projects; drafts; screenshot uploads; profile edits; and a PDF CV upload.
- Cloudflare D1 persistence and R2 file storage. Project data is not kept in browser storage.
- Server-side authorization, request-origin checks, content validation, file type/signature checks, and a 5 MB upload limit.

## Preview the design without installing dependencies

Open `outputs/review/index.html` directly in a browser. This is an offline review export of the actual React UI. The export supports the portfolio, theme controls, project notes, a dashboard interface preview, and a printable résumé.

The offline dashboard is an interface preview. Saving, uploading, and authentication require the running application. The review export is ignored by Git and is not a production deployment.

## Run the application

Use Node.js 22.13 or later and a network-enabled environment:

```sh
npm run install:ci
npm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_portfolio_content.sql
npm run dev
```

Apply the initial migration only once to a given local database. Wrangler data in `.wrangler/state` is separate from hosted data. See `docs/STARTER.md` for the retained starter's runtime and hosting details.

For local dashboard development, put `ADMIN_EMAIL=seedy@sites.test` in an ignored `.dev.vars` file. The starter's loopback-only mock sign-in uses that account. Visit `/signin-with-chatgpt?return_to=/admin`. This local override must not be deployed. In production, the default allowed administrator is `2005shirsho@gmail.com`; it can be overridden using the hosted `ADMIN_EMAIL` runtime variable.

## Manage your portfolio

1. Open `/admin` and sign in using the allowed administrator email.
2. Choose **Add**, enter the project's title and category, and save an unfinished project as a draft if needed.
3. Add the description, project notes, technologies, repository URL, optional live URL, and optional screenshot.
4. Tick **Published** and choose **Save changes** to show it on the portfolio.
5. Use **Move up** and **Move down** to choose display order.

Uploads accept PNG, JPEG, WebP and PDF, up to 5 MB. Screenshots must be images; the CV must be a PDF. Uploaded files have unguessable URLs, but anyone with an uploaded file's URL can read it. Use files intended for sharing. Removing an attachment unlinks it from the portfolio; it does not delete the underlying storage object.

The footer points to the printable résumé until a PDF CV is uploaded. After uploading a CV and saving, it points to that PDF instead.

The dashboard uses the hosting platform's ChatGPT sign-in. The allowed email must match the account used for that sign-in; it does not have to match the account in the authoring conversation. The registered Site's audience is public, as requested. Once deployed, visitors can view the portfolio, project notes, résumé and published files without signing in. Only `/admin` and editing/upload endpoints require the authorized administrator account. Public access configuration does not by itself publish the site.

## Where to change things

- `app/portfolio.tsx`: public sections and project artwork.
- `app/globals.css`: design tokens, layout, breakpoints, and print styles.
- `lib/portfolio-data.ts`: initial content, shared types, and validation rules.
- `app/admin/dashboard.tsx`: project and profile editor.
- `app/api/admin/route.ts`: authorized content reads and writes.
- `app/api/upload/route.ts`: authorized uploads.
- `app/api/media/[key]/route.ts`: public file delivery.
- `lib/admin-auth.ts`: allowed administrator and origin checks.
- `lib/content.ts`: database reads and writes.
- `db/schema.ts` and `drizzle/`: schema and migrations.
- `public/favicon.svg`: custom monogram.

Initial content is used only until the first saved document exists. Later edits to initial content do not overwrite dashboard changes. There are no invented employment dates, testimonials, proficiency percentages, or experience claims.

## Checks

```sh
npm test
npm run typecheck
npm run build
```

The tests exercise real route-handler code against an in-memory SQLite database and an in-memory object-storage adapter. They cover authorization, origin enforcement, SQL persistence, drafts, content validation, upload limits/signatures, media responses, and public rendering. They do not replace hosted authentication or D1/R2 integration checks.

See `docs/IMPLEMENTATION-STATUS.md` for completed verification and the remaining environment-dependent checks.

## Extend later

Add a new project through the dashboard without touching layout code. Other content types, such as articles or achievements, can be added as separate sections and schema fields. For schema changes, edit `db/schema.ts`, generate the next migration with `npm run db:generate`, inspect the SQL, and preserve applied migrations. The initial SQL migration and matching metadata are included; the generator could not run in the restricted authoring environment.

## Publishing

`.openai/hosting.json` already contains the registered Site ID. Reuse it; do not register another Site for this checkout. Follow the Sites workflow to build, push the source, package it, and deploy the saved version. Keep runtime values in Sites, not in the hosting manifest. Do not commit `.dev.vars`, local `.env` files, credentials, caches, or runtime directories.
