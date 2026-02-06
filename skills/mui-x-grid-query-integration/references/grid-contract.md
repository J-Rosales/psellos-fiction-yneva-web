# Grid Contract

## Required state mapping

- pagination model -> `page`, `page_size`
- sorting model -> `sort`, `order`
- filter model -> route/query filter params
- layer -> always passed and preserved

## API expectations

- server mode for sort/filter/pagination
- deterministic row id mapping
- loading and error states surfaced in grid