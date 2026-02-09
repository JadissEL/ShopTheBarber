#!/usr/bin/env python3
"""Scan for common hardcoded secrets (API keys, passwords, tokens) in tracked files.
Run from repo root: python .cursor/skills/security-auditor/scripts/scan-secrets.py
Or: python scan-secrets.py (when cwd is repo root).
"""
from __future__ import annotations

import os
import re
import sys

# Patterns for common secrets (high recall; may have false positives)
PATTERNS = [
    (r'(?i)(api[_-]?key|apikey)\s*[:=]\s*["\']?[a-zA-Z0-9_\-]{20,}', "API key"),
    (r'(?i)(secret|password|passwd|pwd)\s*[:=]\s*["\']?[^\s"\']{8,}', "Password/secret"),
    (r'(?i)bearer\s+[a-zA-Z0-9_\-\.]{20,}', "Bearer token"),
    (r'sk_live_[a-zA-Z0-9]{24,}', "Stripe live key"),
    (r'sk_test_[a-zA-Z0-9]{24,}', "Stripe test key"),
]

def scan_file(path: str) -> list[tuple[int, str, str]]:
    hits = []
    try:
        with open(path, "r", errors="ignore") as f:
            for i, line in enumerate(f, 1):
                for pat, name in PATTERNS:
                    if re.search(pat, line):
                        hits.append((i, name, line.strip()[:80]))
    except OSError:
        pass
    return hits

def main() -> int:
    root = os.environ.get("GIT_PREFIX", "")
    if not root and os.path.isdir(".git"):
        root = "."
    if not root:
        root = os.getcwd()
    found = False
    for dirpath, _, filenames in os.walk(root):
        if ".git" in dirpath or "node_modules" in dirpath:
            continue
        for name in filenames:
            if name.endswith((".pyc", ".min.js", ".lock", ".sqlite")):
                continue
            path = os.path.join(dirpath, name)
            if not os.path.isfile(path):
                continue
            hits = scan_file(path)
            for line_no, secret_type, snippet in hits:
                found = True
                print(f"{path}:{line_no} [{secret_type}] {snippet}...")
    return 1 if found else 0

if __name__ == "__main__":
    sys.exit(main())
