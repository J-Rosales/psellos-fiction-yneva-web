# Graph Inference Ruleset

## Modes

- `dynasty`
- `workplace`

## Rule Source

Use only assertion fields:
- `predicate`
- relation extensions when available (`extensions.psellos.rel`, `rel_type`, etc.)
- `subject` and `object` IDs

## Token Heuristics

`dynasty` tokens:
- parent, child, sibling, spouse, dynasty, house, lineage, ancestor, descendant

`workplace` tokens:
- works_at, served_at, employed, appointed, office, institution, court, guild, stationed

## Scoring

- Token hit in `predicate`: +2
- Token hit in relation type: +3
- Exact mode-name token hit: +4

## Output Semantics

- Allow multi-membership for entities.
- Keep precedence unresolved in data output; UI resolves precedence in Advanced options.
