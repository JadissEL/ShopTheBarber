# MCP permanent setup (Cursor)

Global invitation and installer live on your machine:

- **Invitation:** `%USERPROFILE%\.cursor\MCP_LOGIN_INVITATION.md`
- **Installer:** `%USERPROFILE%\.cursor\scripts\install-all-mcp-permanent.ps1`
- **Full guide:** `%USERPROFILE%\.cursor\cursor-mcp-skills-setup.md`

```powershell
powershell -ExecutionPolicy Bypass -File "$env:USERPROFILE\.cursor\scripts\install-all-mcp-permanent.ps1"
```

Then **fully quit and restart Cursor** after OAuth / env changes.
