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

## Skill usage tracking

- Track usage counters in `skills/skill-usage-counters.json`.
- Whenever a repository skill is actually used to do task work, increment its counter by exactly `1`.
- Do not increment for discovery-only actions (for example listing skills without using one).
