const API_ROOT = 'https://api.github.com';
const ORG = 'Let-s-Code-India';
const DATA_URL = 'data/repos.json';
const SESSION_CACHE_KEY = 'let-s-code-india-repos-v1';
const SITE_REPO = 'let-s-code-india.github.io';
const MOBILE_NAV = window.matchMedia('(max-width: 900px)');

const websiteList = document.querySelector('#website-list');
const repositoryList = document.querySelector('#repository-list');
const websitesStatus = document.querySelector('#websites-status');
const repositoriesStatus = document.querySelector('#repositories-status');
const repositoryResultsStatus = document.querySelector('#repo-results-status');
const repositoryEmpty = document.querySelector('#repo-empty');
const searchInput = document.querySelector('#repo-search');
const languageFilter = document.querySelector('#language-filter');
const sidebar = document.querySelector('#sidebar');
const menuToggle = document.querySelector('#menu-toggle');
let allRepos = [];
let searchTimer;
let sidebarReturnFocus = null;

marked.use(markedHighlight.markedHighlight({
  langPrefix: 'hljs language-',
  highlight(code, language) {
    const grammar = language && hljs.getLanguage(language) ? language : 'plaintext';
    return hljs.highlight(code, { language: grammar }).value;
  },
}));

function setStatus(element, message) {
  element.textContent = message;
}

function visibleRepos(repos) {
  return repos
    .filter((repo) => !repo.fork && !repo.archived)
    .filter((repo) => !['.github', SITE_REPO].includes(repo.name.toLowerCase()))
    .sort((first, second) => Date.parse(second.pushed_at || '') - Date.parse(first.pushed_at || ''));
}

function normalizeRepo(repo) {
  return {
    name: repo.name,
    description: repo.description || '',
    language: repo.language || '',
    html_url: repo.html_url || `https://github.com/${ORG}/${encodeURIComponent(repo.name)}`,
    homepage: repo.homepage || '',
    has_pages: Boolean(repo.has_pages),
    pages_url: repo.pages_url || (repo.has_pages ? repo.homepage || `https://${ORG.toLowerCase()}.github.io/${encodeURIComponent(repo.name)}` : ''),
    default_branch: repo.default_branch || 'main',
    pushed_at: repo.pushed_at || '',
    topics: Array.isArray(repo.topics) ? repo.topics : [],
    stargazers_count: Number(repo.stargazers_count) || 0,
    fork: Boolean(repo.fork),
    archived: Boolean(repo.archived),
  };
}

function readCachedRepos() {
  try {
    const cached = sessionStorage.getItem(SESSION_CACHE_KEY);
    if (!cached) return null;
    const repos = JSON.parse(cached);
    return Array.isArray(repos) ? visibleRepos(repos.map(normalizeRepo)) : null;
  } catch (error) {
    return null;
  }
}

function cacheRepos(repos) {
  try {
    sessionStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(repos));
  } catch (error) {
    // Storage can be disabled or full; the current page can still use the fetched data.
  }
}

async function fetchStaticRepos() {
  const response = await fetch(DATA_URL, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`Repository data returned ${response.status}.`);
  const repos = await response.json();
  if (!Array.isArray(repos)) throw new Error('Repository data has an unexpected format.');
  return visibleRepos(repos.map(normalizeRepo));
}

async function fetchAllRepos() {
  const repos = [];
  let page = 1;
  while (true) {
    const response = await fetch(`${API_ROOT}/orgs/${ORG}/repos?per_page=100&page=${page}&sort=pushed&type=public`);
    if (!response.ok) throw new Error(response.status === 403 ? 'GitHub is temporarily rate limiting public requests.' : `GitHub returned ${response.status}.`);
    const batch = await response.json();
    repos.push(...batch.map(normalizeRepo));
    const link = response.headers.get('Link') || '';
    if (!link.includes('rel="next"') || batch.length === 0) return repos;
    page += 1;
  }
}

async function loadRepos(forceRefresh = false) {
  if (!forceRefresh) {
    const cached = readCachedRepos();
    if (cached) return cached;
  }

  try {
    const repos = await fetchStaticRepos();
    cacheRepos(repos);
    return repos;
  } catch (staticError) {
    const repos = visibleRepos(await fetchAllRepos());
    cacheRepos(repos);
    return repos;
  }
}

