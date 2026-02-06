# Agent Instructions

- This repository identity is `psellos-fiction-yneva-web` (presentation web for fiction-yneva artifacts).
- This repo is read-only with respect to canon.
- It consumes only compiled artifacts produced by psellos-builder.
- It must not read raw data or spec files directly.
- The UI must tolerate unknown or future fields (forward compatibility).
- No domain logic (legitimacy, uncertainty inference, etc.) belongs here.
- You are operating inside a subordinate `psellos-*` repository.
- This repository is governed by the canonical authority defined in:
  - https://raw.githubusercontent.com/psellos-prosopographia/psellos-hub/main/AUTHORITY_INDEX.yml
- Your role:
  - Treat `psellos-hub` as the cross-repository authority for governance, coordination, and synchronization.
  - Use the AUTHORITY_INDEX to understand:
    - what this repository is responsible for
    - what it is not responsible for
    - how to report status, milestones, and completed work upstream
  - Follow raw GitHub URLs referenced by the hub as canonical navigation points when clarification is required.
- Constraints:
  - Do not invent governance rules or redefine authority locally.
  - Do not assume this repository is the source of truth for shared schemas, IDs, or conventions unless explicitly stated.
  - If there is uncertainty, defer to psellos-hub or report the uncertainty explicitly.
- You may explore any raw GitHub URLs referenced in the AUTHORITY_INDEX as needed to understand structure, scope, and expectations.

## Upstream references for standalone workspace mode

- Governance source: `https://github.com/psellos-prosopographia/psellos-hub`
- Authority index: `https://raw.githubusercontent.com/psellos-prosopographia/psellos-hub/main/AUTHORITY_INDEX.yml`
- Source dataset focus: `https://github.com/psellos-prosopographia/psellos-fiction-yneva-data`
- Build compiler: `https://github.com/psellos-prosopographia/psellos-builder`
- Spec contracts: `https://github.com/psellos-prosopographia/psellos-spec`

## Approved stack baseline

- Frontend runtime/build: `React` + `TypeScript` + `Vite`
- Frontend routing and async state: `@tanstack/react-router` + `@tanstack/react-query`
- Frontend local state: `zustand`
- Graph rendering: `cytoscape`
- Map rendering: `maplibre-gl`
- API server: `fastify`
- Validation: `zod`
- Index/query database client: `pg` (PostgreSQL)
- Styling tooling: `tailwindcss` (+ `postcss` and `autoprefixer`)

Use this as the default implementation stack unless superseded by a new ADR.

## Skill usage tracking

- Track usage counters in `skills/skill-usage-counters.json`.
- Whenever a repository skill is actually used to do task work, increment its counter by exactly `1`.
- Do not increment for discovery-only actions (for example listing skills without using one).

## SHIP AND MERGE directive

- Trigger phrase: `SHIP AND MERGE` (all caps, exact phrase).
- When this phrase is used, perform the following sequence:
  1. Create a new branch from the current branch tip, named in descriptive kebab-case.
  2. Include all current changes from the current branch context in that new branch.
  3. Merge `main` into that new branch to surface and resolve conflicts early.
  4. Merge that branch back into `main`.
  5. Attempt to push `main` to `origin`; if conflicts are encountered, stop and request user confirmation before proceeding.

## SHIP AND BRANCH directive

- Trigger phrase: `SHIP AND BRANCH` (all caps, exact phrase).
- Intent: ship current work into a dedicated alternative branch and continue working there for follow-up sub-branches before returning to `main`.
- When this phrase is used, perform the following sequence:
  1. Create a new branch from the current branch tip, named in descriptive kebab-case.
  2. Include all current changes from the current branch context in that new branch.
  3. Merge `main` into that new branch to surface and resolve conflicts early.
  4. Attempt to push that new branch to `origin`; if conflicts are encountered, stop and request user confirmation before proceeding.
  5. Remain checked out on that alternative branch (do not merge back into `main` in this directive).
