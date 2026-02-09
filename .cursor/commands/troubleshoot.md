# Start a troubleshooting session

Run the **full troubleshooting protocol** for a user-reported bug or "it's still broken" follow-up. Use the **troubleshooting** skill for methodology.

## Workflow

1. **Create or reset session state**
   - Ensure `.cursor/TROUBLESHOOTING_SESSION.md` exists.
   - If starting fresh: populate it from `.cursor/skills/troubleshooting/references/session-template.md` (status: In progress).
   - If continuing ("still broken"): read `.cursor/TROUBLESHOOTING_SESSION.md` first and do not repeat what was already tried or ruled out.

2. **Reproduce**
   - Get exact steps and exact error (message, stack, screenshot, or log).
   - Confirm in one sentence: "I'm working from: steps X, error Y." If reproduction is unclear, ask the user for one concrete example.

3. **Scope**
   - List the minimal layers and files involved (e.g. UI → API → server → DB). Trace from symptom backward; no random file hopping.

4. **Hypothesize**
   - List 2–5 possible causes. As you check, mark each: ruled out / testing / confirmed. Update the session file.

5. **Verify, don't assume**
   - For each hypothesis, decide what would prove/disprove it; perform that check.

6. **Fix at the root**
   - Fix where the bug originates; check other call sites. Update the session file with changed files.

7. **Verify fix**
   - Re-run the same scenario the user described, or state exactly how the user should verify and ask them to confirm. Do not claim "fixed" without this step.

8. **Close the loop**
   - One-line summary in session: Root cause, files fixed, how verified. Set status to Resolved (or Unresolved if awaiting user verification).

## Optional

- For deep, multi-file trace or after "issue persists": invoke the **Troubleshooter** subagent with context (observed, ruled out, checked). Use its report to apply fix and run verification.
- If the user provided the issue in this message, start from step 2 (Reproduce) using that information.
