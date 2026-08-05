# ORCHESTRATOR.md — NZ Walks Agent Team Runner

This file is instructions for the **lead Claude Code session** on how to run
the Agent Team workflow defined in `NZWALKS-TEAM-BRIEF-EN.md`. It does not
contain the task details themselves — it only controls sequencing and
checkpoints.

---

## How to actually run this

This file and `NZWALKS-TEAM-BRIEF-EN.md` are **prompts you give Claude
Code**, not scripts it executes automatically. Neither file does anything
by itself — Claude only follows them once you point it at them inside a
Claude Code session.

1. Make sure Section 0 of `NZWALKS-TEAM-BRIEF-EN.md` (DB connection) is
   already working — see the checklist near the end of that file. Do this
   yourself, in a single normal Claude Code session, **before** anything
   below.
2. Open a terminal in the project root (`/d/CDC/ProjectAgentTeams2` or
   wherever this repo lives) and start Claude Code:
   ```bash
   claude
   ```
3. In that session, tell it to follow this file:
   ```
   Read ORCHESTRATOR.md and follow it to run the NZ Walks agent team workflow.
   ```
4. From here, this session **is** the lead. Everything below (model
   recommendation, enable check, Wave 1, checkpoints, Wave 2) happens by
   Claude reading and acting on this file's instructions in that same
   session — you don't run separate commands for each step yourself.
5. At each checkpoint (end of Wave 1, end of Wave 2), the lead will stop
   and wait for your explicit go-ahead before continuing, as instructed
   below.

If you'd rather not reference the file by name, describing the goal in
your own words works too, since Claude Code can read project files on its
own — but pointing at `ORCHESTRATOR.md` directly is the most reliable way
to make sure the sequencing and guardrails in this file are actually
followed, rather than Claude ad-libbing its own plan.

**Why teammates message each other directly, not just the lead.** Earlier
runs of this workflow had every teammate report only to the lead — which
works, but doesn't use anything an agent team can do that a plain subagent
can't. The peer-to-peer messaging instructions in Wave 1 and Wave 2 below
exist specifically so Teammates A/B (and C/D) can resolve contract
mismatches, ambiguities, and testing gaps with each other in real time
instead of stalling on a lead round-trip or shipping against a guess. The
lead still owns scope enforcement and every checkpoint — direct messaging
only covers content decisions teammates are allowed to settle between
themselves.

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
- **Explicitly instruct both teammates, in their spawn prompt, to message
  each other directly** (not only report to the lead) whenever one of the
  following happens — this is the actual point of running them as an agent
  team instead of two independent subagents, so don't let it default to
  silence:
  - **Teammate A finds the real DB schema disagrees with what the brief
    documents** (a column's type, nullability, or name doesn't match
    Section 1 of the brief). A must message B immediately with the actual
    shape, so B builds the form/model against reality instead of the
    now-outdated contract — don't make B discover this later from a broken
    request.
  - **Teammate B needs a contract detail the brief left ambiguous**
    (exact error-response shape, whether a field is required on create vs.
    optional on patch, what an empty list looks like). B messages A
    directly and waits for A's answer before guessing, instead of building
    against an assumption that may not match what A implemented.
  - **Either teammate hits a decision that affects the other's work** and
    isn't already settled by the brief (e.g. "should DELETE /walks/:id
    return the deleted record or just 204?"). They message each other,
    agree on one answer, and *both* apply it consistently — then report the
    agreed decision to the lead as part of their normal status update.
  - Teammates reaching an agreement between themselves on an **open
    contract detail** is fine and expected. Teammates agreeing to **expand
    either one's file scope** is not something they can approve between
    themselves — that still requires flagging to the lead, same as any
    other scope change.
  - **Module-complete pings — communicate proactively, not only when
    something is wrong.** As soon as A finishes one entity's endpoints
    (Regions, then SubRegions, then Difficulties, then Walks), A messages
    B with a short "ready" notice plus one real sample response for that
    entity — B doesn't have to wait for the entire backend to finish
    before starting to wire up that entity's page, and builds against a
    real payload instead of the contract on paper. B may reply
    acknowledging it and start immediately; this should visibly happen
    four times over the course of Wave 1, once per entity, not just once
    at the end.
  - **Pre-report sanity check.** Before either teammate tells the lead
    it's done, it messages the other once to confirm the final list of
    endpoints/fields actually matches what the other one built against —
    catching a last-minute mismatch here, between the two of them, is
    faster than catching it later in the lead's Definition-of-Done check
    or in Teammate D's review.
- Wait for both teammates to report done.
- Run the Definition of Done checks yourself (build, `start:dev`, `ng serve`)
  and report the results.
- **STOP HERE.** Do not start Wave 2. Summarize what was built, list any
  files touched by each teammate, **and include a short log of what A and
  B messaged each other directly during Wave 1** (module-ready pings,
  contract clarifications, the pre-report sanity check) — this is the part
  that shows the user the teammates actually coordinated as a team, not
  two isolated builds glued together at the end. Then explicitly ask the
  user to review before continuing.

