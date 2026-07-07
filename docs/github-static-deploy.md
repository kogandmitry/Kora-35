# GitHub/static deployment notes

This deployment is for the safe first-release prototype only.

## Publishable

- `index.html`
- `src/`
- `data/kora35-monitor.json` after removing sensitive fields
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
4. Switch roles: owner, customer, coordinator, participant, public.
5. Confirm public/customer modes do not expose hidden sensitive details.
6. Confirm the hero works without video by temporarily renaming the MP4 file.
7. Confirm mobile layout below 390px width.

## Target production path

The static prototype can be hosted on GitHub/static hosting for fast review. The production workflow moves to a Russian VPS with HTTPS, PostgreSQL, API, auth, backups, and agent processing.
