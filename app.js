import { fetchGitHub, fetchHackerNews, mockYouTube, sortItems, filterItems } from './data.js';
import { renderCards } from './ui.js';

// Restore saved theme preference immediately
const savedTheme = localStorage.getItem('ai-radar-theme');
if (savedTheme) {
  document.documentElement.dataset.theme = savedTheme;
  // themeToggle not yet available here; sync its icon after DOM refs are set
}

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

if (savedTheme) themeToggle.textContent = savedTheme === 'dark' ? '🌙' : '☀';

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
    state.searchQuery = '';
    searchInput.value = '';
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
  themeToggle.textContent = next === 'dark' ? '🌙' : '☀';
  localStorage.setItem('ai-radar-theme', next);
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
  const errNote = errors ? ` (${errors} source${errors > 1 ? 's' : ''} unavailable)` : '';
  status.textContent = `${total} items loaded${errNote} · last updated ${new Date().toLocaleTimeString()}`;

  refresh();
}

init().catch(err => {
  status.textContent = 'Failed to load. Check console for details.';
  console.error('AI Radar init failed:', err);
});
