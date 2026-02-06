# MUI Theme Policy

## Principles

- Use one app-wide theme via `createTheme`.
- Prefer `sx` with theme keys over hard-coded values.
- Promote repeated styles into `components.*.styleOverrides`.
- Keep colors in palette entries, not inline hex values.

## File targets

- `src/theme/*` for theme source
- React component files for `sx` and component usage

## Drift markers

- Raw hex colors in component code
- Inline font sizes/margins repeated across views
- Divergent button/input styles bypassing theme