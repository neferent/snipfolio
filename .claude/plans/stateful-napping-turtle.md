# Free-tier lifecycle: 30-day source purge + 3-project access cap

## Context

Snipfolio's current free tier is too generous for the actual cost driver: Advanced Editor projects store raw, uncompressed screenshots (10-40MB each, intentionally uncompressed — a feature, not a bug) in Supabase Storage forever, with a flat 50-project limit for every account regardless of payment status. Capture compute itself costs under a cent per call and isn't a concern; storage is the real ongoing liability, and it currently only grows.

The fix agreed on:
- Purge stored source images (storage bytes only, not DB rows) for **free accounts** (never paid) after **30 days of account inactivity**.
- Accounts that have **ever paid** (subscription or day-pass, even if lapsed) are **permanently exempt** from purging — no re-purge risk if they stop paying later.
- Revert the free project limit from 50 back to **3**. Pro accounts (active sub or day-pass) get unlimited.
- Any account that currently has **more than 3 projects and is not Pro** (never-paid free users, or lapsed-paid users) can only **open/edit their oldest 3 projects** (by `created_at`); the rest are visible but locked, with an upsell to pay or delete down to 3 to regain access.
- Nothing is ever deleted as a side effect of downgrading — locked projects and their data stay intact, just inaccessible until unlocked (pay, or delete other projects down to ≤3).
- Multi-accounting abuse is explicitly out of scope for now — only guarding against inactive-storage bloat and DDOS-style abuse.

## Current state (from exploration)

- `profiles` table (after all migrations): `id, is_pro, is_admin, created_at, pro_expires_at, capture_count, pro_capture_count, pro_capture_period_start`. No `has_ever_paid` or `last_active_at` columns exist yet.
- `usePlan.ts` (`app/composables/usePlan.ts:26-30`): `PROJECT_LIMIT = 50`, `canCreateProject()` is a flat count check with no Pro carve-out, only used to gate *creating new* projects — nothing currently restricts opening existing ones.
- `app/pages/projects.vue`: lists `projectStore.projects` (via `fetchProjects()`, ordered by `updated_at desc`); every card is fully clickable/renameable/deletable; no locked-state concept exists.
- `app/pages/advanced/[id]/index.vue:61,73-82`: `middleware: 'auth'`, loads the project in `onMounted`, and on failure shows a "Failed to load project" branch (`loadError`) — the natural place to add a "locked" branch.
- `server/api/webhooks/lemonsqueezy.post.ts`: on `subscription_created`/`subscription_payment_success` → `{is_pro: true, pro_expires_at: null}`; on `subscription_cancelled`/`subscription_expired` → `{is_pro: false}`; on `order_created` (day-pass variant) → `{pro_expires_at: now+72h}`. None of these currently touch a "has ever paid" flag.
- `server/api/me/profile.get.ts`: fetches/returns profile+capture status; fires on every login/session-restore/`refreshProfile()` call — the natural single touchpoint for a "last active" timestamp.
- Storage layout: `screenshots/${userId}/${projectId}/${sourceId}` (`app/composables/useProject.ts:257-267`). On download failure, `restoreImages()` already calls `sourcesStore.markSourceFailed(source.id)` gracefully (`useProject.ts:371-433`) — this existing failure path is what a purged image will naturally hit, no new client error-handling needed.
- No cron jobs, `vercel.json`, or scheduled tasks exist anywhere in the repo today.
- `server/api/admin/users/[id]/reset.post.ts` is the closest existing pattern for a service-role route that lists+removes storage objects for a user.

## Implementation

### 1. Schema migration
New file `supabase/migrations/<timestamp>_lifecycle_fields.sql`:
- `alter table public.profiles add column if not exists has_ever_paid boolean not null default false;`
- `alter table public.profiles add column if not exists last_active_at timestamptz not null default now();`
- Backfill: `update public.profiles set has_ever_paid = true where is_pro = true or pro_expires_at is not null;` (grandfathers existing paid/passed users).

