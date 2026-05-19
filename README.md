# AuraAir Multi-Page Demo (MPA)

This is the multi-page (non-SPA) version of the AuraAir demo site. Routes are directory-based so each URL is distinct:

- `/` (home)
- `/flightsearch/`
- `/booking-step-1/`
- `/booking-step-2/`
- `/booking-step-3/`
- `/booking-step-4/`
- `/confirmation/`

State (selected destination, fare, passengers, extras, seat, total) is persisted in `sessionStorage` so the flow works across full page loads.

## Deploy

### GitHub Pages
1. Push this folder contents to a GitHub repo.
2. In **Settings → Pages**, choose **Deploy from a branch** and select your branch + root.

### Vercel
1. Import the GitHub repo in Vercel.
2. Framework Preset: **Other**
3. Output/Public directory: **/** (root)

No build step is required.
