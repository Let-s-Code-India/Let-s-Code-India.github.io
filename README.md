<p align="center">
  <img src="logo.svg" alt="Let's Code India logo" width="160" />
</p>

<h1 align="center">Let-s-Code-India.github.io</h1>

<p align="center">
  The official website for <a href="https://github.com/Let-s-Code-India">Let's Code India</a> —
  an independent engineering playground building the software world from the ground up.
</p>

## What this site does

This framework-free, static site introduces Let-s-Code-India and keeps its open
work discoverable. It lists public GitHub Pages projects and organization
repositories. Repository details can be expanded to read a project's Markdown
README, with links and images resolved back to that repository.

## Repository data

`.github/workflows/update-repos.yml` refreshes `data/repos.json` every six hours,
on pushes to `main`, and on manual dispatch. It uses the Actions-provided
`GITHUB_TOKEN` to page through the public organization repositories and resolve
GitHub Pages URLs. The workflow commits the generated catalog only when it
changes. The browser loads this static file first and falls back to the public
GitHub API if it is missing or invalid; results are cached in `sessionStorage`
for the current tab session.

## Run locally

From the repository root, start Python's built-in static server:

```sh
python3 -m http.server 8000
```

Then open <http://localhost:8000>. The static catalog is needed for the normal
local experience; the browser API fallback is also available if it is absent.

## Deployment and domain

GitHub Pages publishes the repository's `main` branch from its root. The
`CNAME` file maps the site to `let-s-code-india.is-a.dev`; keep that file and the
DNS configuration in sync if the domain ever changes. In the repository's
Pages settings, use HTTPS and enable **Enforce HTTPS** when available. The
catalog workflow needs Actions to have read and write repository permissions.

## Structure

- `index.html`, `styles.css`: page structure and presentation.
- `app.js`: static catalog loading, live fallback, lazy README rendering, and filters.
- `data/repos.json`: generated public repository catalog.
- `vendor/`: pinned, self-hosted libraries loaded when a README is opened.
- `fonts/`, `logo.svg`, favicon files, `og-image.png`: self-hosted brand assets.
- `.github/workflows/update-repos.yml`: scheduled catalog generation.
- `robots.txt`, `sitemap.xml`, `.well-known/security.txt`: crawler and security metadata.
- `404.html`, `site.webmanifest`, `llms.txt`: not-found page, installable-site metadata, and machine-readable site notes.

## Contributing

Website, accessibility, and workflow improvements are welcome. Open an issue
for substantial changes and submit a focused pull request to `main`. Please
preserve the contact section and custom domain, keep the site framework-free,
and run the local server to check your changes. Follow the
[organization-wide contribution and conduct defaults](https://github.com/Let-s-Code-India/.github)
for additional guidance.
