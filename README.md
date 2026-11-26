# T.A.S.K. website (draft)

Static download and hardware-build site for [T.A.S.K.](https://github.com/TASK-Preparedness/TASK)
(Tactical Access Support Kit). Plain HTML, one CSS file and a little optional JavaScript.
No build step, no framework, no third-party requests, no trackers, no cookies, no CDNs.
Suited to GitHub Pages.

The look follows the official launcher palette in `launcher/task_launcher/theme.py`
(`#0B0D10` background, `#15181D` tiles, `#4CC2FF` accent, `#3FB950` / `#D29922` status).

**Live site:** <https://task-preparedness.github.io/>  
**Repository:** <https://github.com/TASK-Preparedness/TASK-Preparedness.github.io>

This tree is the GitHub Pages source (GitHub Actions workflow in `.github/workflows/pages.yml`). There is no site-code license yet; Joshua Sturtz has not chosen one.

## Pages

| File | Purpose |
|---|---|
| `index.html` | Home: headline, READ FIRST warnings, Download CTA, launcher tile grid, commitments |
| `download.html` | Release files (size, SHA-256), `sha256sum -c` verification, requirements, install/uninstall |
| `build.html` | Hardware configurator / Build List: Starter, Comms and Field parts, prices, checklist |
| `docs.html` | Getting started and a map of the repository docs |
| `about.html` | Safety summary, GPL license, trademark policy summary, source location |
| `support.html` | Issue templates, private security reporting, contributing, Buy Me a Coffee |
| `404.html` | Self-contained not-found page (links to `/`; edit if hosted under a sub-path) |

All links between pages are relative, so the site works at a domain root or under `/<repo>/`.

## Content sources

Every statement is taken from the public repository at tag `v0.1.0-alpha.1`
(commit `7fd952f53d4a9d893b7996c06e3418cc1456f291`): `README.md`, `INSTALL.md`,
`docs/VOLUNTEER-TESTING.md`, `QUICKSTART.md`, `SAFETY.md`, `HARDWARE.md`,
`KNOWN-ISSUES.md`, `TRADEMARK.md`, `SECURITY.md`, `SUPPORT.md`, `CONTRIBUTING.md`,
`.github/FUNDING.yml`, the release notes, and the launcher tile manifests under
`launcher/task_launcher/data/apps.d/`. If those change, update the pages; do not add
claims that are not in them.

## Release data

`download.html` ships a static copy of the v0.1.0-alpha.1 assets (works with JavaScript off).
`assets/js/release.js` then asks the GitHub API for the newest release and re-renders the list.

## Build List

`build.html` is a hardware configurator. Tabs choose Starter, Comms or Field.
Checkboxes record parts you already own in `localStorage` (`task-site-build-owned-v1`).
Prices are US-dollar estimates as of November 2026 (see the sources section on that page).
The page works without JavaScript; totals and persistence need it.

## Checks

```
python3 scripts/check_site.py          # offline: local links, anchors, h1/title/lang, warnings, no external resources
bash scripts/verify_downloads.sh       # anonymous: every download URL is HTTP 200, size and SHA-256 match
python3 -m http.server 8765            # preview at http://localhost:8765/
```

## Deployment

`.github/workflows/pages.yml` deploys the site files with the official Pages actions on every push to `main`, and can also be started by hand (`workflow_dispatch`). Pages source is GitHub Actions.
