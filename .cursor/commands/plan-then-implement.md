# Plan then implement

Use the Senior Architect approach: produce a short plan before writing code, then implement.

1. **Plan**: Write a bulleted plan (scope, files to create/modify, key decisions). Keep it under 10 bullets unless the task is large.
2. **Confirm**: If the change is non-trivial, briefly state the plan and ask the user to confirm or adjust before implementing.
3. **Implement**: Execute the plan. Create or modify files per PROJECT_SCHEMA.md. Keep files under 1600 lines; split if needed.
4. **Verify**: Run lint/typecheck (and tests if relevant). Fix any failures.

Use this when the user asks for "plan first," "design then code," or when the change touches multiple areas (e.g. new feature with frontend + API + DB).
