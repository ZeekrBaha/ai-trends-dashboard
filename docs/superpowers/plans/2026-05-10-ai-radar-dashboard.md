# AI Radar Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-page AI trend dashboard pulling live data from GitHub Trending and HackerNews (via free APIs), plus mock YouTube data (real key can be wired in later), with dark/light theme, search, tabs, and sort.

**Architecture:** One `index.html` + `style.css` + `app.js` in the project root — no build step, open directly in browser. A `data.js` module holds all fetch/mock logic; `ui.js` handles rendering; `app.js` wires them together. Tests run with native `<script type="module">` in a `test.html` using a tiny assertion helper (no framework).

**Tech Stack:** HTML5, CSS custom properties (themes), vanilla ES modules, GitHub REST API (unauthenticated), Algolia HackerNews API, mock YouTube data.

---

## File Structure

```
ai-radar/
├── index.html          # Shell: header, tabs, search bar, sort, card grid
├── style.css           # All styles: dark/light themes via [data-theme], card grid, animations
├── app.js              # Entry point: init, wires data → ui, handles theme/search/sort/tab events
├── data.js             # fetch functions: fetchGitHub(), fetchHackerNews(), mockYouTube()
├── ui.js               # renderCards(items), renderTabs(), buildCard(item) → DOM node
├── test.html           # Test runner: imports test.js, shows pass/fail in browser
└── test.js             # Unit tests for data.js transformations and ui.js helpers
```

---

## Task 1: Project scaffold + CSS design system

**Files:**
- Create: `index.html`
- Create: `style.css`

- [ ] **Step 1: Create `index.html`**

```html
<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Radar</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <header>
    <div class="logo">🔭 AI Radar</div>
    <div class="header-controls">
      <input type="text" id="search" placeholder="Search all sources…" autocomplete="off">
      <select id="sort">
        <option value="growth">↑ Growth</option>
        <option value="date">📅 Date</option>
        <option value="popularity">🔥 Popularity</option>
      </select>
      <button id="theme-toggle" aria-label="Toggle theme">☀</button>
    </div>
  </header>

  <nav class="tabs" role="tablist">
    <button class="tab active" data-tab="overview" role="tab">Overview</button>
    <button class="tab" data-tab="github" role="tab">GitHub</button>
    <button class="tab" data-tab="youtube" role="tab">YouTube</button>
    <button class="tab" data-tab="hackernews" role="tab">HackerNews</button>
  </nav>

  <main>
    <div id="status" class="status" aria-live="polite"></div>
    <div id="card-grid" class="card-grid"></div>
  </main>

  <script type="module" src="app.js"></script>
</body>
</html>
```

- [ ] **Step 2: Create `style.css`**

