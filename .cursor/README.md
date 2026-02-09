# Cursor project context

This folder configures **Rules**, **Skills**, and **Commands** for Cursor in this repo, following the framework for universal agentic intelligence (project-agnostic rules + specialized skills + reusable commands).

## Layout

| Path | Purpose |
|------|--------|
| **rules/** | Project and behavioral rules (`.mdc`). Applied always or by file glob. |
| **skills/** | Specialized skills (SKILL.md + optional scripts/references). Loaded when relevant or via `/skill-name`. |
| **commands/** | Slash commands (`.md`). Triggered with `/command-name` in chat. |
| **agents/** | Subagents (`.md` with name, description, prompt). Invoked by Agent for focused, context-isolated work. |
| **TROUBLESHOOTING_SESSION.md** | Live troubleshooting state (observed, hypotheses, checked, changed, verified). Created/updated when debugging; read when user says "still broken." |

## Rules (`rules/`)

- **antigravity-system** – **Always on.** Antigravity persona; preserve > extend > optimize. Read PROJECT_TRACKER.md before every task; rescan for Base44 traces; ensure 100% sovereign and production-ready. Non-destruction, tracker-first, change-control, proactive MCP/API proposals.
- **project-schema** – Follow PROJECT_SCHEMA.md for structure and naming (globs: JS/TS/JSX/TSX).
- **implementation-mandate** – Write code directly; no copy-paste; announce before tool calls; no filler phrases (always on).
- **formatting-standards** – 2-space, single quotes, naming, strict typing, complexity (globs: JS/TS/JSX/TSX).
- **security-mandate** – Identify sensitive paths; no secrets in git; mask env (globs: auth, payments, .env, server).
- **ux-journey-audit-suggestion** – When changing UX/nav/journey files, suggest running `/audit-journeys` or the Journey Auditor subagent (globs: App.jsx, Layout, pages.config, navigationConfig, navigationVisibility, RouteGuard, layout/, pages/).
- **troubleshooting-mandate** – When user reports a bug, "not working," "issue persists," or "retry": follow troubleshooting skill, maintain TROUBLESHOOTING_SESSION.md, never claim fix without verification step. Read session first when user says "still broken."

## Skills (`skills/`)

- **senior-architect** – System design, C4, ADRs, 1600-line max, plan before code.
- **security-auditor** – SecOps persona; SQLi/XSS/auth; secrets scan; use `scripts/scan-secrets.py` when needed.
- **journey-ux-auditor** – Audit UX organization and user/barber/shop/admin journeys; find discrepancies, redundancy, old techniques, broken flows; report and fix using modern universal techniques.
- **troubleshooting** – Structured protocol for bugs: reproduce → scope → hypothesize → verify → fix at root → verify fix → close loop. Maintain TROUBLESHOOTING_SESSION.md; no "fixed" without verification step. Use when user reports bug, error, "not working," "issue persists," or "retry."
- **devops-deployer** – Docker, CI/CD, scaffolding, production setup.
- **test-engineer** – TDD, run tests after changes, unit + integration/e2e.

Skills are discovered from `.cursor/skills/` (project) and can also live in `~/.cursor/skills/` (global). Invoke manually with `/senior-architect`, `/security-auditor`, etc., or let the agent apply them when relevant.

## Commands (`commands/`)

- **/add-page** – Scaffold a new page and wire routing/nav.
- **/add-api-route** – Add a server route and logic layer.
- **/run-checks** – Run lint and typecheck (and optionally tests).
- **/scaffold-component** – Create a component in the right folder.
- **/plan-then-implement** – Plan first, then implement (architect workflow).
- **/security-audit** – Focused security pass (secrets, injection, auth).
- **/audit-journeys** – Full Journey & UX audit (map journeys → check → report → fix). Use Journey Auditor subagent for heavy runs.
- **/troubleshoot** – Start a troubleshooting session (create/read TROUBLESHOOTING_SESSION.md, run full protocol: reproduce → scope → hypothesize → verify → fix → verify fix → close loop). Use Troubleshooter subagent for deep, multi-file trace when needed.
- **/production-loop** – Do **one** production-readiness item from `docs/PRODUCTION_READINESS.md`, then stop. Run again to do the next. Repeat until the app is production-ready.

Type `/` in Agent chat to see and run these.

## Subagents (`agents/`)

- **Journey Auditor** – Runs the full Journey & UX audit (journey-ux-auditor skill). Use when you want a comprehensive, context-isolated audit and fix run. Agent can invoke this subagent automatically or when you ask to "run the journey audit" or "run the UX auditor."
- **Troubleshooter** – Deep troubleshooting for complex or multi-file bugs. Receives observed + ruled out + checked; returns structured report (root cause, files to change, fix, verification steps). Main agent applies fix and runs verification. Invoke when "issue persists," "do a full trace," or when the bug spans many files.

## Global vs project

- **Project rules** (here) are version-controlled and apply in this repo.
- **User/global rules and skills** are in Cursor Settings and in `~/.cursor/skills/` (or `~/.codex/skills/` if using Codex). Enable “Include third-party skills, subagents, and other configs” to use both.
