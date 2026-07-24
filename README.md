# dlonem.com — site source

Static site. No build step. Every page is plain HTML + one shared stylesheet.

## Assets

- `assets/logo.png` — blurple crescent mark (nav + favicon). In place.
- `assets/icons/` — thc / caffeine / nicotine / dragon app icons. In place.
- `assets/img/` — server icons, legacy-era photos, scenic Dlonem art,
  G2A video thumbnail. In place.
- Game box art on games.html and mod screenshots on supernatural.html are
  hotlinked from Steam's CDN (with graceful fallback if they ever 404).

## Before going live — 1 thing left to replace

1. **app-ads.txt** — swap `pub-0000000000000000` for your real AdMob
   publisher ID (AdMob console > Settings > Account information).
   AdMob crawls `dlonem.com/app-ads.txt` via the developer-website
   field in your Play Console listings.

## Numbers that will go stale

- Homepage + Supernatural stats (subscribers, ratings, YouTube count).
- games.html reference prices ("~$13 on G2A" etc.) — snapshots from
  July 2026, refresh occasionally.
- The G2A buttons all point at the generic creator link
  (g2a.com/n/dlonem); swap in per-game affiliate links when you have them.

## Deploying

1. Push this folder to a GitHub repo (drag-and-drop onto the repo
   page works: Add file > Upload files).
2. Cloudflare dashboard > Compute > Workers & Pages > Create >
   Pages > Connect to Git > pick the repo. Framework preset: None.
   Build command: (empty). Output directory: `/`.
3. After first deploy: Custom domains > Set up a domain >
   `dlonem.com`. DNS + SSL are automatic since Cloudflare runs
   your zone.
4. Every future edit: change the file on GitHub, commit, done —
   Cloudflare redeploys automatically.

## Play Console follow-ups

- Store listing contact details > developer website: `https://dlonem.com`
- Per-app privacy policies live at:
  `https://dlonem.com/privacy/thc.html`, `/privacy/caffeine.html`,
  `/privacy/nicotine.html`, `/privacy/tdh.html` (canonical for store
  listings); `https://dlonem.com/privacy.html` is the studio-wide hub.
- Old one-page anchors (`dlonem.github.io/#privacy`, `#support`,
  `#apps`) redirect via a snippet in index.html, and GitHub redirects
  dlonem.github.io → dlonem.com once the custom domain is set.
