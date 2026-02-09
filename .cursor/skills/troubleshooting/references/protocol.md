# Troubleshooting protocol (mandatory sequence)

Follow this sequence for every user-reported bug or "it's still broken" follow-up. Do not skip steps.

## 1. Reproduce

- Get **exact** steps to reproduce (what the user did: click, URL, input).
- Get **exact** error: full message, stack trace, screenshot, or log snippet.
- Confirm in one sentence: "I'm working from: steps X, error Y." If you cannot reproduce, say so and ask for one more concrete example (e.g. "Click Book now on barber John, then Confirm — what exactly do you see?").

## 2. Scope

- List the **minimal set of layers and files** involved (e.g. UI component → page → API call → server route → logic → DB).
- Do not jump to random files. Trace from symptom (where the error appears) backward to possible causes (data source, caller, config).

## 3. Hypothesize

- Write **2–5 possible causes** (e.g. "null from API," "wrong route," "missing guard").
- As you check, mark each: **ruled out** / **testing** / **confirmed**.
- Document in the session state (`.cursor/TROUBLESHOOTING_SESSION.md`) so the next turn or subagent knows what was already tried.

## 4. Verify, don't assume

- For each hypothesis, decide **what would prove or disprove it** (e.g. add a log, run a test, inspect a value).
- Perform that check. Do not assume "it's probably X" without evidence.

## 5. Fix at the root

- Fix where the bug **originates** (e.g. wrong data from API, wrong prop from parent), not only the place that crashes.
- Check **other call sites** of the same function/config so the same bug doesn't reappear elsewhere.

## 6. Verify fix

- **Re-run the same scenario** the user described (same steps, same URL, same flow).
- If you cannot run it (e.g. no browser): **State exactly how the user should verify** (e.g. "Click X, then Y, then Z; the error should be gone. Please confirm.").
- Do **not** say "this should fix it" without a defined verification step.

## 7. Close the loop

- One-line summary: **Root cause: X. Fixed in: files A, B. Verified by: Z.**
- Update `.cursor/TROUBLESHOOTING_SESSION.md` with this summary and set status to **Resolved** (or **Unresolved** if the user must verify).

---

## "Done" checklist (before claiming fix)

- [ ] Root cause identified (not just a symptom).
- [ ] Fix applied at the right layer; related call sites considered.
- [ ] Verification step defined and either executed or clearly delegated to the user.
- [ ] Session state updated (hypotheses, changed files, verification).
- [ ] No unrelated changes introduced.
