# fsmBack API Map (module-level)

> Scope note: module-level map (one row per `src/routes/*.ts` file, endpoint count from
> `grep router.(get|post|put|delete|patch)`), not a full per-endpoint/frontend-cross-reference table — see
> `turees/docs/API-MAP.md` for what that fuller style looks like; replicating it for every backend in this
> workspace was out of scope for this pass.

## Mount point

Entry point `src/server.ts`. Follows the `zevbackv2` multi-tenant pattern (per-org Mongoose connections via
`db.kholboltuud`, `tokenShalgakh` middleware) — see `baaz.md` in this repo for the clearest write-up of that
pattern across the whole product family.

## Modules

| Route file | Endpoints | Domain |
|---|---|---|
| authRoutes.ts | 5 | authentication |
| taskRoutes.ts | 9 | tasks (`daalgavar`-style task/assignment system) |
| subTaskRoutes.ts | 5 | sub-tasks |
| taskStatusRoutes.ts | 4 | task status transitions (paired with `utils/taskStatusScheduler.ts`) |
| taskTuukhRoutes.ts | 2 | task history log |
| projectRoutes.ts | 5 | projects |
| kpiRoutes.ts | 7 | employee KPI (`ajiltanKpi` model) |
| medegdelRoutes.ts | 9 | notifications |
| chatRoutes.ts | 7 | chat |
| chatbotRoutes.ts | 2 | AI chatbot (`botInteraction`/`botKnowledge` models) |
| fcmTokenRoutes.ts | 4 | Firebase Cloud Messaging push-token registration |
| uilchluulegchRoutes.ts | 7 | customer/client records |
| baraaRoutes.ts | 10 | inventory/goods (`baraa`, `baraaOrlogo` — also has an import service and a one-off migration script) |
| fsmTurulRoutes.ts | 4 | FSM "turul" (type/category) config |
| dbRoute.ts | 2 | DB utility/inspection endpoint |

## Unclear / inferred

- "FSM" domain purpose is inferred from dependency names (`zuragpack`, `daalgavar` ecosystem) per this repo's
  own CLAUDE.md — not confirmed against a design doc. Row descriptions above follow that same inference.
- `uilchluulegchRoutes.ts` name overlaps with the parking-domain `Uilchluulegch` model in `sukhParkingV1`/
  `parking-v2` — unrelated collections in different repos; don't conflate them.

## Frontend consumer

Not identified from this workspace listing — no obvious sibling frontend repo found. Flag with the user
before assuming which app calls this backend.

## Dev-readiness gaps (pass 3)

- No function-level catalog for any controller in this repo yet — only route-file-level
  endpoint counts. `taskStatusRoutes.ts`/`utils/taskStatusScheduler.ts` (status-transition
  logic paired with a scheduler) looks like the highest-risk place for the same kind of
  "derived status written from two places" bug documented in `sukhWeb`'s ledger flow
  (`sukhWeb/docs/system-knowledge/17_GAPS_AND_RISKS.md`, R2) — worth checking first if this
  repo gets picked up for deeper work, but **not verified this pass.**
- No frontend repo for this backend was identified in the workspace (confirmed again this
  pass) — do not assume which app calls these routes without asking.
- No test suite, no lint script (confirmed by this repo's CLAUDE.md).

_Addendum generated 2026-11-10, third pass of the "бүх систем дээр" task._
