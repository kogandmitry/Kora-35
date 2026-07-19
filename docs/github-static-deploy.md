# GitHub/static deployment notes

This deployment contains two public-safe audience views of the same project
state. GitHub Pages does not provide access control.

## Publishable

- `index.html`
- `org/index.html`
- `customer/index.html`
- `src/`
- `data/kora35-monitor.json` after removing sensitive fields
- `data/kora35-budget.json` with public-safe planning values only
- `assets/hero/` poster/video assets approved for public/demo use

## Not publishable

- passwords, tokens, VPS secrets
- personal data of children or parents
- sensitive labor rates or internal financial details
- founder gifts
- psychological notes about founders or staff
- long raw chats

## Before publishing

1. Run `npm test`.
2. Run `npm run validate`.
3. Open the app locally with `npm run serve`.
4. Open `/org/` and `/customer/` directly.
5. Confirm the organizer page shows detailed budget rows and the customer page
   shows only aggregates, decisions and material risks.
6. Confirm neither page exposes hidden sensitive details.
7. Switch all four budget scenarios and verify totals.
8. Confirm the hero works without video by temporarily renaming the MP4 file.
9. Confirm mobile layout below 390px width.

## Permanent paths

- chooser: `https://eliseyyauezhik.github.io/Kora-35/`
- organizer monitor: `https://eliseyyauezhik.github.io/Kora-35/org/`
- customer monitor: `https://eliseyyauezhik.github.io/Kora-35/customer/`

Do not mark the monitors current until the published commit and all three URLs
have been checked. If GitHub write access is missing, record the publication
gap explicitly.

## Target production path

The static prototype can be hosted on GitHub/static hosting for fast review. The production workflow moves to a Russian VPS with HTTPS, PostgreSQL, API, auth, backups, and agent processing.