```css
:root {
  --bg: #0d1117;
  --surface: #161b22;
  --border: #30363d;
  --text: #e6edf3;
  --text-muted: #8b949e;
  --accent: #58a6ff;
  --badge-gh: #238636;
  --badge-yt: #b91c1c;
  --badge-hn: #b45309;
  --growth: #3fb950;
  --radius: 8px;
  --gap: 16px;
}

[data-theme="light"] {
  --bg: #f6f8fa;
  --surface: #ffffff;
  --border: #d0d7de;
  --text: #1f2328;
  --text-muted: #656d76;
  --accent: #0969da;
  --badge-gh: #1a7f37;
  --badge-yt: #cf2222;
  --badge-hn: #b45309;
  --growth: #1a7f37;
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  background: var(--bg);
  color: var(--text);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  min-height: 100vh;
}

header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  border-bottom: 1px solid var(--border);
  background: var(--surface);
  position: sticky;
  top: 0;
  z-index: 10;
}

.logo {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--accent);
  letter-spacing: -0.5px;
}

.header-controls {
  display: flex;
  gap: 8px;
  align-items: center;
}

#search {
  background: var(--bg);
  border: 1px solid var(--border);
  color: var(--text);
  border-radius: var(--radius);
  padding: 6px 12px;
  font-size: 0.875rem;
  width: 220px;
  outline: none;
  transition: border-color 0.15s;
}
#search:focus { border-color: var(--accent); }

#sort {
  background: var(--bg);
  border: 1px solid var(--border);
  color: var(--text);
  border-radius: var(--radius);
  padding: 6px 10px;
  font-size: 0.875rem;
  cursor: pointer;
  outline: none;
}

#theme-toggle {
  background: var(--bg);
  border: 1px solid var(--border);
  color: var(--text);
  border-radius: var(--radius);
  padding: 6px 10px;
  cursor: pointer;
  font-size: 1rem;
  transition: background 0.15s;
}
#theme-toggle:hover { background: var(--border); }

.tabs {
  display: flex;
  gap: 0;
  padding: 0 24px;
  border-bottom: 1px solid var(--border);
  background: var(--surface);
}

.tab {
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--text-muted);
  padding: 12px 20px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: color 0.15s, border-color 0.15s;
}
.tab:hover { color: var(--text); }
.tab.active {
  color: var(--accent);
  border-bottom-color: var(--accent);
}

main { padding: var(--gap) 24px 40px; }

.status {
  color: var(--text-muted);
  font-size: 0.875rem;
  margin-bottom: 12px;
  min-height: 20px;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--gap);
}

.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: border-color 0.15s, transform 0.1s;
}
.card:hover {
  border-color: var(--accent);
  transform: translateY(-1px);
}

.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.card-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text);
  line-height: 1.4;
  flex: 1;
}

.badge {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 999px;
  color: #fff;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
}
.badge-github { background: var(--badge-gh); }
.badge-youtube { background: var(--badge-yt); }
.badge-hackernews { background: var(--badge-hn); }

.card-description {
  font-size: 0.8rem;
  color: var(--text-muted);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
  padding-top: 8px;
  border-top: 1px solid var(--border);
}

.card-growth {
  color: var(--growth);
  font-size: 0.85rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.card-stats {
  font-size: 0.78rem;
  color: var(--text-muted);
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-date {
  font-size: 0.78rem;
  color: var(--text-muted);
}

.card-link {
  font-size: 0.8rem;
  color: var(--accent);
  text-decoration: none;
  font-weight: 500;
}
.card-link:hover { text-decoration: underline; }

.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  color: var(--text-muted);
  padding: 60px 0;
  font-size: 1rem;
}

@media (max-width: 600px) {
  header { flex-direction: column; gap: 8px; align-items: stretch; }
  .header-controls { flex-wrap: wrap; }
  #search { width: 100%; }
}
```

- [ ] **Step 3: Open `index.html` in the browser and verify the shell renders correctly**

Open: `open /Users/baha/Desktop/llm-ai-projects/ai-radar/index.html`

Expected: Dark header with "🔭 AI Radar", search box, sort, theme button; four tabs; empty main area.

- [ ] **Step 4: Commit**

```bash
cd ~/Desktop/llm-ai-projects/ai-radar
git init
git add index.html style.css
git commit -m "feat: scaffold HTML shell + CSS design system (dark/light themes)"
```

---

## Task 2: Data layer — fetch functions + mock YouTube

**Files:**
- Create: `data.js`

- [ ] **Step 1: Create `data.js`**

