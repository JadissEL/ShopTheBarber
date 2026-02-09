# Git Branching and Deployment Workflow

This project uses a **two-branch** model: all development and CI run on `master`; only tested, approved changes are promoted to `main`, which is deployed to production.

---

## Branch roles

| Branch   | Purpose |
|----------|--------|
| **master** | CI/CD testing and validation. All development and merges happen here first. |
| **main**   | Stable, production-ready code only. Deployed to production. No direct development. |

---

## Workflow rules

1. **All development and changes are merged into `master` first.**  
   Work in feature branches and open PRs into `master`, or push directly to `master` if that’s your process.

2. **CI/CD pipelines run on `master`.**  
   Every push and pull request targeting `master` runs the full CI (lint, test, build). Do not consider code “ready for production” until CI on `master` is green.

3. **Promote only when CI on `master` succeeds.**  
   Only after all tests and checks pass on `master`, promote those changes from `master` to `main`.

4. **`main` is deployed to production.**  
   Vercel (frontend) and Render (backend) should be configured to build and deploy from the `main` branch only.

5. **No direct development or testing on `main`.**  
   No feature branches from `main`, no direct commits to `main`. All changes enter via `master` and are then promoted.

6. **`main` always reflects the latest tested and approved state of `master`.**  
   After each promotion, `main` should be a fast-forward or merge of the `master` commit(s) that passed CI.

---

## Promotion: master → main

### Option A: GitHub Actions (recommended)

1. In GitHub, open **Actions** → **Promote to main**.
2. Click **Run workflow**, choose branch **master**, then **Run workflow**.
3. The workflow will merge `master` into `main` and push. Run it only when CI on `master` has already passed.

### Option B: Local Git

Run only after CI has passed on `master`:

```bash
git fetch origin
git checkout main
git pull origin main
git merge origin/master --no-edit
git push origin main
git checkout master
```

### Option C: GitHub UI

1. Open the repo on GitHub.
2. Create a **Pull Request**: base `main` ← compare `master`.
3. Merge the PR (merge commit or squash, as you prefer).  
   Prefer doing this only when CI on `master` is green.

---

## GitHub setup (recommended)

1. **Default branch**  
   Set the **default** branch to `main` (Settings → General → Default branch).  
   This keeps “production” as the default view and PR target; use `master` as the target for day-to-day PRs.

2. **Branch protection for `main`**  
   - Settings → Branches → Add rule (or edit rule for `main`).
   - **Branch name pattern:** `main`
   - Enable:
     - **Require a pull request before merging** (optional but recommended; e.g. require PR from `master`).
     - **Require status checks to pass before merging** → select the CI workflow (e.g. “CI” or “Frontend”/“Server”).
     - **Do not allow bypassing the above settings** (for admins too, if you want strict control).
   - Leave `master` unprotected so CI and normal development can run there.

3. **Deploy from `main` only**  
   In Vercel and Render, set the production branch to `main`. Do not deploy production from `master`.

---

## Summary

- **Develop and merge** → `master`.
- **CI runs** on `master` (and on `main` after promotion).
- **Promote** only when CI on `master` is green (Actions workflow, local merge, or PR).
- **Deploy** from `main` only.
- **Never** push untested code to `main`; treat `main` as protected and stable.
