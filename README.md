# AuraAir DY Demo (Multi-Page) — Fixed

Distinct URLs (directories):

- `/` (home)
- `/flightsearch/`
- `/booking-step-1/`
- `/booking-step-2/`
- `/booking-step-3/`
- `/booking-step-4/`
- `/confirmation/`

## Why this fixed version works
- `fade-up` sections are visible by default (so homepage tiles show even if JS fails).
- JS no longer uses `structuredClone` (which can break on some browsers).
- Search button is an `<a>` fallback so it navigates even if JS errors.
- State is kept in `sessionStorage` so selections persist across page loads.

## Deploy
### Vercel
Framework preset: **Other** (static)
No build command.

### GitHub Pages
Put all files in the repo root and enable Pages.