```javascript
// Normalised item shape used throughout the app:
// { id, source, title, description, url, growthValue, growthLabel, popularityValue, date }

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export async function fetchGitHub() {
  // GitHub Search API — repos updated in the last week, sorted by stars, topic=machine-learning or AI
  const since = new Date(Date.now() - ONE_WEEK_MS).toISOString().slice(0, 10);
  const queries = [
    `topic:machine-learning+topic:ai+created:>${since}`,
    `topic:llm+stars:>50+created:>${since}`,
    `artificial-intelligence+stars:>100+pushed:>${since}`,
  ];

  const results = await Promise.allSettled(
    queries.map(q =>
      fetch(
        `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&sort=stars&order=desc&per_page=10`,
        { headers: { Accept: 'application/vnd.github+json' } }
      ).then(r => {
        if (!r.ok) throw new Error(`GitHub API ${r.status}`);
        return r.json();
      })
    )
  );

  const seen = new Set();
  const items = [];

  for (const result of results) {
    if (result.status !== 'fulfilled') continue;
    const repos = result.value.items ?? [];
    for (const repo of repos) {
      if (seen.has(repo.id)) continue;
      seen.add(repo.id);
      items.push({
        id: `gh-${repo.id}`,
        source: 'github',
        title: repo.full_name,
        description: repo.description ?? '',
        url: repo.html_url,
        growthValue: repo.stargazers_count,
        growthLabel: `⭐ ${fmtNum(repo.stargazers_count)} stars`,
        popularityValue: repo.stargazers_count,
        date: new Date(repo.pushed_at ?? repo.created_at),
      });
    }
  }

  return items;
}

export async function fetchHackerNews() {
  // Algolia HN API — search for AI posts from the past 7 days, sorted by points
  const since = Math.floor((Date.now() - ONE_WEEK_MS) / 1000);
  const keywords = ['artificial intelligence', 'LLM', 'GPT', 'Claude', 'Gemini', 'machine learning', 'AI model'];

  const results = await Promise.allSettled(
    keywords.map(kw =>
      fetch(
        `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(kw)}&tags=story&numericFilters=created_at_i>${since},points>10&hitsPerPage=8`,
      ).then(r => {
        if (!r.ok) throw new Error(`HN API ${r.status}`);
        return r.json();
      })
    )
  );

  const seen = new Set();
  const items = [];

  for (const result of results) {
    if (result.status !== 'fulfilled') continue;
    const hits = result.value.hits ?? [];
    for (const hit of hits) {
      if (seen.has(hit.objectID)) continue;
      seen.add(hit.objectID);
      const points = hit.points ?? 0;
      items.push({
        id: `hn-${hit.objectID}`,
        source: 'hackernews',
        title: hit.title ?? '(no title)',
        description: `${hit.num_comments ?? 0} comments`,
        url: hit.url ?? `https://news.ycombinator.com/item?id=${hit.objectID}`,
        growthValue: points,
        growthLabel: `🔥 ${fmtNum(points)} pts`,
        popularityValue: points,
        date: new Date(hit.created_at),
      });
    }
  }

  return items;
}

export function mockYouTube() {
  // Placeholder data — replace with real YouTube Data API v3 when key is available.
  // growthValue = views gained this week (estimated as 30% of total for mock).
  const raw = [
    { id: 'yt-1', title: 'GPT-5 Is Here — Full Breakdown', channel: 'AI Explained', views: 2_100_000, days: 5 },
    { id: 'yt-2', title: 'Claude 4 Hands-On: What Changed?', channel: 'Andrej Karpathy', views: 1_340_000, days: 2 },
    { id: 'yt-3', title: 'Run LLMs Locally with Ollama', channel: 'Fireship', views: 980_000, days: 6 },
    { id: 'yt-4', title: 'Gemini Ultra vs GPT-5 Benchmark', channel: 'Two Minute Papers', views: 870_000, days: 3 },
    { id: 'yt-5', title: 'Building AI Agents from Scratch', channel: 'Yannic Kilcher', views: 650_000, days: 4 },
    { id: 'yt-6', title: 'The State of Open-Source AI in 2025', channel: 'Machine Learning Street Talk', views: 420_000, days: 7 },
    { id: 'yt-7', title: 'Mistral Large 3 First Look', channel: 'Matthew Berman', views: 310_000, days: 1 },
    { id: 'yt-8', title: 'Cursor AI + Claude 4 = Insane Productivity', channel: 'Theo', views: 290_000, days: 2 },
  ];

  return raw.map(v => {
    const weeklyGrowth = Math.round(v.views * 0.3);
    return {
      id: v.id,
      source: 'youtube',
      title: v.title,
      description: `by ${v.channel}`,
      url: `https://www.youtube.com/results?search_query=${encodeURIComponent(v.title)}`,
      growthValue: weeklyGrowth,
      growthLabel: `📺 +${fmtNum(weeklyGrowth)} views/wk`,
      popularityValue: v.views,
      date: new Date(Date.now() - v.days * 24 * 60 * 60 * 1000),
    };
  });
}

