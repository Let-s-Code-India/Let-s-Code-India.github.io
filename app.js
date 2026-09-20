const API_ROOT = 'https://api.github.com';
const ORG = 'Let-s-Code-India';

const websiteList = document.querySelector('#website-list');
const repositoryList = document.querySelector('#repository-list');
const websitesStatus = document.querySelector('#websites-status');
const repositoriesStatus = document.querySelector('#repositories-status');

function setStatus(element, message) {
  element.textContent = message;
}

async function fetchAllRepos() {
  const repos = [];
  let page = 1;
  while (true) {
    const response = await fetch(`${API_ROOT}/orgs/${ORG}/repos?per_page=100&page=${page}&sort=updated`);
    if (!response.ok) throw new Error(response.status === 403 ? 'GitHub is temporarily rate limiting public requests.' : `GitHub returned ${response.status}.`);
    const batch = await response.json();
    repos.push(...batch);
    const link = response.headers.get('Link') || '';
    if (!link.includes('rel="next"') || batch.length === 0) return repos;
    page += 1;
  }
}

async function getWebsiteUrl(repo) {
  const fallback = repo.name === `${ORG}.github.io` ? `https://${ORG}.github.io` : `https://${ORG.toLowerCase()}.github.io/${repo.name}`;
  try {
    const response = await fetch(`${API_ROOT}/repos/${ORG}/${encodeURIComponent(repo.name)}/pages`);
    if (!response.ok) return fallback;
    const pages = await response.json();
    return pages.html_url || fallback;
  } catch (error) {
    return fallback;
  }
}

function renderWebsites(repos) {
  const websiteRepos = repos.filter((repo) => repo.has_pages);
  document.querySelector('#website-count').textContent = websiteRepos.length;
  setStatus(websitesStatus, websiteRepos.length ? '' : 'No published websites yet.');
  websiteRepos.forEach(async (repo) => {
    const url = await getWebsiteUrl(repo);
    const card = document.createElement('article');
    card.className = 'website-card';
    card.innerHTML = `<h3></h3><a target="_blank" rel="noreferrer"></a>`;
    card.querySelector('h3').textContent = repo.name;
    const link = card.querySelector('a');
    link.href = url;
    link.textContent = 'Visit live site ↗';
    websiteList.appendChild(card);
  });
}

function renderRepositories(repos) {
  document.querySelector('#repo-count').textContent = repos.length;
  setStatus(repositoriesStatus, repos.length ? '' : 'No public repositories found.');
  repos.forEach((repo) => {
    const item = document.createElement('article');
    item.className = 'repo-item';
    item.innerHTML = `<div class="repo-summary"><div><h3></h3><span class="repo-meta"></span></div><p></p><button class="details-button" type="button" aria-expanded="false">View Details</button></div><div class="repo-details" hidden></div>`;
    item.querySelector('h3').textContent = repo.name;
    item.querySelector('.repo-meta').textContent = repo.language || 'Open source project';
    item.querySelector('p').textContent = repo.description || 'An open experiment from the Let-s-Code-India engineering playground.';
    const button = item.querySelector('.details-button');
    button.addEventListener('click', () => toggleReadme(repo, item, button));
    repositoryList.appendChild(item);
  });
}

async function fetchReadme(repo) {
  for (const branch of ['main', 'master']) {
    const response = await fetch(`https://raw.githubusercontent.com/${ORG}/${encodeURIComponent(repo.name)}/${branch}/README.md`);
    if (response.ok) return response.text();
    if (response.status !== 404) throw new Error(response.status === 403 ? 'GitHub is temporarily rate limiting README requests.' : `README request returned ${response.status}.`);
  }
  throw new Error('This repository does not have a README on its main or master branch.');
}

function renderReadme(markdown) {
  marked.setOptions({
    gfm: true,
    breaks: false,
    highlight(code, language) {
      const grammar = language && hljs.getLanguage(language) ? language : 'plaintext';
      return hljs.highlight(code, { language: grammar }).value;
    },
  });
  const html = marked.parse(markdown);
  return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
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
    const markdown = await fetchReadme(repo);
    details.innerHTML = `<div class="readme-content">${renderReadme(markdown)}</div><div class="repo-footer"><a class="repo-link" target="_blank" rel="noreferrer" href="https://github.com/${ORG}/${encodeURIComponent(repo.name)}">Go to repository →</a></div>`;
    details.dataset.loaded = 'true';
  } catch (error) {
    details.innerHTML = `<div class="readme-error">${error.message} You can still <a href="https://github.com/${ORG}/${encodeURIComponent(repo.name)}" target="_blank" rel="noreferrer">open the repository on GitHub ↗</a>.</div>`;
  }
}

async function init() {
  try {
    const repos = await fetchAllRepos();
    renderWebsites(repos);
    renderRepositories(repos);
  } catch (error) {
    setStatus(websitesStatus, error.message);
    setStatus(repositoriesStatus, error.message);
  }
}

document.querySelector('#menu-toggle').addEventListener('click', (event) => {
  const sidebar = document.querySelector('#sidebar');
  const open = sidebar.classList.toggle('open');
  event.currentTarget.setAttribute('aria-expanded', String(open));
});
document.querySelectorAll('.sidebar a').forEach((link) => link.addEventListener('click', () => document.querySelector('#sidebar').classList.remove('open')));
init();