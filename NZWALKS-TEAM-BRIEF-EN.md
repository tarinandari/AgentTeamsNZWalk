# Project Brief — NZ Walks (Hiking & Trekking Finder, New Zealand)

A new backend (NestJS) that connects to an **existing** SQL Server database
(`NZWalksDb`) — not a new schema. Angular frontend for searching and
browsing hiking trails.

---

## 0. Before Agent Teams — connect to the DB first (manual, not a team task)

This part **must** be done by you (or a single interactive Claude session)
before spawning any team — every backend teammate afterward depends on this
connection already working.

### 0.1 Install the required packages

```bash
cd backend
npm install @nestjs/typeorm typeorm mssql
npm install @nestjs/config
```

Quick explanation:
- **TypeORM** — the ORM for NestJS, supports SQL Server via the `mssql` driver
- **`@nestjs/config`** — so the connection string isn't hardcoded, it's read from `.env`

### 0.2 Create a `.env` file in `backend/`

```env
DB_HOST=localhost
DB_PORT=1433
DB_USERNAME=sa
DB_PASSWORD=<your_sql_server_password>
DB_DATABASE=NZWalksDb
```

**Do not commit this `.env` file.** Check `backend/.gitignore` exists first
(it may not, since scaffolding used `--skip-git` — see `INITIAL-GUIDE.md`
step 2.4). Then confirm it contains `.env`; add the line if it's missing:
```
.env
```
Verify it's actually being ignored before moving on:
```bash
git check-ignore -v backend/.env
```
If that command prints nothing, `.env` is **not** ignored — fix
`backend/.gitignore` before proceeding, or the DB password risks getting
committed in a later step.

