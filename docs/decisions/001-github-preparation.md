# Decision: GitHub Preparation

**Context:**
We performed a final cleanup of the repository before pushing to GitHub.

**Decisions:**
1. **Python files**: `app.py`, `backend.py`, and `requirements.txt` were deleted because extensive grep searches confirmed they were completely unused and abandoned backend experiments.
2. **Knip Dead-Code Warnings**: We intentionally ignored `knip` warnings regarding exported types (like `Theme`, `CalendarEventType`) and internal engine helpers (like `resolveVersionBoundaries`). These are valid types/helpers that may be utilized as the application grows, and blindly deleting them reduces maintainability.
3. **Documentation Retention**: `System_flow_diagram` and `docs/` were retained. They are legitimate architectural planning artifacts, not temporary generated output.
4. **.gitignore Updates**: We ignored specific environment extensions (`.env`, `*.local`) and temporary backup JSON outputs (`studentos-backup-*.json`), but explicitly avoided a broad `*.json` ignore rule to ensure legitimate config files aren't omitted.
5. **Permissions**: No special permissions were requested as we didn't require any system-level execution beyond standard npm build/lint.
