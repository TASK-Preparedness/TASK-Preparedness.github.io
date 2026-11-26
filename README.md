# T.A.S.K. website (draft)

Static download site for [T.A.S.K.](https://github.com/TASK-Preparedness/TASK) (Tactical Access Support Kit).
Plain HTML, one CSS file and two small optional JavaScript files. No build step, no framework, no third-party
requests, no trackers, no cookies, no CDNs. Suited to GitHub Pages.

**Status: local draft. Nothing here has been pushed, published or enabled.**

## Pages

| File | Purpose |
|---|---|
| `index.html` | Home: what T.A.S.K. is, READ FIRST warnings, module status, Download CTA |
| `download.html` | Release files (size, SHA-256), `sha256sum -c` verification, requirements, install/uninstall steps |
| `docs.html` | Getting started and a map of the repository docs |
| `about.html` | Safety summary, GPL license, trademark policy summary, source location |
| `support.html` | Issue templates, private security reporting, contributing, Buy Me a Coffee |
| `404.html` | Self-contained not-found page (links to `/`; edit if hosted under a sub-path) |

All links between pages are relative, so the site works at a domain root or under `/<repo>/`.

## Content sources

Every statement is taken from the public repository at tag `v0.1.0-alpha.1`
(commit `7fd952f53d4a9d893b7996c06e3418cc1456f291`): `README.md`, `INSTALL.md`, `docs/VOLUNTEER-TESTING.md`,
`QUICKSTART.md`, `SAFETY.md`, `HARDWARE.md`, `KNOWN-ISSUES.md`, `TRADEMARK.md`, `SECURITY.md`, `SUPPORT.md`,
`CONTRIBUTING.md`, `.github/FUNDING.yml`, and the release notes. If those change, update the pages; do not add
claims that are not in them.

## Release data

`download.html` ships a static copy of the v0.1.0-alpha.1 assets (works with JavaScript off).
`assets/js/release.js` then asks the GitHub API for the newest release and re-renders the list.
It uses `/releases` and takes the first entry because `/releases/latest` ignores pre-releases. It only accepts
download URLs under `https://github.com/TASK-Preparedness/TASK/releases/download/`, caches for 30 minutes
in `sessionStorage`, and falls back to the static data on any error (rate limit: 60 requests/hour/IP).
If the newest tag differs from `data-page-tag` on `#release`, a notice tells visitors the install steps were
written for the older release.

To publish a new release on the site: update the static asset list and checksums in `download.html`,
`DESCRIPTIONS`/`ORDER` in `assets/js/release.js`, `data-page-tag`, the install commands (they name exact files),
and `scripts/verify_downloads.sh`.

## Checks

```
python3 scripts/check_site.py          # offline: local links, anchors, h1/title/lang, warnings present, no external resources
bash scripts/verify_downloads.sh       # anonymous: every download URL is HTTP 200, size and SHA-256 match, sha256sum -c passes
python3 -m http.server 8765            # preview at http://localhost:8765/
```

`scripts/dev/` has the Playwright screenshot/JS-fallback tests and the html-validate config
(`npm i playwright-core html-validate lighthouse`, system Chrome).

## Deployment (not done)

`.github/workflows/pages.yml` deploys the site files with the official Pages actions. It runs only by hand
(`workflow_dispatch`) and only works after Pages is enabled with Source = GitHub Actions. See the comments in the file.