export function sortItems(items, sortKey) {
  const copy = [...items];
  if (sortKey === 'growth') {
    copy.sort((a, b) => b.growthValue - a.growthValue);
  } else if (sortKey === 'date') {
    copy.sort((a, b) => b.date - a.date);
  } else if (sortKey === 'popularity') {
    copy.sort((a, b) => b.popularityValue - a.popularityValue);
  }
  return copy;
}

export function filterItems(items, query) {
  if (!query.trim()) return items;
  const q = query.toLowerCase();
  return items.filter(
    item =>
      item.title.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q)
  );
}

function fmtNum(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'k';
  return String(n);
}
```

- [ ] **Step 2: Commit**

```bash
git add data.js
git commit -m "feat: data layer — GitHub, HackerNews fetch + mock YouTube + sort/filter utils"
```

---

## Task 3: UI layer — card renderer

**Files:**
- Create: `ui.js`

- [ ] **Step 1: Create `ui.js`**

```javascript
export function buildCard(item) {
  const card = document.createElement('article');
  card.className = 'card';
  card.dataset.id = item.id;

  const badgeClass = {
    github: 'badge-github',
    youtube: 'badge-youtube',
    hackernews: 'badge-hackernews',
  }[item.source] ?? '';

  const badgeLabel = {
    github: 'GitHub',
    youtube: 'YouTube',
    hackernews: 'HN',
  }[item.source] ?? item.source;

  const daysAgo = Math.round((Date.now() - item.date.getTime()) / (1000 * 60 * 60 * 24));
  const dateLabel = daysAgo === 0 ? 'today' : daysAgo === 1 ? '1 day ago' : `${daysAgo} days ago`;

  card.innerHTML = `
    <div class="card-header">
      <span class="card-title">${escHtml(item.title)}</span>
      <span class="badge ${badgeClass}">${badgeLabel}</span>
    </div>
    ${item.description ? `<p class="card-description">${escHtml(item.description)}</p>` : ''}
    <div class="card-meta">
      <span class="card-growth">${escHtml(item.growthLabel)}</span>
      <span class="card-stats">${escHtml(item.growthLabel)}</span>
    </div>
    <div class="card-footer">
      <span class="card-date">${dateLabel}</span>
      <a class="card-link" href="${escAttr(item.url)}" target="_blank" rel="noopener noreferrer">Open →</a>
    </div>
  `;

  return card;
}

export function renderCards(grid, items) {
  grid.replaceChildren();
  if (items.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = 'No results found.';
    grid.appendChild(empty);
    return;
  }
  const fragment = document.createDocumentFragment();
  for (const item of items) {
    fragment.appendChild(buildCard(item));
  }
  grid.appendChild(fragment);
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escAttr(str) {
  // Only allow http/https URLs to prevent javascript: injection
  const s = String(str);
  if (!/^https?:\/\//i.test(s)) return '#';
  return s.replace(/"/g, '%22');
}
```

- [ ] **Step 2: Commit**

```bash
git add ui.js
git commit -m "feat: ui layer — card renderer with XSS-safe escaping"
```

---

## Task 4: App entry point — wires everything together

**Files:**
- Create: `app.js`

- [ ] **Step 1: Create `app.js`**

```javascript
import { fetchGitHub, fetchHackerNews, mockYouTube, sortItems, filterItems } from './data.js';
import { renderCards } from './ui.js';

const state = {
  allItems: [],
  activeTab: 'overview',
  sortKey: 'growth',
  searchQuery: '',
};

const grid = document.getElementById('card-grid');
const status = document.getElementById('status');
const searchInput = document.getElementById('search');
const sortSelect = document.getElementById('sort');
const themeToggle = document.getElementById('theme-toggle');
const tabs = document.querySelectorAll('.tab');

function getVisibleItems() {
  const byTab =
    state.activeTab === 'overview'
      ? state.allItems
      : state.allItems.filter(i => i.source === state.activeTab);

  const searched = filterItems(byTab, state.searchQuery);
  return sortItems(searched, state.sortKey);
}

function refresh() {
  renderCards(grid, getVisibleItems());
}

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    state.activeTab = tab.dataset.tab;
    refresh();
  });
});

