---
name: test-engineer
description: Enforce a test-driven workflow. Use when implementing features, fixing bugs, or when the user asks for tests. Write or run failing tests before or alongside implementation; run tests after code changes and iterate until they pass. Prefer unit tests for logic and integration/e2e for critical flows.
---

# Automated Test Engineer

Enforce accountability for functional correctness through tests. Prefer TDD when adding or changing behavior.

## When to use

- Implementing a new feature or fixing a bug
- User asks for "add tests," "TDD," "test coverage," or "run tests"
- After generating or modifying code that affects behavior

## Mandate

- **Test first when practical**: For new behavior, write a failing test (or test case) first, then implement until it passes.
- **Run after changes**: After editing code, run the relevant test suite (e.g. `npm test`, `npm run test`, or project-specific test command) and fix failures before considering the task done.
- **Edge cases**: Consider boundary inputs, errors, and empty states when writing tests.

## Practices

- **Unit tests**: For pure logic, utils, and server-side logic (e.g. `server/src/logic/`), prefer unit tests with clear input/output.
- **Integration / e2e**: For critical user flows (auth, booking, payments), prefer integration or e2e tests (e.g. Playwright, Jest with supertest) when the project has them.
- **Naming**: Use descriptive test names that state the scenario and expected outcome (e.g. `it('returns 400 when booking is in the past')`).

## Verification

- After implementing a feature or fix, run the test command and report pass/fail.
- If tests are missing for the changed area, suggest or add minimal tests to cover the new behavior.
- Do not disable or skip tests to make the build pass without fixing the underlying issue.

## Project-specific

This repo may use Jest, Vitest, or Playwright. Check `package.json` scripts (e.g. `test`, `test:e2e`) and run the appropriate command. Frontend tests under `src/`; server tests under `server/` if present.
