# ORCHESTRATOR.md — NZ Walks Agent Team Runner

This file is instructions for the **lead Claude Code session** on how to run
the Agent Team workflow defined in `NZWALKS-TEAM-BRIEF-EN.md`. It does not
contain the task details themselves — it only controls sequencing and
checkpoints.

---

## Before you start — recommend a model and effort level for this run

Agent Teams multiplies token usage — roughly 3–7x a single session, since
every teammate is a full separate Claude instance running in parallel. Two
separate levers affect cost here, and both are worth tuning before spawning
anything:

- **Model** — which weights answer the request (e.g. Sonnet vs Opus).
- **Effort** — how thoroughly that model works before checking back in
  (how much it reads, tests, and double-checks). Levels run roughly
  Low → Medium → High (default) → Xhigh → Max. Medium is a deliberate
  cost-saving step down from the default, not a "worse" setting — it's
  meant for exactly this kind of high-volume, well-scoped work.

Before spawning anything:

1. Run `/model` to confirm what's currently active and what else is
   available — the lineup changes, so don't assume from memory.
2. Match model + effort to what each role actually needs:
   - **Teammates A and B (Wave 1)** are pattern-following CRUD: TypeORM
     entities mapped to an existing schema, standard NestJS
     controller/service/module boilerplate, Angular forms/lists against a
     contract that's already fully specified in the brief. This is
     high-volume, well-scoped work — the kind **Medium effort on the
     current default Sonnet model** is suited for. There are two of them
     running in parallel, so this is also where the token multiplier hits
     hardest — the highest-leverage place to save cost.
   - **The lead session (this one)** should stay at the model's **default
     effort (High)** — it's making judgment calls throughout: catching
     scope violations, deciding whether a teammate's plan touches a
     forbidden file, evaluating Teammate D's findings.
   - **Teammate D (reviewer, Wave 2)** should also run at **default (High)
     effort**, and on the strongest available model if the user is willing
     to pay for it. It only runs once, sequentially — not multiplied by
     parallel teammates — and it's specifically catching subtle risks
     (SQL injection in the `search` param, `synchronize` silently flipped
     to `true`). This is exactly the kind of check worth spending more on.
3. State the proposed split plainly and ask for confirmation, e.g.:
   *"For Wave 1, I'd run Teammates A and B on [current default model] at
   Medium effort to keep the parallel work cheap — it's boilerplate CRUD
   against a contract that's already fully specified. I'd keep this lead
   session and Teammate D's review at default (High) effort, since that's
   where judgment calls happen. Want me to set it up this way, or would
   you rather keep everything at the default?"*
4. Only proceed once the user confirms. If they'd rather keep everything at
   one setting for simplicity, respect that — note the trade-off once, not
   repeatedly.

---

## Before you start — confirm Agent Teams is actually enabled

Agent Teams is experimental and disabled by default. Before reading the
brief or spawning anything, confirm the feature is active for this session:

1. Check that `.claude/settings.json` in the project root contains:
   ```json
   {
     "env": {
       "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
     }
   }
   ```
2. Run `/status` inside the Claude Code session and confirm Agent Teams
   shows as enabled.
3. If it is **not** enabled, do not fall back to regular subagents
   silently — a subagent run looks similar on the surface but does not
   give teammates peer-to-peer messaging or a shared task list, which this
   workflow (especially the Wave 1 parallel split) depends on. Instead:
   - Tell the user the flag is missing and explain what it does.
   - Ask explicit permission to add it yourself, e.g.: *"Agent Teams isn't
     enabled for this project. Want me to add
     `"env": {"CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"}` to
     `.claude/settings.json`?"*
   - Only write the file after the user confirms. If `.claude/settings.json`
     already exists with other keys, merge the `env` block in — don't
     overwrite the rest of the file.
   - After writing it, tell the user Claude Code needs to be restarted for
     the flag to take effect, and STOP. Do not attempt to spawn a team in
     the same session that just had the flag added — a restart is required
     before the tools become available.

---

## Your role as lead

1. Read `NZWALKS-TEAM-BRIEF-EN.md` in full before doing anything else.
2. Confirm Section 0 of that brief (DB connection) is already working —
   check the `npm run start:dev` console log for `TypeOrmCoreModule
   dependencies initialized` and no connection error. Don't check this via
   `/regions` — that endpoint doesn't exist until Teammate A builds it in
   Wave 1, so it will correctly 404 even when the DB connection is fine.
   If the backend doesn't start cleanly or shows a connection error, STOP
   and tell the user. Do not proceed to spawning any team.
3. Confirm the `SubRegionId` column exists on the `Walk` table in SQL Server
   (the user has confirmed this ALTER TABLE was already executed). If a
   teammate reports a mapping error on this column, do not attempt to fix
   it yourself — report it to the user, since it implies the DB schema does
   not match what this brief assumes.
4. Run the workflow in exactly two waves, as defined below. Never start a
   wave without an explicit go-ahead from the user, even if the previous
   wave finished successfully.

## Wave 1 — Backend API + Frontend UI (parallel)

- Spawn two teammates per the "Wave 1" section of the team brief: Teammate A
  (backend) and Teammate B (frontend).
- Enforce the file-ownership boundaries exactly as written in the brief.
  If a teammate's plan would touch a file outside its declared scope, block
  it and flag this to the user instead of allowing it.
- Wait for both teammates to report done.
- Run the Definition of Done checks yourself (build, `start:dev`, `ng serve`)
  and report the results.
- **STOP HERE.** Do not start Wave 2. Summarize what was built, list any
  files touched by each teammate, and explicitly ask the user to review
  before continuing.

## Wave 2 — Tests + Review (sequential-ish)

- Only start this wave when the user explicitly says to proceed.
- Spawn Teammate C (unit tests) first. Wait for it to finish.
- Then spawn Teammate D (code reviewer), only after Teammate C is done.
  Teammate D is read-only — it must not edit any files, only report findings.
- Present Teammate D's findings grouped as BLOCKING / SUGGESTIONS.
- **STOP HERE.** Do not auto-fix any findings. Ask the user which ones to
  act on.

## Things you must never do automatically

- Never change `synchronize` in the TypeORM config.
- Never modify `.env` or commit it.
- Never merge/apply a teammate's changes if it touched files outside its
  declared scope — surface the conflict to the user instead.
- Never allow Teammate A to add PATCH/DELETE endpoints for `regions`,
  `subregions`, or `difficulties` — per the brief, those three modules are
  add-and-view only. Only `walks` gets full CRUD. If a teammate's plan
  includes edit/delete for the reference-data modules, block it and flag
  this to the user.
- Never allow Teammate B to add edit/delete buttons on the Regions,
  SubRegions, or Difficulties pages — same reasoning as above, applied to
  the UI.
- Never skip the checkpoint pauses between waves, even if everything looks
  successful.

## If something fails

- If a teammate's log shows a failure, do not retry automatically more than
  once. Report the failure and the relevant log output, and wait for
  instructions.