function renderWebsites(repos) {
  websiteList.replaceChildren();
  const websiteRepos = repos.filter((repo) => repo.has_pages);
  document.querySelector('#website-count').textContent = websiteRepos.length;
  setStatus(websitesStatus, '');
  websiteRepos.forEach((repo) => {
    const card = document.createElement('article');
    card.className = 'website-card';
    card.innerHTML = '<h3></h3><a target="_blank" rel="noopener noreferrer"></a>';
    card.querySelector('h3').textContent = repo.name;
    const link = card.querySelector('a');
    link.href = repo.pages_url || repo.homepage || `https://${ORG.toLowerCase()}.github.io/${encodeURIComponent(repo.name)}`;
    link.textContent = 'Visit live site ↗';
    websiteList.appendChild(card);
  });
  websiteList.hidden = websiteRepos.length === 0;
  if (websiteRepos.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty-message';
    empty.textContent = 'No published websites yet.';
    websiteList.appendChild(empty);
    websiteList.hidden = false;
  }
}

function renderRepositories(repos) {
  allRepos = repos;
  repositoryList.replaceChildren();
  document.querySelector('#repo-count').textContent = repos.length;
  setStatus(repositoriesStatus, '');
  const languages = [...new Set(repos.map((repo) => repo.language).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  languageFilter.replaceChildren(new Option('All languages', ''));
  languages.forEach((language) => languageFilter.add(new Option(language, language)));
  repos.forEach((repo) => {
    const item = document.createElement('article');
    item.className = 'repo-item';
    item.dataset.language = repo.language;
    item.dataset.search = `${repo.name} ${repo.description} ${repo.language}`.toLocaleLowerCase();
    item.innerHTML = '<div class="repo-summary"><div><h3></h3><span class="repo-meta"></span></div><p></p><button class="details-button" type="button" aria-expanded="false">View Details</button></div><div class="repo-details" hidden></div>';
    item.querySelector('h3').textContent = repo.name;
    item.querySelector('.repo-meta').textContent = repo.language || `Open source project · ${repo.stargazers_count} stars`;
    item.querySelector('p').textContent = repo.description || 'An open experiment from the Let-s-Code-India engineering playground.';
    const button = item.querySelector('.details-button');
    button.addEventListener('click', () => toggleReadme(repo, item, button));
    repositoryList.appendChild(item);
  });
  filterRepositories();
}

async function fetchReadme(repo) {
  const branch = repo.default_branch || 'main';
  const encodedBranch = branch.split('/').map(encodeURIComponent).join('/');
  for (const filename of ['README.md', 'readme.md', 'README.rst']) {
    const response = await fetch(`https://raw.githubusercontent.com/${ORG}/${encodeURIComponent(repo.name)}/${encodedBranch}/${filename}`);
    if (response.ok) {
      if (filename === 'README.rst') return { format: 'rst' };
      return { format: 'markdown', content: await response.text(), branch };
    }
    if (response.status !== 404) throw new Error(response.status === 403 ? 'GitHub is temporarily rate limiting README requests.' : `README request returned ${response.status}.`);
  }
  throw new Error('This repository does not have a supported README file on its default branch.');
}

function renderReadme(markdown, repo, branch) {
  const rawBase = `https://raw.githubusercontent.com/${ORG}/${encodeURIComponent(repo.name)}/${branch.split('/').map(encodeURIComponent).join('/')}/`;
  const blobBase = `https://github.com/${ORG}/${encodeURIComponent(repo.name)}/blob/${branch.split('/').map(encodeURIComponent).join('/')}/`;
  const parsed = new DOMParser().parseFromString(marked.parse(markdown), 'text/html');

  parsed.querySelectorAll('a[href], img[src]').forEach((element) => {
    const attribute = element.tagName === 'IMG' ? 'src' : 'href';
    const value = element.getAttribute(attribute);
    if (!value || value.startsWith('#')) return;
    let resolved;
    try {
      const isRelative = !/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(value);
      resolved = new URL(isRelative && value.startsWith('/') ? value.slice(1) : value, rawBase);
      if (isRelative && resolved.origin === new URL(rawBase).origin) {
        const relativePath = resolved.pathname.slice(new URL(rawBase).pathname.length);
        element.setAttribute(attribute, `${element.tagName === 'IMG' ? rawBase : blobBase}${relativePath}${resolved.search}${resolved.hash}`);
      }
    } catch (error) {
      return;
    }
    if (element.tagName === 'A' && /^https?:$/.test(resolved.protocol)) {
      element.setAttribute('target', '_blank');
      element.setAttribute('rel', 'noopener noreferrer');
    }
  });

  parsed.querySelectorAll('img').forEach((image) => {
    image.setAttribute('loading', 'lazy');
    image.setAttribute('decoding', 'async');
  });

  return DOMPurify.sanitize(parsed.body.innerHTML, { USE_PROFILES: { html: true } });
}

async function toggleReadme(repo, item, button) {
  const details = item.querySelector('.repo-details');
  const isOpen = button.getAttribute('aria-expanded') === 'true';
  button.setAttribute('aria-expanded', String(!isOpen));
  button.textContent = isOpen ? 'View Details' : 'Hide Details';
  details.hidden = isOpen;
  if (isOpen || details.dataset.loaded) return;
  details.innerHTML = '<div class="readme-loading">Reading the project notes<span class="loading-dots">...</span></div>';
  try {
    const readme = await fetchReadme(repo);
    if (readme.format === 'rst') {
      details.innerHTML = `<p class="readme-error">This project uses reStructuredText for its README, which is not rendered here. <a href="${repo.html_url}" target="_blank" rel="noopener noreferrer">Read it on GitHub ↗</a></p>`;
    } else {
      details.innerHTML = `<div class="readme-content">${renderReadme(readme.content, repo, readme.branch)}</div><div class="repo-footer"><a class="repo-link" target="_blank" rel="noopener noreferrer" href="${repo.html_url}">Go to repository →</a></div>`;
    }
    details.dataset.loaded = 'true';
  } catch (error) {
    const message = document.createElement('div');
    message.className = 'readme-error';
    message.textContent = `${error.message} You can still `;
    const link = document.createElement('a');
    link.href = repo.html_url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = 'open the repository on GitHub ↗';
    message.appendChild(link);
    details.replaceChildren(message);
  }
}

function showLoadError(error) {
  [websitesStatus, repositoriesStatus].forEach((element) => {
    element.replaceChildren();
    const message = document.createElement('span');
    message.textContent = `Projects could not be loaded. ${error.message}`;
    const retry = document.createElement('button');
    retry.className = 'retry-button';
    retry.type = 'button';
    retry.textContent = 'Retry';
    retry.addEventListener('click', () => init(true));
    element.append(message, retry);
  });
}

function filterRepositories() {
  const query = searchInput.value.trim().toLocaleLowerCase();
  const language = languageFilter.value;
  let count = 0;
  repositoryList.querySelectorAll('.repo-item').forEach((item) => {
    const matches = item.dataset.search.includes(query) && (!language || item.dataset.language === language);
    item.hidden = !matches;
    if (matches) count += 1;
  });
  repositoryEmpty.hidden = count !== 0;
  repositoryResultsStatus.textContent = `Showing ${count} of ${allRepos.length} repositories.`;
}

async function init(forceRefresh = false) {
  setStatus(websitesStatus, 'Loading published websites...');
  setStatus(repositoriesStatus, 'Loading repositories...');
  websiteList.replaceChildren();
  repositoryList.replaceChildren();
  try {
    const repos = await loadRepos(forceRefresh);
    renderWebsites(repos);
    renderRepositories(repos);
  } catch (error) {
    showLoadError(error);
  }
}

function setSidebarOpen(open, restoreFocus = false) {
  sidebar.classList.toggle('open', open);
  sidebar.inert = MOBILE_NAV.matches && !open;
  sidebar.setAttribute('aria-hidden', String(MOBILE_NAV.matches && !open));
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  if (open) {
    sidebarReturnFocus = document.activeElement;
    window.requestAnimationFrame(() => sidebar.querySelector('nav a')?.focus({ preventScroll: true }));
  } else if (restoreFocus) {
    (sidebarReturnFocus || menuToggle).focus();
  }
}

function updateSidebarForViewport() {
  sidebar.classList.remove('open');
  sidebar.inert = MOBILE_NAV.matches;
  sidebar.setAttribute('aria-hidden', String(MOBILE_NAV.matches));
  menuToggle.setAttribute('aria-expanded', 'false');
}

menuToggle.addEventListener('click', () => setSidebarOpen(menuToggle.getAttribute('aria-expanded') !== 'true'));
sidebar.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setSidebarOpen(false, true)));
document.addEventListener('keydown', (event) => {
  if (!MOBILE_NAV.matches || menuToggle.getAttribute('aria-expanded') !== 'true') return;
  if (event.key === 'Escape') {
    setSidebarOpen(false, true);
    menuToggle.focus();
    return;
  }
  if (event.key !== 'Tab') return;
  const focusable = [...sidebar.querySelectorAll('a[href], button:not([disabled])')]
    .filter((element) => element.getClientRects().length > 0);
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});
MOBILE_NAV.addEventListener('change', updateSidebarForViewport);
updateSidebarForViewport();
searchInput.addEventListener('input', () => {
  window.clearTimeout(searchTimer);
  searchTimer = window.setTimeout(filterRepositories, 150);
});
languageFilter.addEventListener('change', filterRepositories);
init();