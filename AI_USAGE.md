# AI Usage Documentation

> Mandatory disclosure of AI use in this repository.
> **Project:** ArrowMaze Backend · **Last updated:** 2026-06-13

## 1. Tools Used

| Tool | Version / Model | Role in the team's workflow |
| ---- | --------------- | --------------------------- |
| Claude Code | Sonnet 4.6 (`claude-sonnet-4-6`) & Opus 4.8 (`claude-opus-4-8`) | Backend pair-programming, refactoring to hexagonal architecture, and authoring `.claude` skills |

<!-- DRAFT: confirm — add any other tools the team used (GitHub Copilot, ChatGPT, DeepL, etc.) with version + role, or delete this comment if the table is complete. -->

## 2. Usage Log by Task

### T-001 — Convert nestjs-patterns skill to hexagonal architecture

- **Task / problem addressed:** Update the `nestjs-patterns` skill so its documented folder structure follows hexagonal architecture (domain, application, infrastructure).
- **AI tool used:** Claude Code (Sonnet 4.6)
- **Prompt / instruction:** "update please @.claude/skills/nestjs-patterns/SKILL.md to use the folder structure of hexagonal architecture: domain, application and infraestructure" (verbatim)
- **Result obtained:** Rewrote the skill's *Project Structure*, *Modules/Controllers/Providers*, *DTOs and Validation*, and *Persistence* sections to a ports-and-adapters layout: pure `domain/` (entities, value objects, repository interfaces), `application/` (use cases, DTOs, mappers, ports), and `infrastructure/` (HTTP adapters, persistence adapters, config, NestJS module wiring), including a symbol-token repository injection example.
- **Modifications made by the team:** Accepted as generated; no manual edits applied after generation.
- **Lessons learned / limitations identified:** `.claude/skills/nestjs-patterns` is a symlink into `.agents/skills/`, so edits propagate to the real file there — useful to confirm symlink targets before editing.

### T-002 — Create the `ai-usage-doc` skill

- **Task / problem addressed:** Build an in-depth skill that generates and maintains a standardized `AI_USAGE.md` (tools used, per-task usage log, critical evaluation).
- **AI tool used:** Claude Code (Opus 4.8)
- **Prompt / instruction:** "i want to create an in depth skill that helps me to generate a markdown with this specifications: Mandatory Documentation of AI Use … Tools Used … Usage log by task … Critical evaluation …" (paraphrased — full requirement text supplied via the `/write-a-skill` command)
- **Result obtained:** Created `.claude/skills/ai-usage-doc/SKILL.md` (Create + Append workflows, rules, checklist) and `.claude/skills/ai-usage-doc/TEMPLATE.md` (exact output format). Design choices (template + guided fill, instructions-only, append-with-recalc) were confirmed via clarifying questions before writing.
- **Modifications made by the team:** Design driven by the team's answers to clarifying questions; no generated content was rejected.
- **Lessons learned / limitations identified:** A skill's `description` field drives activation, so trigger keywords must be explicit; structured clarifying questions up front avoided rework.

### T-003 — Generate the initial `AI_USAGE.md`

- **Task / problem addressed:** Produce the repository's mandatory AI usage documentation file.
- **AI tool used:** Claude Code (Opus 4.8)
- **Prompt / instruction:** "yes, generate the initial AI_USAGE.md" (verbatim)
- **Result obtained:** This file, populated from verifiable session activity; team-judgment fields left as marked drafts for confirmation.
- **Modifications made by the team:** <!-- DRAFT: confirm — record any edits the team makes after generation. -->
- **Lessons learned / limitations identified:** AI can faithfully log its own verifiable actions (prompts, file changes) but cannot author team-level judgments (percentages, reflections) without input.

## 3. Critical Evaluation

### AI-assisted code share

- **Approximate % of code that was AI-assisted:** ~10%
- **Basis for the estimate:** Team estimate — AI used mainly for documentation, skill authoring, and the architecture refactor; the bulk of application code is hand-written.

### Incorrect or suboptimal AI results

<!-- DRAFT: confirm — document at least one real case. Example structure below; replace with an actual incident or remove if none yet. -->

- **Case:** [DRAFT: describe a concrete case where AI output was wrong or suboptimal]
  - **How it was detected:** [DRAFT: tests, code review, runtime error, etc.]
  - **How it was corrected:** [DRAFT: the fix the team applied]

### Team reflection

- **Impact on productivity:** <!-- DRAFT: confirm — team's honest assessment -->
- **Impact on code quality:** <!-- DRAFT: confirm — team's honest assessment -->
- **Overall takeaways:** <!-- DRAFT: confirm — what the team would keep / change about using AI -->
