# Security Notes

## Content-Security-Policy (CSP)

The app uses Mapbox GL JS, which currently requires `unsafe-eval` and `unsafe-inline`
in the script policy. See `next.config.ts` for the CSP template and comments.

If you need to tighten CSP:
- Validate whether Mapbox can run without `unsafe-eval` in the current version.
- Test map rendering, search, and boundary overlays across the `map` and `lga/map` routes.
- Update CSP and document the change here with the Mapbox version tested.

