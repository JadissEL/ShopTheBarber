# Run lint and typecheck

Run the project's quality checks and report results.

1. **Lint**: Run `npm run lint` (or `npm run lint:fix` if the user wants auto-fix). Fix any reported errors before considering the task done.
2. **Typecheck**: Run `npm run typecheck` if the project has it (e.g. `tsc -p jsconfig.json`). Fix type errors or document why a fix is deferred.
3. **Tests** (optional): If the user asked to include tests, run `npm test` or `npm run test` and fix failing tests.

Report pass/fail for each command. If a command is not defined in `package.json`, say so and skip it.
