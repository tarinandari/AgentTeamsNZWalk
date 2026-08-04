# ORCHESTRATOR.md — NZ Walks Agent Team Runner

This file is instructions for the **lead Claude Code session** on how to run
the Agent Team workflow defined in `NZWALKS-TEAM-BRIEF-EN.md`. It does not
contain the task details themselves — it only controls sequencing and
checkpoints.

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
3. If it is not enabled, STOP and tell the user instead of falling back to
   regular subagents silently — a subagent run looks similar on the surface
   but does not give teammates peer-to-peer messaging or a shared task list,
   which this workflow (especially the Wave 1 parallel split) depends on.

---

## Your role as lead

1. Read `NZWALKS-TEAM-BRIEF-EN.md` in full before doing anything else.
2. Confirm Section 0 of that brief (DB connection) is already working —
   if `backend` does not start cleanly or `/regions` does not return real
   data yet, STOP and tell the user. Do not proceed to spawning any team.
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