### 0.3 Configure the connection in `app.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mssql',
        host: config.get('DB_HOST'),
        port: Number(config.get('DB_PORT')),
        username: config.get('DB_USERNAME'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_DATABASE'),
        options: { encrypt: false, trustServerCertificate: true },
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false,   // IMPORTANT — never let TypeORM alter the existing schema
        autoLoadEntities: true,
      }),
    }),
  ],
})
export class AppModule {}
```

**Two easy-to-miss bugs, fixed above:**
- `Module` from `@nestjs/common` must be imported — it's used in the
  `@Module({...})` decorator but is easy to forget when copy-pasting just
  the TypeORM-related imports.
- `port` must be wrapped in `Number(...)`. `ConfigService.get()` always
  returns a **string** (everything in `.env` is plain text), but the
  `mssql` driver expects `port` as a **number**. Skipping the cast can
  compile fine and still fail to connect at runtime.

**Note:** this snippet replaces the whole `@Module({...})` block, but keep
whatever `nest new` already scaffolded outside of it — `AppController` and
`AppService` are still registered by default in `app.module.ts`'s
`controllers`/`providers` arrays. Merge this in rather than deleting those.

**`synchronize: false` is mandatory.** If set to `true`, TypeORM will try to
"reconcile" the DB schema with whatever entities you define in code — even a
small mismatch can cause it to **alter or drop columns in your existing DB**.
Since this database already holds real data, that risk is not acceptable.

### 0.4 Verify the connection works

Run `npm run start:dev` — if there's no connection error in the console, the
DB is connected. Only then move on to the next section.

---

## 1. Data structure (from the existing DB, do not redesign it)

Based on your schema screenshots:

**`Difficulty`**
| Column | Type |
|---|---|
| Id | uniqueidentifier (PK) |
| Name | nvarchar |

**`Region`**
| Column | Type |
|---|---|
| Id | uniqueidentifier (PK) |
| Code | nvarchar |
| Name | nvarchar |
| RegionImageUrl | nvarchar, nullable |

**`SubRegion`**
| Column | Type |
|---|---|
| Id | int (PK) |
| SubRegionName | varchar(100) |
| RegionId | uniqueidentifier (FK → Region) |

**`Walk`**
| Column | Type |
|---|---|
| Id | uniqueidentifier (PK) |
| Name | nvarchar |
| Description | nvarchar |
| LengthInKm | float |
| WalkImageUrl | nvarchar, nullable |
| DifficultyId | uniqueidentifier (FK → Difficulty) |
| RegionId | uniqueidentifier (FK → Region) |
| SubRegionId | int, nullable (FK → SubRegion) |

**Note:** `SubRegionId` on `Walk` is **nullable** — not every walk needs a
sub-region. In the UI, this field should be optional on create/edit, and the
SubRegion dropdown should include a "— none —" / empty option.

---

## 2. API contract (REQUIRED — so the API and UI teammates don't guess independently)

**Reference data — add, edit & view only (no delete):**

| Method | Path | Body | Response |
|---|---|---|---|
| GET | `/regions` | — | `Region[]` |
| GET | `/regions/:id` | — | `Region`, or 404 |
| POST | `/regions` | `{ code: string, name: string, regionImageUrl?: string }` | `Region` (201) |
| PATCH | `/regions/:id` | any of the POST fields (partial) | `Region` or 404 |
| GET | `/subregions` | query `?regionId=` (optional filter) | `SubRegion[]` |
| GET | `/subregions/:id` | — | `SubRegion`, or 404 |
| POST | `/subregions` | `{ subRegionName: string, regionId: string }` | `SubRegion` (201) |
| PATCH | `/subregions/:id` | any of the POST fields (partial) | `SubRegion` or 404 |
| GET | `/difficulties` | — | `Difficulty[]` |
| GET | `/difficulties/:id` | — | `Difficulty`, or 404 |
| POST | `/difficulties` | `{ name: string }` | `Difficulty` (201) |
| PATCH | `/difficulties/:id` | `{ name: string }` (partial) | `Difficulty` or 404 |

**No DELETE for these three modules** — they're referenced by `Walk` rows
via foreign keys, so deleting one would either orphan or block existing
walks. Editing is safe (the FK still points at the same row); deleting is
not.

**Walks — full CRUD:**

| Method | Path | Body | Response |
|---|---|---|---|
| GET | `/walks` | query `?regionId=&subRegionId=&difficultyId=&search=` | `Walk[]` (with `region`, `subRegion`, `difficulty` included, not raw IDs) |
| GET | `/walks/:id` | — | full `Walk` detail, or 404 |
| POST | `/walks` | `{ name, description, lengthInKm, walkImageUrl?, difficultyId, regionId, subRegionId? }` | `Walk` (201) |
| PATCH | `/walks/:id` | any of the fields above (partial) | `Walk` or 404 |
| DELETE | `/walks/:id` | — | 204 or 404 |

`search` filters by walk name (case-insensitive, `LIKE %keyword%`).

The `Walk` response should already be joined, not raw IDs, so the frontend
doesn't need an extra request per item:
```typescript
{
  id: string;
  name: string;
  description: string;
  lengthInKm: number;
  walkImageUrl: string | null;
  difficulty: { id: string; name: string };
  region: { id: string; name: string; code: string };
  subRegion: { id: number; subRegionName: string } | null;
}
```

---

## 3. Team split — 2 waves

**Talk to each other, not just to the lead, when it's a content decision.**
Teammate A and Teammate B run in parallel and start from the contract in
Section 2 above, but that contract can still turn out to be incomplete or
wrong once real code meets the real database. When that happens:
- If A finds the actual `Region`/`SubRegion`/`Difficulty`/`Walk` schema in
  SQL Server disagrees with Section 1 (a column's type, nullability, or
  name), A messages B directly with the real shape as soon as it's found —
  don't wait until Wave 1 wraps up for B to discover it via a failing
  request.
- If B needs a contract detail Section 2 doesn't spell out (exact
  validation-error shape, whether a field is required on create but
  optional on patch, what an empty result list looks like), B messages A
  and waits for an answer instead of guessing.
- If a decision affects both sides and isn't already settled by this brief
  (e.g. what `DELETE /walks/:id` returns on success), A and B agree on one
  answer between themselves, both apply it, and mention the agreed
  decision in their normal report to the lead.
- Agreeing on a contract detail between yourselves is fine. Agreeing to
  expand either teammate's file scope is not — that still goes through the
  lead, same as any other scope change.
- **Ping each other as each entity finishes, don't wait for the whole
  backend.** As soon as A finishes one entity's endpoints (Regions, then
  SubRegions, then Difficulties, then Walks — in that order), A messages B
  with a short "ready" notice and one real sample response for that
  entity. B can start wiring that entity's page immediately, against the
  real payload rather than the paper contract, instead of waiting for all
  four entities to be done. Expect this to happen four times over Wave 1,
  not once at the end.
- **Sanity-check with each other before telling the lead you're done.**
  A quick message confirming the final endpoint/field list matches what
  the other actually built against catches a last-minute mismatch here,
  between the two of you, instead of in the lead's Definition-of-Done
  check or Teammate D's review later.

In Wave 2, Teammate C stays active after finishing its initial test suite
instead of shutting down — this is deliberate, so it and Teammate D can
actually talk during the review instead of D's findings going nowhere. If
D finds a testing gap, D messages C directly; C adds the test and
**replies back to D** confirming it passes; D re-checks before marking the
finding resolved. Both get shut down together once D's full review is
done (see `ORCHESTRATOR.md`), so the gap gets closed in this wave rather
than surfacing only as a finding for the user to relay.

**Rule for every teammate below, regardless of role:** when you need to
restart your own dev server, stop only the specific process you yourself
started — by its PID, or by re-running in the same terminal you already
own. Never run a broad or system-wide kill command (`taskkill /IM`,
`taskkill /F` without a specific PID, `pkill` by name, `killall`, etc.).
Those can kill another teammate's process, the lead session, or something
unrelated running on the user's machine. If you're not sure a process is
yours to stop, ask the lead first instead of killing it.

### Wave 1 — parallel

**Teammate A — Backend API**
- Scope: `backend/src/regions/`, `backend/src/subregions/`, `backend/src/difficulties/`, `backend/src/walks/`
- Create TypeORM entities matching the structure above (map to the existing
  tables, use `@Entity('Difficulties')` etc. — **match the table names
  exactly** as they appear in SQL Server, including capitalization)
- `regions`, `subregions`, `difficulties`: GET (list), GET (detail), POST
  (create), and PATCH (update) endpoints — **do not** add DELETE for these
  three modules
- `walks`: full CRUD (GET list, GET detail, POST, PATCH, DELETE) per the contract above
- Basic validation: `name`/`title` must not be empty, `lengthInKm` must be a positive number
- **`app.module.ts` carve-out:** each new module you create
  (`RegionsModule`, `SubRegionsModule`, `DifficultiesModule`,
  `WalksModule`) must be registered in `app.module.ts`'s `imports: []`
  array, or its routes won't be reachable even though the code compiles.
  You may add these import lines and the corresponding entries in
  `imports: []` — nothing else in that file. Don't touch the
  `TypeOrmModule.forRootAsync` block, `ConfigModule.forRoot`,
  `synchronize`, or anything already configured there from Section 0.
- Forbidden: editing `main.ts` beyond the existing `enableCors` line,
  editing anything in `app.module.ts` beyond the module registration
  described above, editing anything under `frontend/`

**Teammate B — Frontend UI**
- Scope: `frontend/src/app/walks/`, `frontend/src/app/regions/`, `frontend/src/app/subregions/`, `frontend/src/app/difficulties/`
- **Walks page** (main feature):
  - Walk list (card/table) with **Edit** and **Delete** buttons per item
  - **Add Walk** button that opens a create form
  - Create/edit form fields: name, description, lengthInKm, walkImageUrl,
    Region dropdown, SubRegion dropdown, Difficulty dropdown
  - **SubRegion dropdown is cascading**: when the user picks a Region in the
    form, refresh the SubRegion dropdown by calling
    `GET /subregions?regionId=<id>` — don't show all subregions from every
    region at once. Include an empty/"— none —" option since this field is
    nullable
  - Confirm before delete (a simple dialog/modal is enough)
- **Regions, SubRegions, Difficulties pages** (reference data):
  - Each gets its own page with a **list of all existing records**
    (card/table), showing the meaningful fields — Regions: code, name,
    image URL; SubRegions: subRegionName plus which Region it belongs to
    (show the region's name, not the raw ID); Difficulties: name
  - An **Add** form on each page to create a new record
  - An **Edit** button per row/item that opens the same form pre-filled,
    submitting via `PATCH /<resource>/:id`
  - **No Delete button** on any of these three pages — these records are
    referenced by walks via foreign keys, so deletion isn't supported.
    Only `walks` gets delete
  - The Add/Edit SubRegion form needs a Region dropdown (to populate
    `regionId`)
- Data types must match the contract above exactly (`walk.model.ts`, `region.model.ts`, etc.)
- Forbidden: editing anything under `backend/`

**Definition of done:** build succeeds, `start:dev` (backend) and `ng serve`
(frontend) both run, endpoints can be tested manually, the UI shows real
data from the DB (not dummy data).

### Wave 1.5 — UI polish for demo (Teammate B only, optional)

Run this when the user wants the app to actually look presentable rather
than just work. The lead should offer it at the Wave 1 checkpoint rather
than waiting to be asked. It's purely cosmetic, doesn't touch the backend,
and can run in parallel with Wave 2 (no file overlap with Teammates C or
D).

**Goal: attractive, not just tidy.** The bar here isn't "no longer looks
broken" — it's "someone seeing this cold would think it's a real
product." Bare-minimum tidiness (consistent spacing, no default browser
styling) is the floor, not the target. Aim for something with actual
visual character: a considered color palette, some personality in the
typography, a layout that feels designed rather than assembled.

**Approach: either Angular Material or a cohesive custom theme — not
strictly required to be Material.** What matters is the result, not the
method. A themed custom look (e.g. an earthy green palette fitting a
hiking/nature product, card-style grouping for filters, a serif heading
font for warmth, a clearly distinct primary CTA button) is just as valid
as Material components, and can fit the NZ Walks subject matter better
than generic Material blue. Pick whichever gets there with less rework
given what Wave 1 already built.

**Quality bar — what "done" looks like:**
- Nav bar reads as a proper nav (spaced, no raw blue-underline links)
- Page has a clear heading + short subtitle, not just a bare form
- Filters/search are visually grouped (e.g. in a card or panel), not
  loose inputs floating on the page
- Primary action (Add Walk, Create Walk, etc.) is visually distinct from
  secondary actions (Cancel) — different color/weight, not identical
  buttons
- Forms have consistent spacing and labeled fields, not cramped defaults
- Empty and error states (e.g. "No walks found", a failed fetch) are
  styled consistently with the rest of the page, not raw unstyled text
- Consistent color palette and spacing scale across all four
  pages — no page that looks visibly unfinished next to the others
- The walk list has at least one deliberate visual flourish, not just a
  plain table — e.g. a card grid with a colored difficulty badge per walk
  (see below), rounded corners, and enough whitespace that it doesn't
  read as a dense spreadsheet
- Pick a palette with actual personality suited to a hiking/nature
  product (e.g. greens/earth tones) rather than defaulting to generic
  corporate blue-and-gray — this is what makes it feel designed instead
  of just "styled"
- The page itself needs a background treatment — a stark plain-white
  canvas behind everything reads as unfinished no matter how good the
  cards/nav look on top of it. Use your own judgment on the specific
  approach (a soft tinted background, a subtle nature-themed pattern or
  texture, a hero banner behind the page title, a gradient wash — pick
  whatever fits the earthy hiking palette without fighting the content
  for attention). This doesn't need pre-approval on the specific choice,
  just make it cohesive with the rest of the theme

**Concrete pattern already in place — reuse it, don't reinvent it per page.**
Regions/SubRegions/Difficulties were built with this chrome from the start;
Walks was missed initially and had to be retrofitted, so apply it there too
from the beginning next time:
- **Page header:** `<header class="page-header">` containing an `<h2>` title
  and a `<p class="page-subtitle">` one-line description. If the page also
  has a header-level action button (Walks' "Add Walk" link, since its
  create form lives on a separate route instead of inline), wrap the title
  block and the button in a `.page-header-row` flex container
  (`justify-content: space-between`) instead of putting the button loose in
  the header.
- **Add/edit form → white card:** wrap the create/edit form in
  `<mat-card class="form-card" appearance="outlined">` with a
  `<mat-card-header><mat-card-title>` (e.g. "Add a region" / "Edit region").
  `mat-card` already renders on the Material surface color (white in the
  light theme), so no extra background CSS is needed — just the wrapper.
  Regions' `regions-list.html`/`.scss` is the reference implementation;
  Walks' `walk-form.html`/`.scss` now follows the same shape.
- **Filter bar → white card too:** when a list page has a filter/search bar
  above the results (Walks does; Regions/SubRegions/Difficulties don't),
  wrap that `<form>` in its own `<mat-card class="filters-card"
  appearance="outlined">` rather than leaving the inputs floating directly
  on the page background — see `walks-list.html`/`.scss`.
- **Error banner:** reuse the existing `.error-banner` style (soft
  red/pink, left border accent) for this page's fetch/submit errors instead
  of a plain `<p class="error">` — the class name should be `error-banner`
  everywhere, not a per-page reinvention.
- **Delete confirmation → Material dialog, not `confirm()`.** A native
  browser `confirm()` popup looks out of place next to the styled cards
  above. Use the shared `ConfirmDialog` component at
  `frontend/src/app/shared/confirm-dialog/confirm-dialog.ts` instead —
  `inject(MatDialog).open<ConfirmDialog, ConfirmDialogData, boolean>(ConfirmDialog, { data: { title, message, confirmLabel } })`,
  act on `.afterClosed()` emitting `true`. `walks-list.ts`'s `deleteWalk()`
  is the reference usage (it's currently the only delete action in the
  app, per the "no DELETE on reference data" rule above, but reuse the
  same component for any future destructive action instead of a new
  native `confirm()`).
- **Success feedback on create → green snackbar, every module.** After any
  **create** (not edit) request succeeds — Region, SubRegion, Difficulty,
  Walk — show a top-centered `MatSnackBar` with a green background via the
  shared helper `showSuccessSnackbar(snackBar, message)` at
  `frontend/src/app/shared/success-snackbar.ts` (it sets
  `panelClass: ['snackbar-success']`, `verticalPosition: 'top'`,
  3s duration). The green styling itself lives once, globally, in
  `styles.scss` (`.snackbar-success` setting
  `--mat-snack-bar-container-color`/`--mat-snack-bar-supporting-text-color`/
  `--mat-snack-bar-button-color`) — don't redefine the colors per
  component. Gate it on the create branch of the existing
  `id === null ? create(...) : update(...)` pattern each module already
  uses; edits don't get this toast. `walk-form.ts` fires it just before
  `router.navigate(['/walks'])` — the snackbar is CDK-overlay-based so it
  correctly survives the route change and still shows on the list page.
- Individual result cards in a grid (e.g. each walk in the Walks grid) are
  already `mat-card`s and don't need extra wrapping — this pattern is about
  the surrounding header/filter/form chrome, not repeating cards you've
  already styled.

**Further polish beyond the bar above is welcome, not just tolerated** —
e.g. hover/focus states on interactive elements, a loading indicator while
data fetches, a toast/snackbar on successful create/delete, responsive
behavior on a narrower viewport. None of this is required, but if there's
time, it raises the demo quality further.

**Scope:** `frontend/src/app/**` (styling only) plus the shared shell
(`app.html`/`app.ts` or equivalent) for the nav bar — this is the same
shared-file situation as the earlier nav-bar routing change, so apply the
same rule: only touch layout/styling in the shared file, nothing
functional.

Tasks:
- Pick an approach (Angular Material, or a custom theme/SCSS) and apply it
  consistently across all four pages — don't mix half-Material,
  half-unstyled
- **Known gotcha if using Angular Material 18+ with the M3 `mat.theme()`
  API:** `color="primary"` / `color="accent"` / `color="warn"` on
  `mat-*-button` still adds the `mat-primary`/`mat-accent`/`mat-warn`
  class, but nothing in Material's M3 button CSS reads that class anymore
  — every colored button silently renders as a plain surface-colored
  button no matter which color was requested (this is a known upstream
  regression vs. the old M2 theme, not a mistake in your setup). Actually
  check a rendered "Add Walk"/primary button, don't assume `color="..."`
  worked just because it compiled. If it's washed out, add a small global
  fix in `styles.scss` that feeds the button's own CSS custom properties
  (e.g. `--mat-button-protected-container-color`,
  `--mat-button-filled-container-color`,
  `--mat-button-text-label-text-color`) from the `--mat-sys-primary` /
  `--mat-sys-secondary` / `--mat-sys-error` tokens, scoped to
  `.mat-primary` / `.mat-accent` / `.mat-warn` — one fix in the shared
  stylesheet, not per-page.
- Nav bar: proper spacing between links, no default browser
  underline/blue-link look, visually separated from page content
- Walks page: styled list/table/card grid for results, grouped
  filter/search controls (see quality bar above), visually distinct
  primary action button for "Add Walk"
- Difficulty badge: show each walk's difficulty as a small colored badge
  (e.g. green/amber/red or similar semantic mapping — easy reads as calm,
  hard reads as caution), not just plain text. Keep it to 2–3 difficulty
  colors max, matched to whatever difficulty values actually exist in the
  DB — don't hardcode assuming exactly "Easy/Moderate/Hard" if the real
  data differs
- Regions/SubRegions/Difficulties pages: same treatment — list, add form,
  and edit controls all styled consistently with the Walks page (no
  delete controls exist on these three per the brief)
- **List rows need visible structure.** A bare vertical stack of text
  lines floating on the background reads as unfinished. Give each record
  its own contained row or card — a border or a surface panel behind it,
  consistent padding, and even vertical spacing between rows. Align the
  columns so the same field starts at the same x-position on every row:
  records with an image and records without one must not shift the text
  sideways relative to each other. Where a record has an optional image,
  reserve the space (or a neutral placeholder) so the layout stays on a
  grid instead of ragging left and right. Handle both cases for every
  optional image field (Region `regionImageUrl`, Walk `walkImageUrl`): no
  URL at all (fallback placeholder, as above) **and** a URL that fails to
  load (broken link, 404, etc.) — add an `(error)` handler on the `<img>`
  that swaps in the same fallback instead of leaving the browser's default
  broken-image icon on screen
- Create/edit forms: consistent field styling and spacing for every input
  and dropdown — including the cascading SubRegion one, whose *behavior*
  stays exactly as Wave 1 built it, only the visual wrapper changes
- Loading transitions for the two actions users will notice most: search
  (e.g. a spinner or skeleton while results refetch, not a jarring
  blank-then-populate flash) and Add Walk submit (e.g. a spinner/disabled
  state on the Create button while the request is in flight, then a
  success indication). At minimum these two must never leave the user
  wondering "did it even do anything?" — beyond that, add loading and
  transition polish anywhere else it improves the feel
- Empty states ("No walks found") and error states should look
  intentional and on-theme, not like unstyled leftover text. The existing
  soft red/pink banner used for a failed initial fetch is the reference
  pattern — reuse that same treatment consistently for **every** action
  that can fail, not just the initial load: a failed create/Add Walk, a
  failed edit, a failed delete, and a failed search/filter request. Each
  should say what went wrong in plain language, not surface a raw
  exception string or HTTP status code to the user. Success feedback
  (create/delete succeeded) should use the same visual family in a
  positive color rather than a separate style invented per-action.

**Creative latitude:** there's no upper limit on how polished this can be
— dark mode, richer animations and transitions, hover and focus states,
custom iconography, hero imagery, a considered type scale, responsive
behavior, skeleton loaders, toasts, whatever raises the quality. Use your
own judgment on what's worth adding. The only rule is cohesion: a
consistent palette, spacing scale, and component style across all four
pages beats a scattering of individually clever touches that don't match
each other.

**The one hard boundary:** this pass is visual only. Don't change
component logic, API calls, routing behavior, or the cascading SubRegion
dropdown's behavior — Wave 1 already built and verified those. Restyle
the wrapper around them freely, but if a change would alter what the app
*does* rather than how it *looks*, stop and flag it to the lead instead
of making it.

**Definition of done:** `ng serve` runs clean, all four pages render with
consistent, on-theme styling (no raw unstyled HTML controls left), nav bar
is visually separated and readable, existing frontend tests still pass
(fix any that only fail because of the markup change, e.g. a test
querying for a native `<select>` that's been replaced by a different
element).

### Wave 2 — after Wave 1 is reviewed by you

**Teammate C — Unit Tests (backend)**
- Test the service layer of each module (`regions`, `difficulties`, `walks`)
  — especially the filter logic in `walks` (combined region+difficulty+search
  query params)
- Mock the TypeORM repository, do not hit the real DB in unit tests
- **Stay active after your initial suite is done** — don't shut down.
  Teammate D reviews next and may message you directly about a coverage
  gap; add the test, run it, and reply to D confirming it passes.

**Teammate D — Code Reviewer**
- Runs after Teammate C's initial pass, while C is still active
- Checks the same 4 things as before: coding standards, naming standards,
  potential issues (especially: is `synchronize: false` still intact, is
  the `search` param properly parameterized against SQL injection), and
  contract consistency between the API and the UI
- **Message Teammate C directly** for any testing gap you find instead of
  only listing it as a finding — wait for C's reply confirming the added
  test passes before marking that item resolved

---

## Checklist before spawning Wave 1

```bash
# backend
cd backend && npm run start:dev
# watch the console — confirm TypeOrmCoreModule initializes with no
# connection error, and that Nest logs "Nest application successfully
# started"

cd ../frontend && ng serve
cd ..
git status   # working tree clean
```

**Note:** don't check this by curling `/regions` — that endpoint doesn't
exist yet, it's exactly what Teammate A builds in Wave 1. Hitting it now
correctly returns a 404 ("Cannot GET /regions"), which is expected and does
**not** mean the DB is broken. The real signal is the startup log: if
`TypeOrmCoreModule dependencies initialized` appears and the app starts
without a connection error (`ELOGIN`, `ConnectionError`, timeout, etc.),
the DB is reachable and you're ready to spawn Wave 1.

---

## Next step: don't spawn Wave 1 yourself

Everything above this line is context for the agent team — it's not a
list of commands for *you* to run by hand from here. Once the checklist
passes, stop the dev servers (`Ctrl+C` in both terminals) and open
**`ORCHESTRATOR.md`** — it has the exact steps for starting a Claude Code
session and telling it to run this whole workflow.