## Wave 1.5 — UI polish (offer this to the user)

- **Proactively offer this** at the Wave 1 checkpoint — don't wait for the
  user to ask. They may not know this pass exists. When you report Wave 1
  done, mention that Wave 1 built the UI for function, not appearance
  (plain unstyled HTML controls), and that a styling pass is available if
  they want the app to look presentable. Something like: *"Wave 1's UI is
  functional but visually unstyled — raw browser defaults. There's an
  optional Wave 1.5 in the brief that adds a proper theme, styled
  components, loading states, and error/success feedback. Want me to run
  it?"*
- Offer it, then wait — don't start it without a yes. If the user declines
  or wants it later, drop it and don't re-offer unprompted.
- This is Teammate B only, scoped to `frontend/src/app/**` styling plus the
  shared nav shell — see the brief for the full task list and the one hard
  boundary (visual only; no logic, API, or routing changes).
- It has no file overlap with Teammate C or D's Wave 2 work, so it's safe
  to run at the same time as Wave 2 if the user wants both — ask whether
  they want it before, after, or parallel with Wave 2.
- Same rule as Wave 1: if Teammate B's plan touches anything outside its
  declared scope (including logic changes disguised as styling), block it
  and flag to the user rather than allowing it.
- Report back with a summary and wait for the user's review before
  considering this done — don't assume "looks better" is self-evidently
  sufficient without the user actually seeing it.

## Wave 2 — Tests + Review (C stays active through D's review)

- Only start this wave when the user explicitly says to proceed.
- Spawn Teammate C (unit tests) first. Wait for it to finish writing and
  running the initial test suite.
- **Do not shut Teammate C down yet.** Keep it active/idle after it
  reports its initial work done — this is a deliberate change from
  running C and D fully sequentially, specifically so the two of them can
  actually talk to each other during review instead of D shouting into an
  empty room. (Earlier drafts of this file said to spawn D "only after C
  is done," which in practice meant C had usually already shut down by
  the time D found anything — that made the D→C messaging instruction
  below almost never trigger. This fixes that.)
- Spawn Teammate D (code reviewer) once C's initial pass is done, while C
  is still around. Teammate D is read-only for code — it must not edit
  any files, only report findings and message C.
- **Instruct both teammates, in their spawn prompts, to talk to each
  other, not just report to the lead:**
  - If D finds a testing gap while reviewing (a branch with no coverage,
    a filter combination nobody tests, a mocked call that doesn't match
    the real repository signature), D messages C directly with what's
    missing.
  - C adds the missing test, runs it, and **replies to D directly**
    confirming it's done and passing — don't let this dangle as a
    one-way ping. D waits for that reply (or a reasonable timeout) before
    marking the finding resolved, and re-checks the specific test C
    added rather than taking C's word for it.
  - This can happen more than once per wave — treat it as a normal
    back-and-forth, not a single fire-and-forget message.
- Once D's full review is complete and every C↔D exchange has been
  resolved one way or another, the lead shuts down **both** C and D
  together — don't release C early just because its original test-writing
  task looked finished.
- Present Teammate D's findings grouped as BLOCKING / SUGGESTIONS,
  **including a short log of what C and D exchanged directly** — same
  reason as the Wave 1 log: it shows the user real coordination happened,
  not just a report.
- **STOP HERE.** Do not auto-fix any findings. Ask the user which ones to
  act on.

## Things you must never do automatically

- Never change `synchronize` in the TypeORM config.
- Never modify `.env` or commit it.
- Never merge/apply a teammate's changes if it touched files outside its
  declared scope — surface the conflict to the user instead.
- Never allow Teammate A to add DELETE endpoints for `regions`,
  `subregions`, or `difficulties` — per the brief, those three modules
  support list, detail, create, and update, but not delete, since `Walk`
  rows reference them by foreign key. Only `walks` gets delete. If a
  teammate's plan includes delete for the reference-data modules, block it
  and flag this to the user. (PATCH/edit on these three **is** allowed —
  don't block that.)
- Never allow Teammate B to add delete buttons on the Regions,
  SubRegions, or Difficulties pages — same reasoning as above, applied to
  the UI. Edit buttons on those pages are expected and allowed.
- Never allow any teammate to run a broad or system-wide process-kill
  command — `taskkill /IM ... /T`, `taskkill /F` without a specific PID,
  `pkill` by process name, `killall`, or similar. These can kill processes
  belonging to another teammate, the lead session, or something unrelated
  running on the user's machine entirely. If a teammate needs to restart
  its own dev server, it must stop only the specific process it itself
  started (by PID, or by re-running in the same terminal it owns) — never
  a name- or pattern-based kill that isn't scoped to a single PID it
  launched. If a teammate reports having run a broad kill command, treat
  it as an incident: ask it to report exactly what command ran and what
  it's aware the command may have affected, and flag this to the user
  immediately rather than waiting for a routine status update.
- Never skip the checkpoint pauses between waves, even if everything looks
  successful.

## If something fails

- If a teammate's log shows a failure, do not retry automatically more than
  once. Report the failure and the relevant log output, and wait for
  instructions.
