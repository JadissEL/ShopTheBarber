# Security audit

Perform a focused security pass on the codebase or the files the user is concerned about.

1. **Scope**: If the user specified files or areas (e.g. auth, payments), focus there. Otherwise start with `server/src/auth/`, `server/src/payments/`, `server/src/webhooks/`, and any file that handles env vars or secrets.
2. **Secrets**: Check for hardcoded API keys, passwords, or tokens. Run the secrets scanner if available: `python .cursor/skills/security-auditor/scripts/scan-secrets.py` from repo root. Ensure `.env` and secret files are in `.gitignore`.
3. **Injection and XSS**: In the scoped code, verify parameterized queries (no raw SQL concatenation) and safe handling of user-controlled output (no unescaped HTML/JSX from user input).
4. **Auth and permissions**: Verify that protected routes check authentication and authorization; no privilege escalation paths.
5. **Report**: Summarize findings (no issues / list of issues with file and line or area). Suggest concrete fixes for any finding.

Reference `docs/PII_PROTECTION_SPECIFICATION.md` and `docs/RATE_LIMIT_SPECIFICATION.md` when relevant to this project.
