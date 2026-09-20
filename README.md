# Let-s-Code-India.github.io

The official website for [Let-s-Code-India](https://github.com/Let-s-Code-India), an independent engineering playground building the software world from the ground up.

This repository contains the organization’s public-facing home: a small, static site that introduces the mission, links to published project sites, and gives visitors a readable way to explore the organization’s open work.

## What it does

The site discovers organization projects at runtime through the public GitHub REST API:

- **Websites** lists every organization repository with GitHub Pages enabled and links to its live site. Configured Pages URLs are preferred, with a predictable GitHub Pages URL as a fallback.
- **Repositories** lists every public organization repository with its GitHub description. Visitors can expand an item to fetch and render that repository’s README, then follow a link back to the source repository.

The listing is intentionally data-driven. Creating another public repository or enabling Pages for an existing one makes it eligible to appear without changing this repository’s code.

README content is fetched lazily from the repository’s `main` branch, with `master` as a fallback. Markdown is rendered in the browser with `marked`, code blocks use `highlight.js` where a language is available, and the resulting HTML is sanitized with `DOMPurify` before it is inserted into the page.

## How it is built

This is a plain static website:

- HTML provides the page structure and organization narrative.
- CSS provides the responsive layout, typography, and logo-derived color palette.
- JavaScript calls the unauthenticated public GitHub API and handles live listings, Pages URL lookup, lazy README loading, Markdown rendering, and error states.

There is no framework, backend, build step, package manager, or local dependency installation. The browser loads the small rendering libraries from CDN URLs when the page is opened.

## Run locally

The page can be opened directly by opening `index.html` in a browser. A local static server is useful for a closer deployment-like check:

```sh
python3 -m http.server 8000
```

Then visit <http://localhost:8000>.

Any static file server can serve the folder. No build or compilation command is required.

## Contributing

Changes to the organization narrative, presentation, or runtime behavior belong in this repository. Repository-specific descriptions and README content should remain sourced from GitHub at runtime rather than being copied into the site’s static files.
