# Walkthrough

## 2026-03-09
- Findings: Settings page for OpenRouter credentials is implemented and wired into sidebar/app navigation.
- Conclusions: Credential storage and retrieval are available through Electron IPC (`settings:getOpenRouter`, `settings:saveOpenRouter`) and consumed by renderer settings form.
- Actions: Verified the relevant files and wiring (`src/screens/Settings.tsx`, `src/App.tsx`, `src/components/Sidebar.tsx`, `electron/preload.ts`, `electron/main.ts`).

## 2026-03-09 (Cache Error Fix)
- Findings: Electron/Chromium reported Windows cache access-denied errors (`cache_util_win.cc`, `gpu_disk_cache.cc`) during startup.
- Conclusions: Session/cache path can be unwritable or locked on some Windows setups; moving session data to temp and disabling GPU shader disk cache avoids this failure mode.
- Actions: Updated `electron/main.ts` to set `sessionData` path to `%TEMP%\\NightCompanion\\session-data` and append `disable-gpu-shader-disk-cache` switch before app startup.

## 2026-03-09 (DB Password Fix)
- Findings: Local PostgreSQL login failed because `.env` used placeholder password text.
- Conclusions: Connection string must use `postgres` password for the local setup.
- Actions: Updated `DATABASE_URL` in `.env` and `.env.example` to `postgresql://postgres:postgres@localhost:5432/nightcompanion`.

## 2026-03-09 (Desktop Scripts)
- Findings: User ran `npm run electron:dev` but this script was not defined.
- Conclusions: Add explicit Electron/Desktop script aliases to enforce desktop-focused startup commands.
- Actions: Added `electron:dev`, `electron:start`, `desktop:dev`, and `desktop:start` scripts in `package.json`.

## 2026-03-09 (Remove dev:vite from Flow)
- Findings: User requested to remove `dev:vite` from the startup flow.
- Conclusions: Desktop startup should remain single-command and avoid exposing separate browser-first script usage.
- Actions: Refactored scripts so `electron:dev` runs `concurrently "vite" "npm run dev:electron"`, set `dev` and `desktop:dev` to `electron:dev`, and removed the `dev:vite` script entry.
