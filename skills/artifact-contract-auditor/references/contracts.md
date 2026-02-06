# Artifact Contract Baseline

## Required Files

Profile `m2b`:
- `manifest.json`
- `persons.json`
- `assertions.json`

Profile `m2c`:
- all `m2b` files
- `assertions_by_id.json`
- `assertions_by_layer.json`

## Required Fields

`manifest.json`
- `spec_version` string
- `counts.persons` number
- `counts.assertions` number
- `person_index` object

`persons.json`
- object map of person id -> record
- each record includes `id` string
- optional `name`, `label`, `type`

`assertions.json`
- array of assertion objects
- each assertion includes `subject`, `predicate`, `object`

`assertions_by_id.json`
- object map of assertion id -> assertion object
- each assertion includes `subject`, `predicate`, `object`

`assertions_by_layer.json`
- object map of layer id -> array of assertion ids

## Forward Compatibility Policy

- Ignore unknown fields by default.
- Emit warnings for suspicious structures.
- Fail only when required structures are missing or invalid.
