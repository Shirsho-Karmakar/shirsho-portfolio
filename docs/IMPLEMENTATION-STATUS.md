# Vercel migration status

The application now uses standard Next.js and targets Vercel. The former Cloudflare Workers build, bindings and hosting-provided authentication have been replaced. Public viewing requires no sign-in and works with the initial profile content before a backend is configured.

## Verified locally

- Installed the complete, locked minimal dependency tree using cached packages: Next.js 16.3.4, React 19.2.6, Zod 3.25.76 and TypeScript 5.9.3.
- `npm run typecheck` passes for the application.
- 22 tests pass against the actual route handlers and server modules using mocked Supabase HTTP responses. They cover public access without a backend, schema validation, verified administrator identity, forged identity headers, origin enforcement, persistence requests, drafts, login cookies, token refresh, sign-out, file limits/signatures and file delivery.
- A complete production build generates `.next/routes-manifest.json` and the expected App Router routes, including `/`, `/cv`, `/admin`, `/admin/login` and API routes.
- The local sandbox prevents spawning the TypeScript CLI subprocess. For local build verification only, a temporary Next.js configuration selected TypeScript's compiler API and thread workers. The tracked production config was restored after the build; Vercel uses the standard `next build` path. Type errors were not ignored.

## External setup and checks

- Supabase credentials have not been supplied. No actual hosted database, bucket, administrator account or password has been created by this change.
- Run `supabase/setup.sql` and configure the environment variables described in the README to activate editing. Create a confirmed administrator account separately in Supabase.
- Real Supabase authentication, database permissions and file storage still need a live integration check after setup.
- Browser interaction/visual QA could not run in the authoring sandbox because browser/server sockets are restricted.
- Check the latest Vercel Git deployment after the fix is pushed. Clear any old build overrides and keep the output directory at the Next.js default, `.next`.

The public portfolio is deliberately independent of backend setup. Dashboard sign-in and writes fail closed until the backend is configured.