searchInput.addEventListener('input', () => {
  state.searchQuery = searchInput.value;
  refresh();
});

sortSelect.addEventListener('change', () => {
  state.sortKey = sortSelect.value;
  refresh();
});

themeToggle.addEventListener('click', () => {
  const html = document.documentElement;
  const next = html.dataset.theme === 'dark' ? 'light' : 'dark';
  html.dataset.theme = next;
  themeToggle.textContent = next === 'dark' ? '☀' : '🌙';
});

async function init() {
  status.textContent = 'Loading data…';

  const [ghResult, hnResult] = await Promise.allSettled([
    fetchGitHub(),
    fetchHackerNews(),
  ]);

  const ghItems = ghResult.status === 'fulfilled' ? ghResult.value : [];
  const hnItems = hnResult.status === 'fulfilled' ? hnResult.value : [];
  const ytItems = mockYouTube();

  if (ghResult.status === 'rejected') console.error('GitHub fetch failed:', ghResult.reason);
  if (hnResult.status === 'rejected') console.error('HN fetch failed:', hnResult.reason);

  state.allItems = [...ghItems, ...hnItems, ...ytItems];

  const total = state.allItems.length;
  const errors = [ghResult, hnResult].filter(r => r.status === 'rejected').length;
  status.textContent = `${total} items loaded${errors ? ` (${errors} source${errors > 1 ? 's' : ''} unavailable)` : ''} · last updated ${new Date().toLocaleTimeString()}`;

  refresh();
}

