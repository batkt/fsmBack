# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

**fsmBack** is an Express + TypeScript backend ("FSM" — field service management / тоноглол-үйлчилгээ style backend judging by dependency on `zuragpack` and the `daalgavar` ("task/assignment") ecosystem used elsewhere in this product family). It depends on **`zevbackv2`**, the shared multi-tenant backend library used across this product family — see `zevbackv2/CLAUDE.md` for the shared architecture pattern (per-organization Mongoose connections, `tokenShalgakh` auth middleware, generic `crud()` route generator). Read that file first; this repo follows the same conventions.

Unlike most sibling backends (which are plain JS + `node index.js`), this one is **TypeScript**, compiled with `tsc` and run via `ts-node-dev` in development.

## Commands

```
npm run dev      # ts-node-dev --respawn --transpile-only src/server.ts
npm run build     # tsc
npm start          # node dist/server.js   (after build)
```

No test script, no lint script configured. There is no automated test suite — verify changes by running `npm run dev` and exercising the affected endpoint.

Entry point is `src/server.ts` (not `index.js` like sibling backends) — check this before assuming the file layout matches `sukhBackv2`/`tureesBack`.

## Architecture

Follows the `zevbackv2` multi-tenant pattern (see that repo's `CLAUDE.md`): per-organization Mongoose connections via `db.kholboltuud`, `tokenShalgakh` middleware injecting `req.body.tukhainBaaziinKholbolt`, and `crud()`-generated REST routes for simple models.

`baaz.md` in this repo documents the `tukhainBaaziinKholbolt` object in detail (in Mongolian) — read it before touching connection/multi-tenant code; it is the clearest write-up of this pattern across the whole product family and is worth consulting even when working in a sibling backend.

`uploads/` holds uploaded files — check `.gitignore`/deployment config before assuming its contents are disposable.

## Notes

- `README.md` in this repo is a generic boilerplate stub (just dev/build/start commands) — it does not describe the actual FSM domain; this file's "Project overview" above is inferred from dependencies and should be verified/expanded once the FSM domain routes are better understood.
