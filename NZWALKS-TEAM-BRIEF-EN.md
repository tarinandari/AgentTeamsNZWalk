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

**Reference data — add & view only (no edit/delete):**

| Method | Path | Body | Response |
|---|---|---|---|
| GET | `/regions` | — | `Region[]` |
| POST | `/regions` | `{ code: string, name: string, regionImageUrl?: string }` | `Region` (201) |
| GET | `/subregions` | query `?regionId=` (optional filter) | `SubRegion[]` |
| POST | `/subregions` | `{ subRegionName: string, regionId: string }` | `SubRegion` (201) |
| GET | `/difficulties` | — | `Difficulty[]` |
| POST | `/difficulties` | `{ name: string }` | `Difficulty` (201) |

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
- `regions`, `subregions`, `difficulties`: only GET (list) and POST (create)
  endpoints — **do not** add PATCH/DELETE for these three modules
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
  - List (view) only + a simple "Add" form
  - **No** edit/delete buttons on these pages
  - The Add SubRegion form needs a Region dropdown (to populate `regionId`)
- Data types must match the contract above exactly (`walk.model.ts`, `region.model.ts`, etc.)
- Forbidden: editing anything under `backend/`

**Definition of done:** build succeeds, `start:dev` (backend) and `ng serve`
(frontend) both run, endpoints can be tested manually, the UI shows real
data from the DB (not dummy data).

### Wave 1.5 — UI polish for demo (Teammate B only, optional)

Only run this if the user asks for it — e.g. before a demo to
stakeholders. It's purely cosmetic, doesn't touch the backend, and can run
in parallel with Wave 2 (no file overlap with Teammates C or D).

**Library: Angular Material.** Reasoning — it's maintained by the Angular
team, installs cleanly via `ng add @angular/material`, and gives
ready-made components (table, card, form field, select, button, snackbar)
that look professional without designing a custom style from scratch. This
matters here because Wave 1 built everything with native HTML elements
(`<select>`, `<input>`, plain `<a>` tags for nav), so there's no existing
design system to fight with — Material can be dropped in directly.

**Scope:** `frontend/src/app/**` (styling only) plus the shared shell
(`app.html`/`app.ts` or equivalent) for the nav bar — this is the same
shared-file situation as the earlier nav-bar routing change, so apply the
same rule: only touch layout/styling in the shared file, nothing
functional.

Tasks:
- Run `ng add @angular/material` (pick a prebuilt theme, typography +
  animations: yes)
- Nav bar: convert to a proper `mat-toolbar` with spaced links, remove the
  default browser underline/blue-link look
- Walks page: `mat-table` (or `mat-card` grid) for the walk list,
  `mat-form-field` + `mat-select` for the Region/SubRegion/Difficulty
  filter dropdowns, `mat-button`/`mat-raised-button` for Add/Edit/Delete
  actions
- Regions/SubRegions/Difficulties pages: same form-field/button treatment,
  simple list or table for the "view only" data
- Create/edit forms: `mat-form-field` for every input, `mat-select` for
  dropdowns (including the cascading SubRegion one — behavior stays
  exactly as Wave 1 built it, only the visual wrapper changes)
- Empty states ("No walks found") and loading states should look
  intentional, not like unstyled leftover text

**Explicitly out of scope — don't do these, they cost time without adding
demo value:**
- No dark mode toggle
- No custom Material theme/branding (default prebuilt theme is fine)
- No animations beyond what Material gives for free
- No changes to component logic, API calls, or the cascading dropdown
  behavior — this pass is visual only

**Definition of done:** `ng serve` runs clean, all four pages render with
Material components (no raw unstyled HTML controls left), nav bar is
visually separated and readable, existing frontend tests still pass (fix
any that only fail due to the markup change, e.g. a test querying for a
native `<select>` that's now `mat-select`).

### Wave 2 — after Wave 1 is reviewed by you

**Teammate C — Unit Tests (backend)**
- Test the service layer of each module (`regions`, `difficulties`, `walks`)
  — especially the filter logic in `walks` (combined region+difficulty+search
  query params)
- Mock the TypeORM repository, do not hit the real DB in unit tests

**Teammate D — Code Reviewer**
- Runs last
- Checks the same 4 things as before: coding standards, naming standards,
  potential issues (especially: is `synchronize: false` still intact, is
  the `search` param properly parameterized against SQL injection), and
  contract consistency between the API and the UI

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
