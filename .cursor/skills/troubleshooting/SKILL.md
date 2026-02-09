---
name: troubleshooting
description: Follow the structured troubleshooting protocol when the user reports a bug, error, "not working," "issue persists," "please double-check," or "retry." Reproduce first, scope layers and files, hypothesize and verify, fix at root, verify fix, close the loop. Maintain session state in .cursor/TROUBLESHOOTING_SESSION.md. Do not claim fix without a verification step. Use when debugging, fixing errors, or when the user says the issue is still there.
---

# Troubleshooting skill

When the user reports a **bug**, **error**, **"not working"**, **"issue persists"**, **"please double-check"**, or **"retry"**, you MUST follow the troubleshooting protocol and maintain session state. This reduces repeated failed fixes and "the issue is still there" loops.

## When to use this skill

- User describes a bug, error, or broken behavior
- User says "it's still broken," "issue persists," "please double-check," "retry"
- User asks to "troubleshoot," "find the bug," "fix this error"
- After a previous fix attempt, user indicates the problem remains

## Protocol (mandatory sequence)

Read **references/protocol.md** for the full sequence. Summary:

1. **Reproduce** – Get exact steps and error. Confirm: "I'm working from: steps X, error Y."
2. **Scope** – List minimal layers and files (UI → API → server → DB). No random file hopping.
3. **Hypothesize** – List 2–5 possible causes; mark ruled out / testing / confirmed.
4. **Verify, don't assume** – For each hypothesis, prove or disprove with a concrete check (log, test, inspect).
5. **Fix at the root** – Fix where the bug originates; check other call sites.
6. **Verify fix** – Re-run the same scenario or give the user exact verification steps. Do not claim "fixed" without this.
7. **Close the loop** – One-line summary: Root cause, files fixed, how verified.

## Session state (mandatory)

- **File**: `.cursor/TROUBLESHOOTING_SESSION.md` at the project root (inside `.cursor/`).
- **When starting**: Create or reset the file using the structure in **references/session-template.md**.
- **During troubleshooting**: Update the file after each meaningful step (hypotheses, checked files, changed files, verification).
- **When user says "still broken" or "retry"**: **FIRST** read `.cursor/TROUBLESHOOTING_SESSION.md` to see what was already tried and what was ruled out. Do not repeat the same fix or the same hypothesis. Use the session to decide the next hypothesis or a deeper trace (consider invoking the Troubleshooter subagent if many files are involved).

## Verification mandate

- **Never** say "this should fix it" or "the issue should be resolved" without:
  - **Either** re-running the exact scenario the user described and confirming the error is gone,
  - **Or** stating clearly: "I cannot run this myself. Please run [exact steps] and tell me if the error is gone."
- Before claiming done, complete the "Done" checklist in references/protocol.md (root cause, fix at right layer, verification defined, session updated, no unrelated changes).

## When to invoke the Troubleshooter subagent

- The bug spans **many files** or layers and the root cause is unclear.
- The user has said **"issue persists"** or **"please do a full trace"** after one or more fix attempts.
- You need a **focused, context-isolated** pass (trace data flow, list all involved files, propose minimal root-cause fix and verification steps).

Hand off to the subagent: observed (symptoms, error, steps), what's already ruled out, what's already been checked/changed. The subagent returns a structured report (root cause, files to change, fix, verification steps). You then apply the fix and run (or delegate) the verification step.

## Summary

- **Protocol**: Reproduce → Scope → Hypothesize → Verify → Fix at root → Verify fix → Close loop.
- **State**: `.cursor/TROUBLESHOOTING_SESSION.md` — create/update always; re-read when user says "still broken."
- **Verification**: No "fixed" without a verification step (you run it or user runs it with exact steps).
- **Subagent**: Use Troubleshooter for deep, multi-file trace when needed.