### 2. Webhook: mark `has_ever_paid`
In `server/api/webhooks/lemonsqueezy.post.ts`, add `has_ever_paid: true` to the upsert payloads for `subscription_created`, `subscription_payment_success`, and the day-pass branch of `order_created`. Leave `subscription_cancelled`/`subscription_expired` untouched (don't reset it — permanent by design).

### 3. Touch `last_active_at`
In `server/api/me/profile.get.ts`, after fetching the profile, fire an update: `sb.from('profiles').update({ last_active_at: new Date().toISOString() }).eq('id', userId)` (don't block the response on it — `.then()`/fire-and-forget is fine, matching the existing tolerant style elsewhere in this file).

### 4. Revert project limit + Pro carve-out
In `app/composables/usePlan.ts`:
- `PROJECT_LIMIT = 3`.
- `canCreateProject()` → `isPro.value || projectStore.projects.length < PROJECT_LIMIT`.
- Add an `accessibleProjectIds` computed (or a `isProjectLocked(projectId)` helper): if `isPro`, everything is accessible; otherwise take `projectStore.projects` sorted by `created_at` ascending, first `PROJECT_LIMIT` ids are accessible, the rest are locked. (If a free account already has ≤3 projects, this is a no-op — nothing is locked.)

### 5. Locked-state UI in `projects.vue`
Use the new `accessibleProjectIds`/`isProjectLocked` helper to render a locked visual state (dimmed thumbnail + lock badge) on any card past the free cap. Locked cards: **block opening** (clicking navigates to an upsell prompt instead of `/advanced/[id]`, or opens the existing Pro-upsell modal already used for the creation-limit case), but **keep delete available** — deleting other locked projects down to ≤3 total is the stated way to regain access, so delete must not be gated.

### 6. Lock enforcement in `advanced/[id]/index.vue`
After `loadProject(projectId.value)` succeeds, check `isProjectLocked(projectId.value)`. If locked, don't render `SnipTool` — show a locked-state branch (same shape as the existing `loadError` branch) with copy explaining the project is inaccessible on the free plan, plus the same upsell CTA used elsewhere (Subscribe / 3-Day Pass) and a link back to `/projects` to delete other projects instead.

### 7. Purge cron endpoint
New `server/api/cron/purge-inactive-sources.get.ts`:
- Verify `Authorization: Bearer ${process.env.CRON_SECRET}` (Vercel's standard pattern for securing cron routes) — reject with 401 otherwise.
- Query: `profiles` where `has_ever_paid = false` and `last_active_at < now() - interval '30 days'`.
- For each matching profile: fetch their `projects` ids, then for each project `sb.storage.from('screenshots').list('${userId}/${projectId}')` to get the actual file objects (not just the top-level user folder, which only returns project-folder placeholders) and `.remove()` the full paths. Storage bytes only — do not touch `source_images`/`snips`/`compositions` rows.
- Log a summary count (accounts processed, files removed) for now; no need for a dashboard.

### 8. Cron schedule
Add `vercel.json` at repo root:
```json
{ "crons": [{ "path": "/api/cron/purge-inactive-sources", "schedule": "0 3 * * *" }] }
```
Daily at 3am UTC — infrequent enough that exact timing doesn't matter for a 30-day window. (Going with plain `vercel.json` over the newer `vercel.ts`/`@vercel/config` approach since it needs no new dependency and is guaranteed to work for a Nuxt project; can revisit if you'd rather standardize on `vercel.ts`.)
- Requires setting a `CRON_SECRET` env var in Vercel (any random string) — will need to be added via `vercel env add` or the dashboard; I'll flag this as a manual step rather than doing it myself.

## Out of scope (explicitly, per this conversation)
- Multi-account abuse prevention — not guarding against it right now.
- Any change to capture allowances/pricing tiers themselves.
- Any DB cascade delete or deletion of `source_images`/`snips`/`compositions` rows — purge is storage-bytes-only.
- Compression of stored images — confirmed intentional, not touched.

## Verification
- Unit-test the new `usePlan.ts` logic (`PROJECT_LIMIT`, `canCreateProject`, lock helper) alongside existing `tests/usePlan.test.ts`.
- Manually exercise: create a free-tier test account with 5 projects (via Supabase directly or the UI), confirm the 2 newest show locked + can't open, oldest 3 open fine, deleting 2 of the locked ones unlocks the remainder.
- Manually invoke the cron endpoint locally with a fake `CRON_SECRET` against a test profile with `last_active_at` backdated >30 days and `has_ever_paid = false`, confirm storage objects are removed and the app shows the existing "failed source" state for that project afterward, while a `has_ever_paid = true` profile in the same state is left untouched.
- Since this touches Supabase storage/schema and per project instructions there's no staging DB, run these checks carefully against production data (a disposable test account, not a real user's data).
