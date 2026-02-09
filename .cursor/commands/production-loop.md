# Production loop — one step toward production

You are running the **production loop**: do exactly one production-readiness item, then stop and tell the user to run this command again to continue.

## Steps (do in order)

1. **Read** `docs/PRODUCTION_READINESS.md`. Find the **first** row in the checklist (sections 1–6, in order) whose **Status** is **Todo**.
2. **If no Todo item remains** in sections 1–6: Tell the user that the production checklist is complete for this pass and suggest a final manual test (e.g. full booking flow, deploy dry-run). Do not make code changes.
3. **If you found a Todo item**:
   - Set its Status to **In progress** in `docs/PRODUCTION_READINESS.md`.
   - **Implement** the item (code, config, or doc change as described in the row and Notes). If the item is blocked (e.g. "when tests exist"), mark it **Skipped** with a one-line reason and pick the next Todo.
   - After implementing, **run checks** where relevant:
     - Frontend: `npm run lint` (from project root).
     - Server: `cd server && npm run lint` if the project has it.
     - Build: `npm run build` from root if you changed frontend code.
   - If checks fail, fix the failures before marking Done.
   - Set the item’s Status to **Done** (or **Skipped** with reason) and add a short **Notes** line summarizing what was done.
4. **Reply** to the user with:
   - What item you did (and any Notes).
   - One of:
     - **"Run /production-loop again to do the next item."** or
     - **"No more Todo items. Production checklist pass is complete."**

## Rules

- Do **only one** Todo item per run. Do not do multiple items in one go.
- Do not change the Status of items that are already Done or Skipped.
- If an item is vague, use the "Notes" column in PRODUCTION_READINESS.md and FIRST_GLANCE_PRIORITIES.md (or PROJECT_TRACKER) for context.
- Prefer minimal, correct changes. If you need to add a file (e.g. `.env.example`), create it; if you need to edit a doc, update only the relevant part.

## Quick reference — section order

1. Auth & redirects  
2. Booking & data  
3. UX & navigation  
4. API & backend  
5. Code quality & docs  
6. Security & production hardening  

Process sections in that order; within each section, process rows top to bottom. Skip Done/Skipped.