init();
```

- [ ] **Step 2: Open the app in the browser**

```bash
open ~/Desktop/llm-ai-projects/ai-radar/index.html
```

Expected: Cards appear from GitHub and HackerNews (live), YouTube (mock). Tabs filter by source. Search filters cards. Sort reorders. Theme toggle switches dark ↔ light.

- [ ] **Step 3: Commit**

```bash
git add app.js
git commit -m "feat: app entry point — wires data + ui, tab/search/sort/theme state"
```

---

## Task 5: Tests

**Files:**
- Create: `test.html`
- Create: `test.js`

- [ ] **Step 1: Create `test.html`**

```html
<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="UTF-8">
  <title>AI Radar Tests</title>
  <link rel="stylesheet" href="style.css">
  <style>
    body { padding: 24px; }
    .pass { color: #3fb950; }
    .fail { color: #f85149; }
    pre { font-family: monospace; font-size: 0.85rem; margin-top: 4px; color: #8b949e; }
    h2 { color: #58a6ff; margin: 16px 0 8px; }
  </style>
</head>
<body>
  <h1>🔭 AI Radar — Test Suite</h1>
  <div id="results"></div>
  <script type="module" src="test.js"></script>
</body>
</html>
```

- [ ] **Step 2: Create `test.js`**

```javascript
import { sortItems, filterItems, mockYouTube } from './data.js';
import { buildCard } from './ui.js';

const results = document.getElementById('results');
let passed = 0, failed = 0;

function assert(label, condition, detail = '') {
  const el = document.createElement('div');
  if (condition) {
    el.className = 'pass';
    el.innerHTML = `✅ ${label}`;
    passed++;
  } else {
    el.className = 'fail';
    el.innerHTML = `❌ ${label}`;
    if (detail) {
      const pre = document.createElement('pre');
      pre.textContent = detail;
      el.appendChild(pre);
    }
    failed++;
  }
  results.appendChild(el);
}

function section(name) {
  const h = document.createElement('h2');
  h.textContent = name;
  results.appendChild(h);
}

// --- sortItems ---
section('sortItems');

const items = [
  { id: 'a', growthValue: 100, popularityValue: 500, date: new Date('2026-05-08') },
  { id: 'b', growthValue: 300, popularityValue: 200, date: new Date('2026-05-10') },
  { id: 'c', growthValue: 50,  popularityValue: 800, date: new Date('2026-05-07') },
];

const byGrowth = sortItems(items, 'growth');
assert(
  'sortItems by growth: highest first',
  byGrowth[0].id === 'b' && byGrowth[2].id === 'c',
  `got: ${byGrowth.map(i => i.id).join(', ')}`
);

const byDate = sortItems(items, 'date');
assert(
  'sortItems by date: newest first',
  byDate[0].id === 'b' && byDate[2].id === 'c',
  `got: ${byDate.map(i => i.id).join(', ')}`
);

const byPop = sortItems(items, 'popularity');
assert(
  'sortItems by popularity: highest first',
  byPop[0].id === 'c' && byPop[2].id === 'b',
  `got: ${byPop.map(i => i.id).join(', ')}`
);

assert(
  'sortItems does not mutate original array',
  items[0].id === 'a',
  `items[0].id is now: ${items[0].id}`
);

// --- filterItems ---
section('filterItems');

const filterSample = [
  { id: '1', title: 'GPT-5 Released', description: 'OpenAI drops flagship model', source: 'hackernews' },
  { id: '2', title: 'Run Ollama locally', description: 'Local LLM runtime', source: 'github' },
  { id: '3', title: 'Gemini Ultra vs GPT', description: 'Benchmark results', source: 'youtube' },
];

const res1 = filterItems(filterSample, 'gpt');
assert(
  'filterItems matches title case-insensitively',
  res1.length === 2 && res1.some(i => i.id === '1') && res1.some(i => i.id === '3'),
  `matched: ${res1.map(i => i.id).join(', ')}`
);

const res2 = filterItems(filterSample, 'local');
assert(
  'filterItems matches description',
  res2.length === 1 && res2[0].id === '2',
  `matched: ${res2.map(i => i.id).join(', ')}`
);

const res3 = filterItems(filterSample, '');
assert(
  'filterItems with empty query returns all items',
  res3.length === 3,
  `got: ${res3.length}`
);

const res4 = filterItems(filterSample, 'zzznomatch');
assert(
  'filterItems with no match returns empty array',
  res4.length === 0,
  `got: ${res4.length}`
);

// --- mockYouTube ---
section('mockYouTube');

const ytItems = mockYouTube();
assert('mockYouTube returns at least 5 items', ytItems.length >= 5, `got: ${ytItems.length}`);
assert(
  'mockYouTube items have required shape',
  ytItems.every(i => i.id && i.source === 'youtube' && i.title && i.url && i.date instanceof Date),
  `first item: ${JSON.stringify(ytItems[0])}`
);
assert(
  'mockYouTube growthValue is positive',
  ytItems.every(i => i.growthValue > 0),
  `items with growthValue <= 0: ${ytItems.filter(i => i.growthValue <= 0).map(i => i.id).join(', ')}`
);

// --- buildCard XSS safety ---
section('buildCard — XSS safety');

const xssItem = {
  id: 'xss-1',
  source: 'github',
  title: '<script>alert("xss")</script>',
  description: '<img src=x onerror=alert(1)>',
  url: 'https://github.com/safe',
  growthValue: 100,
  growthLabel: '+100 ⭐',
  popularityValue: 100,
  date: new Date(),
};

const card = buildCard(xssItem);
assert(
  'buildCard escapes < in title',
  !card.innerHTML.includes('<script>'),
  `innerHTML contains <script>: ${card.innerHTML.slice(0, 200)}`
);
assert(
  'buildCard escapes onerror in description',
  !card.innerHTML.includes('onerror'),
  `innerHTML contains onerror: ${card.innerHTML.slice(0, 200)}`
);

const jsUrlItem = {
  ...xssItem,
  id: 'xss-2',
  url: 'javascript:alert(1)',
};
const jsCard = buildCard(jsUrlItem);
const link = jsCard.querySelector('a.card-link');
assert(
  'buildCard blocks javascript: URLs',
  link && link.getAttribute('href') === '#',
  `href is: ${link?.getAttribute('href')}`
);

// --- Summary ---
const summary = document.createElement('div');
summary.style.marginTop = '24px';
summary.style.fontWeight = '700';
summary.innerHTML = `<span class="${failed === 0 ? 'pass' : 'fail'}">${passed} passed, ${failed} failed</span>`;
results.appendChild(summary);
```

- [ ] **Step 3: Open `test.html` in the browser and verify all tests pass**

```bash
open ~/Desktop/llm-ai-projects/ai-radar/test.html
```

Expected: All tests show ✅. Zero ❌.

- [ ] **Step 4: Commit**

```bash
git add test.html test.js
git commit -m "test: browser test suite — sortItems, filterItems, mockYouTube, buildCard XSS"
```

---

## Task 6: Final polish + README

**Files:**
- Create: `README.md`

- [ ] **Step 1: Fix the redundant `card-stats` in `ui.js`**

The card currently shows `growthLabel` twice (once in `card-growth`, once in `card-stats`). Replace the second occurrence with the total count/views:

In `ui.js`, replace the `card-meta` block:

```javascript
// Replace this:
    <div class="card-meta">
      <span class="card-growth">${escHtml(item.growthLabel)}</span>
      <span class="card-stats">${escHtml(item.growthLabel)}</span>
    </div>

// With this:
    <div class="card-meta">
      <span class="card-growth">${escHtml(item.growthLabel)}</span>
    </div>
```

- [ ] **Step 2: Create `README.md`**

```markdown
# AI Radar

Single-page dashboard tracking AI trends over the last 7 days.

## Sources
- **GitHub** — top AI/ML repos by stars (GitHub Search API, no key needed)
- **HackerNews** — top AI stories by points (Algolia HN API, no key needed)
- **YouTube** — mock data (wire up `YOUTUBE_API_KEY` later — see `data.js → mockYouTube`)

## Run
```bash
open index.html   # or serve with: npx serve .
```

## Test
```bash
open test.html
```

## Add YouTube API key
1. Get a key from Google Cloud Console → YouTube Data API v3
2. In `data.js`, replace `mockYouTube()` with a real fetch:
   ```js
   const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=artificial+intelligence&type=video&order=viewCount&publishedAfter=${since}T00:00:00Z&maxResults=20&key=YOUR_KEY`);
   ```
```

- [ ] **Step 3: Final browser verification**

```bash
open ~/Desktop/llm-ai-projects/ai-radar/index.html
```

Check:
- All four tabs work (Overview shows all, GitHub/YouTube/HN filter correctly)
- Search filters across all sources
- Sort dropdown reorders cards
- Theme toggle switches dark ↔ light
- Cards show title, badge, growth metric, date, and working link

- [ ] **Step 4: Final commit**

```bash
git add ui.js README.md
git commit -m "fix: remove duplicate growthLabel in card; add README with YouTube API wiring instructions"
```

---

## Spec Coverage Check

| Requirement | Task |
|---|---|
| GitHub — trending AI/ML repos | Task 2: `fetchGitHub()` |
| YouTube — trending AI videos (7 days) | Task 2: `mockYouTube()` (mock; real API wiring documented in README) |
| HackerNews — top AI posts by points | Task 2: `fetchHackerNews()` |
| 4 tabs: Overview, GitHub, YouTube, HackerNews | Task 1 (HTML) + Task 4 (app.js) |
| Cards: title, source, metric, date, link | Task 3: `buildCard()` |
| Dark/light theme toggle | Task 1 (CSS vars) + Task 4 (app.js) |
| Search filter across all sources | Task 2: `filterItems()` + Task 4 |
| Sort: growth, date, popularity | Task 2: `sortItems()` + Task 4 |
| HTML + CSS + vanilla JS | All tasks |
| Tests | Task 5 |
| PR with code review | Post-implementation |

---

> **Next:** Run `/wiki-save` after the PR is merged to record the architecture.
