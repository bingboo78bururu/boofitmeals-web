# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## What this is

부핏Meals — a daily meal-photo mission tracker. Members log breakfast/lunch/dinner with a note + photo, an
AI (Claude Haiku vision) scores each photo 0–2, a nutrition coach can review the feed and override the
score or leave feedback, and members compete on a carrot-count ranking board scoped to their class.

Stack: Next.js 16 (App Router, Turbopack) + Supabase (Postgres/Auth/Storage/RLS) + Tailwind CSS v4,
deployed to Vercel. No test framework is configured.

## Commands

```bash
npm run dev      # start dev server
npm run build    # production build — run this before every deploy, it is the only typecheck step
npm run lint      # eslint (flat config, eslint-config-next)
```

There is no unit/integration test suite. `supabase/smoke-test.mjs` and `supabase/storage-smoke-test.mjs`
are ad-hoc scripts (not part of the app) that exercise the live Supabase project's auth/RLS/storage
behavior end-to-end; run with `node supabase/smoke-test.mjs`. They read credentials from `.env.local`.

### Deploying

There is no CI and the Vercel project is **not** connected to the GitHub repo — every deploy is a manual
CLI push, and `git push` alone does not deploy anything:

```bash
npm run build                          # verify first
npx vercel deploy --prod --yes
npx vercel alias set <printed-deployment-url> boofitmeals-web.vercel.app   # required every time —
                                        # the custom alias does NOT auto-track new prod deployments
```

After deploying, also commit and push to GitHub (`git add` / `git commit` / `git push origin main`) — the
repo doubles as a portfolio piece, so it should keep a real commit history alongside what's live.

### Database changes

`supabase/schema.sql` is the canonical full schema (run once on a fresh project). There is no migration
runner — whenever the schema changes, **also** write a small standalone `supabase/<feature>.sql` file
(e.g. `coach-score.sql`, `classes.sql`) with just the incremental DDL, and tell the user to paste it into
the Supabase SQL Editor by hand. Keep `schema.sql` and the incremental file in sync; the incremental file
is the only thing that actually reaches the live database.

`src/lib/supabase/types.ts` is a hand-written `Database` type (no `supabase gen types`). Update it manually
whenever a table/column/RPC function changes, or `.select()` calls will silently lose type safety.

## Architecture

### Next.js 16 unfamiliar-territory notes

Per `AGENTS.md`, this Next.js version has breaking changes vs. typical training data. Ones already hit in
this codebase:
- `middleware.ts` doesn't exist here — it's `src/proxy.ts`, exporting a `proxy()` function (see also
  `src/lib/supabase/proxy.ts` for the actual session-refresh logic it calls).
- Page `searchParams` and `params` are `Promise`s and must be `await`ed.
- `next/link` exposes a `useLinkStatus()` hook for per-link pending state (see
  `src/app/member/date-link-content.tsx`).
- `experimental.serverActions.bodySizeLimit` in `next.config.ts` is still nested under `experimental`.

### Role-based routing

Three roles — `member`, `coach`, `admin` — each get their own top-level route (`/member`, `/coach`,
`/admin`) with a `layout.tsx` that calls `requireRole(role)` (in `src/lib/auth.ts`) and wraps children in
`<AppShell>`. `requireRole` redirects to `/login` if unauthenticated, or to the caller's actual role-home
if the role doesn't match — there's no shared "logged in, wrong role" page. `getCurrentProfile()` fetches
the full `profiles` row (including `class_id`) and is `cache()`-wrapped per request.

Auth-adjacent pages (`login`, `signup`, `forgot-password`, `reset-password`) live under the `(auth)` route
group. Public signup is member-only and is a 3-step flow, each step skippable:
`/signup` (account) → `/signup/coach` (pick a coach) → `/signup/class` (pick a class) → `/member`.
Coach and admin accounts are provisioned directly in Supabase, not through public signup.

### Server actions

Grouped by role under `src/lib/actions/` (`member.ts`, `coach.ts`, `admin.ts`, `auth.ts`, `onboarding.ts`).
All follow the same `useActionState` shape: `(prevState, formData) => Promise<{error} | {success: true, ...} | undefined>`,
with a shared `SimpleFormState` type from `member.ts`. UI components that have both a display and an edit
mode (goals, today's mission, coach feedback) follow one pattern: local `editing` state defaults to
`!existingValue`, a "수정하기" button flips it on, "취소" flips it off.

### Supabase clients — three, not interchangeable

- `src/lib/supabase/server.ts` — for Server Components/Server Actions, cookie-based, `await`ed.
- `src/lib/supabase/client.ts` — browser client for Client Components.
- `src/lib/supabase/proxy.ts` — used only by `src/proxy.ts` to refresh the auth cookie on every request.

RLS is the actual authorization boundary (the anon key is public), not the Next.js layer — always add/check
policies when touching data access, not just server-action-level `requireRole` checks. Two patterns in use:
- `public.my_role()` is a `security definer` SQL function used inside policies to read the caller's role
  without recursive RLS evaluation on `profiles`.
- Column-level restrictions that RLS can't express declaratively (e.g. "coaches may only touch
  `missions.coach_score`, members may touch everything else") are enforced with a `BEFORE UPDATE` trigger
  (`enforce_mission_update_columns`) that diffs `OLD` vs `NEW`, since a plain RLS policy only sees one side.

### Domain model

`profiles` (role, `name` — unique, labeled "닉네임" in the UI, `class_id`) · `classes` (ranking is scoped to
the viewer's class, not global) · `coach_assignments` (member ↔ coach, settable either by the member during
onboarding or by an admin) · `goals` · `missions` (`meal_type`: breakfast/lunch/dinner, one row per
member+date+meal; `ai_score` from Claude, `coach_score` optional override) · `feedback` (one row per
mission, upserted so coaches can revise it).

`finalScore()` in `src/lib/score.ts` (`coach_score ?? ai_score ?? 0`) is the single source of truth for
"how many carrots did this mission earn" — every place that counts carrots (today's mission view, the
calendar, the ranking board) must go through it rather than reading `ai_score` directly, or coach overrides
silently stop counting.

### AI scoring

`src/lib/ai-score.ts` calls the Anthropic Messages API directly via `fetch` (no SDK) using a vision-capable
Haiku model, returns a 0–2 score + reason. Requires `ANTHROPIC_API_KEY` set in Vercel (marked "Sensitive",
so it won't come back via `vercel env pull` — do not treat that placeholder as proof the key is wrong).
Every failure path logs via `console.error` so `vercel logs` can distinguish "no key" / "fetch failed" /
"API error" / "bad response shape".

### Dates

All "today" logic must go through `todayString()` in `src/lib/dates.ts` (Asia/Seoul via `Intl.DateTimeFormat`),
never `new Date().toISOString()`. Vercel runs UTC, so a raw UTC "today" is wrong for roughly a third of the
day for Korean users.

## Project conventions

- `QA.md` at the repo root is the running QA/bug list, used instead of GitHub Issues. Status values are
  exactly `작성중 / to go / in progress / finished` — not the pending/in_progress/completed vocabulary used
  elsewhere. Update it whenever a QA item is addressed, and don't reword the status set.
- UI copy is Korean throughout; keep new user-facing strings consistent with that (and with existing tone —
  casual-polite, emoji used sparingly for carrots/AI badges).
