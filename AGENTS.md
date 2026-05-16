# Agent Notes

Use npm; `package-lock.json` is the source of truth.
Run `npm run format` after edits.
Pre-commit uses Lefthook from `lefthook.yml`.
The hook runs Prettier on staged format-supported files.
Project plan and task context live in `plan.md`.
App UI is mainly in `src/components/FortuneApp.svelte`; fortunes live in `src/data/fortunes.ts`.
