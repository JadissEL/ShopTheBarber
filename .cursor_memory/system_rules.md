# System rules (this workspace)

Authoritative constraints for agents working on this project. Edit as the project evolves.

---

## Git policy for `.cursor_memory/` (choose one — delete the other line)

**Decision:** `[ ] Commit .cursor_memory/` · `[ ] Ignore .cursor_memory/` (local-only)

- **Commit** when the team wants **shared** agent history, decisions, and task context in the repo (watch for merge conflicts on busy files like `active_tasks.md` and `conversation_log.md`).
- **Ignore** when memory is **solo / machine-local** or contains notes you do not want in the remote. Add to the repo’s `.gitignore`:

  ```gitignore
  .cursor_memory/
  ```

**My choice (replace with one sentence):** _(e.g. “Commit all of `.cursor_memory/` except we redact client names in logs.”)_

---

## Safety

- Do not store secrets here. Reference environment variables or your secret manager by name only.

## Canonical workspace root (multi-root setups)

If this repo is opened alongside other folders in one Cursor window, **one** root holds `.cursor_memory/`:

**Canonical root path:** _(absolute or repo-relative path, e.g. `C:\dev\my-app` or `.`)_

All agents use this path for `.cursor_memory/` for this project.
