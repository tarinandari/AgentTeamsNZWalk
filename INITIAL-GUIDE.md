# Initial Guide — Repo Setup + Angular & NestJS Scaffold

For anyone using NestJS for the first time, and who hasn't touched Angular
in a while. This is only **Step 1 & 2** — Agent Teams isn't involved yet.
The goal: get to a point where the frontend and backend both run and can
talk to each other (one simple API fetch), before Agent Teams comes in for
the actual features.

---

## Before you start — check prerequisites

```bash
node --version      # need v18 LTS or above (ideally v20)
npm --version
git --version
```

If `node` isn't installed or is outdated, install it from
https://nodejs.org (get the **LTS** version, not "current"). The latest
NestJS and Angular need Node 18+.

---

## Terminology first, so nothing is confusing later

| Term | Meaning |
|---|---|
| **Angular CLI** (`ng`) | Angular's official command line tool. Creates projects, generates components, runs the dev server |
| **NestJS CLI** (`nest`) | Same concept as the Angular CLI, but for the backend. Creates projects, generates modules/controllers/services |
| **Module** (NestJS) | How NestJS groups features — think of it as a "feature folder" containing a controller + service, sometimes an entity |
| **Controller** (NestJS) | Receives HTTP requests (similar to a Controller in the ASP.NET project you already know) |
| **Service** (NestJS) | Where business logic lives (similar to the Service layer in your earlier .NET project) |
| **Component** (Angular) | One UI block — HTML + TypeScript + CSS bundled as a single unit. Angular pages are built from many components |

If you remember the Controller → Service → Repository pattern from the
NZWalksWebApi project, NestJS's structure is **very similar**. The
differences are the language (TypeScript, not C#) and how dependencies are
"registered" — via decorators (`@Injectable()`, `@Controller()`) instead of
`builder.Services.AddScoped<>()`.

---

# STEP 1 — Create an empty repo

### 1.1 Pick a location & create the folder

```bash
cd /d/CDC          # or wherever you work, avoid spaces in the folder name
mkdir my-angular-nest-app && cd my-angular-nest-app
```

### 1.2 Init git

```bash
git init
git branch -M main
```

### 1.3 Create the base folder structure

```bash
mkdir frontend backend
```

The final structure will be:

```
my-angular-nest-app/
├── frontend/     ← Angular app
├── backend/      ← NestJS app
└── .git/
```

**Why split it this way (a simple monorepo, not two separate repos):** so
that a single Agent Team later can see both the frontend and backend in one
session, and a single `git commit` can cover changes on both sides when they
genuinely relate to each other (e.g. changing an API field + updating the
component that calls it).

---

# STEP 2 — Scaffold Angular & NestJS

## 2.1 Install the CLIs (once, globally)

```bash
npm install -g @angular/cli
npm install -g @nestjs/cli
```

Verify:

```bash
ng version
nest --version
```

## 2.2 Scaffold Angular (frontend)

From the root folder (`my-angular-nest-app/`):

```bash
ng new frontend --directory=frontend --routing --style=scss --skip-git
```

Flag breakdown:
- `--directory=frontend` — install directly into the existing `frontend/` folder (not a new subfolder)
- `--routing` — automatically sets up Angular Router, you'll almost certainly need this even for a small project
- `--style=scss` — use SCSS instead of plain CSS (optional, switch to `css` if you'd rather keep it simple)
- `--skip-git` — don't init a new git repo inside `frontend/`, since you already ran `git init` at the root

The CLI will ask a few questions (e.g. whether to enable SSR) — for a small
first-time project, answer **No** to SSR/zoneless to keep the setup simpler
for now.

Verify it runs:

```bash
cd frontend
ng serve
```

Open `http://localhost:4200` — the default Angular page should appear.
Press `Ctrl+C` to stop, then `cd ..` back to the root.

## 2.3 Scaffold NestJS (backend)

```bash
nest new backend --skip-git --package-manager npm
```

The CLI generates the base structure. You'll see this under `backend/src/`:

```
backend/src/
├── app.controller.ts       ← default controller (example endpoint)
├── app.controller.spec.ts  ← unit test for the controller above
├── app.module.ts           ← the main module, where all other modules get registered
├── app.service.ts          ← default service
└── main.ts                 ← entry point, this is where the app actually starts
```

Notice `app.controller.spec.ts` was generated automatically — the NestJS CLI
**always** generates a matching test file every time you `nest generate`
something. This is a good habit that differs from .NET (in .NET you had to
manually create a separate test project, like you did before).

Verify it runs:

```bash
cd backend
npm run start:dev
```

Open `http://localhost:3000` in a browser — it should show `Hello World!`.
Press `Ctrl+C` to stop, then `cd ..`.

### 2.4 Verify `backend/.gitignore` exists

Because `--skip-git` was used, don't assume a `.gitignore` was generated
correctly inside `backend/`. Check it now, before you have any secrets to
leak:

```bash
cd backend
ls -la .gitignore
```

If it's missing, create one with at least the essentials:

```bash
cat > .gitignore << 'EOF'
node_modules/
dist/
.env
*.log
EOF
```

This matters now, not later — `NZWALKS-TEAM-BRIEF-EN.md` (step 0.2) tells
you to add `.env` to `backend/.gitignore` once you set up the DB
connection. If the file doesn't exist yet, that instruction silently does
nothing and your DB password can end up committed. Confirm it exists
**before** moving on to the DB setup step.

```bash
cd ..
```

### 2.5 Enable CORS on the backend

So that later Angular (port 4200) can call NestJS (port 3000), the backend
needs to allow cross-origin requests. Open `backend/src/main.ts`, find:

```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}
```

Change it to:

```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: 'http://localhost:4200' });
  await app.listen(3000);
}
```

Without this, requests from Angular to NestJS will be blocked by the
browser even though the backend itself is running fine — an error that
often confuses beginners because it shows up in the browser console, not on
the server.

---

## Checklist before moving on

```bash
# from the root project
cd backend && npm run test           # default tests should pass
cd ../frontend && npm test -- --watch=false   # default Angular tests should pass
cd ..
git add -A
git commit -m "chore: initial scaffold frontend (Angular) + backend (NestJS)"
```

If all four pass (both dev servers run, both test suites are green),
you're ready for the next step: building one simple endpoint on the backend
plus one component on the frontend that calls it, **as a smoke test**
before moving on to Agent Teams for real features.

---

## What you need to know before Agent Teams (preview)

Because the frontend and backend in this project are **not** split into
separate git worktrees like your .NET pipeline (everything lives in one
working directory), if you use Agent Teams later, you'll **need** to
explicitly divide file ownership in the initial prompt — for example:

- Teammate A → only touches `backend/src/**`
- Teammate B → only touches `frontend/src/**`
- Nobody touches `package.json` on either side without reporting to you first

That detail is already worked out for you in two other files, meant to be
read in this order once Steps 1 & 2 above are done and both checklists
pass:

1. **`NZWALKS-TEAM-BRIEF-EN.md`** — the actual task: DB schema, API
   contract, and exactly what each teammate is responsible for.
2. **`ORCHESTRATOR.md`** — how to start a Claude Code session and tell it
   to run that brief as an agent team, including how to check the feature
   is enabled and how to pick a model/effort level before spawning anyone.
