import { fetchGitHub, fetchHackerNews, mockYouTube, sortItems, filterItems } from './data.js';
import { renderCards, renderEmptyState, renderSkeletons } from './ui.js';

// Restore saved theme preference immediately (before DOM refs are set)
const savedTheme = localStorage.getItem('ai-radar-theme');
if (savedTheme) {
  document.documentElement.dataset.theme = savedTheme;
}

const state = {
  allItems: [],
  activeTab: 'overview',
  sortKey: 'growth',
  searchQuery: '',
  githubRateLimited: false,
  lastUpdated: null,
};

const grid = document.getElementById('card-grid');
const status = document.getElementById('status');
const searchInput = document.getElementById('search');
const sortSelect = document.getElementById('sort');
const themeToggle = document.getElementById('theme-toggle');
const refreshBtn = document.getElementById('refresh-btn');
const tabs = document.querySelectorAll('.tab');

// Sync theme toggle icon with restored theme
if (savedTheme) themeToggle.textContent = savedTheme === 'dark' ? '🌙' : '☀️';

function getVisibleItems() {
  const byTab =
    state.activeTab === 'overview'
      ? state.allItems
      : state.allItems.filter(i => i.source === state.activeTab);

  const searched = filterItems(byTab, state.searchQuery);
  return sortItems(searched, state.sortKey);
}

function refresh() {
  const visible = getVisibleItems();

  // Show rate-limit message on GitHub tab when no results due to rate limiting
  if (state.activeTab === 'github' && visible.length === 0 && state.githubRateLimited) {
    renderEmptyState(
      grid,
      '⚠️ GitHub API rate limit reached (10 req/hr for unauthenticated requests). Add an Authorization: Bearer YOUR_TOKEN header in data.js → fetchGitHub() to lift it.',
      [{ label: 'Generate a free token →', href: 'https://github.com/settings/tokens' }]
    );
  } else {
    renderCards(grid, visible);
  }

  // Update status bar with per-tab count
  const tabLabel = state.activeTab === 'overview' ? 'all sources' : state.activeTab;
  const searchNote = state.searchQuery ? ` matching "${state.searchQuery}"` : '';
  const timeStr = state.lastUpdated ? new Date(state.lastUpdated).toLocaleTimeString() : 'never';
  status.textContent = `${visible.length} items · ${tabLabel}${searchNote} · last updated ${timeStr}`;
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
  themeToggle.textContent = next === 'dark' ? '🌙' : '☀️';
  localStorage.setItem('ai-radar-theme', next);
});

refreshBtn.addEventListener('click', () => {
  refreshBtn.disabled = true;
  init().finally(() => { refreshBtn.disabled = false; });
});

async function init() {
  // Reset transient flags so a successful retry clears stale state
  state.githubRateLimited = false;

  status.textContent = 'Loading…';
  renderSkeletons(grid);

  const [ghResult, hnResult] = await Promise.allSettled([
    fetchGitHub(),
    fetchHackerNews(),
  ]);

  const ghItems = ghResult.status === 'fulfilled' ? ghResult.value : [];
  const hnItems = hnResult.status === 'fulfilled' ? hnResult.value : [];
  const ytItems = mockYouTube();

  if (ghResult.status === 'rejected') {
    if (ghResult.reason?.code === 'RATE_LIMITED') {
      state.githubRateLimited = true;
    } else {
      console.error('GitHub fetch failed:', ghResult.reason);
    }
  }
  if (hnResult.status === 'rejected') console.error('HN fetch failed:', hnResult.reason);

  state.allItems = [...ghItems, ...hnItems, ...ytItems];
  state.lastUpdated = Date.now();

  refresh();
}

init().catch(err => {
  status.textContent = 'Failed to load. Check console for details.';
  console.error('AI Radar init failed:', err);
});
