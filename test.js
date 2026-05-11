import { sortItems, filterItems, mockYouTube } from './data.js';
import { buildCard, renderCards } from './ui.js';

// ── Test harness ─────────────────────────────────────────────────────────────

const results = document.getElementById('results');
let passed = 0;
let failed = 0;

function section(name) {
  const h2 = document.createElement('h2');
  h2.textContent = name;
  results.appendChild(h2);
}

function assert(label, condition, detail = '') {
  const p = document.createElement('p');
  if (condition) {
    passed++;
    p.className = 'pass';
    p.textContent = `✓ ${label}`;
  } else {
    failed++;
    p.className = 'fail';
    p.textContent = `✗ ${label}`;
    if (detail) {
      const pre = document.createElement('pre');
      pre.textContent = detail;
      p.appendChild(pre);
    }
  }
  results.appendChild(p);
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

const makeItem = (overrides) => ({
  id: 'test-1',
  source: 'github',
  title: 'Test Item',
  description: 'A test item',
  url: 'https://example.com',
  growthValue: 100,
  growthLabel: '⭐ 100 stars',
  popularityValue: 500,
  date: new Date('2025-05-08'),
  ...overrides,
});

// ── sortItems ─────────────────────────────────────────────────────────────────

section('sortItems');

{
  const items = [
    makeItem({ id: 'a', growthValue: 100 }),
    makeItem({ id: 'b', growthValue: 300 }),
    makeItem({ id: 'c', growthValue: 50 }),
  ];
  const sorted = sortItems(items, 'growth');
  assert(
    'sorts by growthValue descending: [300, 100, 50]',
    sorted[0].growthValue === 300 &&
    sorted[1].growthValue === 100 &&
    sorted[2].growthValue === 50,
    `got: ${sorted.map(i => i.growthValue).join(', ')}`
  );
}

{
  const items = [
    makeItem({ id: 'a', date: new Date('2025-05-08') }),
    makeItem({ id: 'b', date: new Date('2025-05-10') }),
    makeItem({ id: 'c', date: new Date('2025-05-07') }),
  ];
  const sorted = sortItems(items, 'date');
  assert(
    'sorts by date descending (newest first): May 10, May 8, May 7',
    sorted[0].date.toISOString().startsWith('2025-05-10') &&
    sorted[1].date.toISOString().startsWith('2025-05-08') &&
    sorted[2].date.toISOString().startsWith('2025-05-07'),
    `got: ${sorted.map(i => i.date.toISOString().slice(0, 10)).join(', ')}`
  );
}

{
  const items = [
    makeItem({ id: 'a', popularityValue: 500 }),
    makeItem({ id: 'b', popularityValue: 200 }),
    makeItem({ id: 'c', popularityValue: 800 }),
  ];
  const sorted = sortItems(items, 'popularity');
  assert(
    'sorts by popularityValue descending: [800, 500, 200]',
    sorted[0].popularityValue === 800 &&
    sorted[1].popularityValue === 500 &&
    sorted[2].popularityValue === 200,
    `got: ${sorted.map(i => i.popularityValue).join(', ')}`
  );
}

{
  const items = [
    makeItem({ id: 'a', growthValue: 100 }),
    makeItem({ id: 'b', growthValue: 300 }),
    makeItem({ id: 'c', growthValue: 50 }),
  ];
  const firstId = items[0].id;
  sortItems(items, 'growth');
  assert(
    'does not mutate original array',
    items[0].id === firstId,
    `expected first id to still be '${firstId}', got '${items[0].id}'`
  );
}

// ── filterItems ───────────────────────────────────────────────────────────────

section('filterItems');

{
  const items = [
    makeItem({ id: 'a', title: 'GPT-5 Released', description: 'New model' }),
    makeItem({ id: 'b', title: 'Gemini Ultra vs GPT', description: 'Benchmark results' }),
    makeItem({ id: 'c', title: 'Claude 3.5 Sonnet', description: 'Anthropic model' }),
  ];
  const filtered = filterItems(items, 'gpt');
  assert(
    'matches title case-insensitively: query "gpt" finds 2 items',
    filtered.length === 2 &&
    filtered.some(i => i.id === 'a') &&
    filtered.some(i => i.id === 'b'),
    `got ${filtered.length} item(s): ${filtered.map(i => i.title).join(', ')}`
  );
}

{
  const items = [
    makeItem({ id: 'a', title: 'Run Models Offline', description: 'Local LLM runtime' }),
    makeItem({ id: 'b', title: 'Cloud GPT Hosting', description: 'Scalable cloud inference' }),
  ];
  const result = filterItems(items, 'local');
  assert(
    'matches description: query "local" finds item with "Local LLM runtime"',
    result.length === 1 && result[0].id === 'a',
    `got ${result.length} item(s): ${result.map(i => i.description).join(', ')}`
  );
}

{
  const items = [
    makeItem({ id: 'a', title: 'Alpha' }),
    makeItem({ id: 'b', title: 'Beta' }),
    makeItem({ id: 'c', title: 'Gamma' }),
  ];
  const result = filterItems(items, '');
  assert(
    'empty query returns all items',
    result.length === 3,
    `expected 3, got ${result.length}`
  );
}

{
  const items = [
    makeItem({ id: 'a', title: 'Alpha', description: 'First' }),
    makeItem({ id: 'b', title: 'Beta', description: 'Second' }),
  ];
  const result = filterItems(items, 'zzznomatch');
  assert(
    'no-match query returns empty array',
    result.length === 0,
    `expected 0, got ${result.length}`
  );
}

// ── mockYouTube ───────────────────────────────────────────────────────────────

section('mockYouTube');

{
  const items = mockYouTube();
  assert(
    'returns at least 5 items',
    items.length >= 5,
    `got ${items.length}`
  );
}

{
  const items = mockYouTube();
  const allValid = items.every(
    item =>
      typeof item.id === 'string' &&
      item.source === 'youtube' &&
      typeof item.title === 'string' &&
      item.date instanceof Date
  );
  const bad = items.filter(
    item =>
      typeof item.id !== 'string' ||
      item.source !== 'youtube' ||
      typeof item.title !== 'string' ||
      !(item.date instanceof Date)
  );
  assert(
    'all items have required shape: id (string), source === "youtube", title (string), date instanceof Date',
    allValid,
    `failing items: ${JSON.stringify(bad.map(i => i.id))}`
  );
}

{
  const items = mockYouTube();
  const allPositive = items.every(item => item.growthValue > 0);
  const bad = items.filter(item => item.growthValue <= 0);
  assert(
    'all items have growthValue > 0',
    allPositive,
    `items with non-positive growthValue: ${JSON.stringify(bad.map(i => ({ id: i.id, growthValue: i.growthValue })))}`
  );
}

{
  const items = mockYouTube();
  const allEmpty = items.every(item => item.url === '');
  const bad = items.filter(item => item.url !== '');
  assert(
    'all items have url === "" (YouTube URL placeholder)',
    allEmpty,
    `items with non-empty url: ${JSON.stringify(bad.map(i => ({ id: i.id, url: i.url })))}`
  );
}

// ── buildCard XSS safety ──────────────────────────────────────────────────────

section('buildCard — XSS safety');

{
  const card = buildCard(makeItem({ title: '<script>alert(1)</script>' }));
  assert(
    'escapes <script> in title: raw "<script>" not present in innerHTML',
    !card.innerHTML.includes('<script>'),
    `innerHTML contained literal <script>:\n${card.innerHTML.slice(0, 200)}`
  );
}

{
  const card = buildCard(makeItem({ description: '<img src=x onerror=alert(1)>' }));
  // escHtml converts < to &lt;, so the img tag must not appear as a real tag.
  // The word "onerror" will still be present as escaped text — that is correct.
  // The dangerous case is an unescaped <img tag in the DOM, not the word "onerror".
  assert(
    'escapes onerror in description: <img tag not injected as real element',
    card.querySelector('img') === null && !card.innerHTML.includes('<img'),
    `found real <img> or unescaped tag:\n${card.innerHTML.slice(0, 200)}`
  );
}

{
  const card = buildCard(makeItem({ url: 'javascript:alert(1)' }));
  const link = card.querySelector('a.card-link');
  assert(
    'javascript: URL is sanitised: link renders with href="#"',
    link !== null && link.getAttribute('href') === '#',
    link === null
      ? 'no link rendered (expected link with href="#")'
      : `href was: ${link.getAttribute('href')}`
  );
}

{
  const card = buildCard(makeItem({ source: '<evil>' }));
  assert(
    'unknown source renders escaped fallback: literal "<evil>" not in innerHTML',
    !card.innerHTML.includes('<evil>'),
    `innerHTML contained literal <evil>:\n${card.innerHTML.slice(0, 200)}`
  );
}

// ── renderCards ───────────────────────────────────────────────────────────────

section('renderCards');

{
  const grid = document.createElement('div');
  renderCards(grid, []);
  const emptyEl = grid.querySelector('.empty-state');
  assert(
    'empty array renders .empty-state element',
    emptyEl !== null,
    `grid innerHTML: ${grid.innerHTML.slice(0, 200)}`
  );
}

{
  const grid = document.createElement('div');
  const items = [
    makeItem({ id: 'a', title: 'Item A' }),
    makeItem({ id: 'b', title: 'Item B' }),
    makeItem({ id: 'c', title: 'Item C' }),
  ];
  renderCards(grid, items);
  const cards = grid.querySelectorAll('.card');
  assert(
    'non-empty array renders correct number of .card elements (3)',
    cards.length === 3,
    `expected 3 .card elements, got ${cards.length}`
  );
}

// ── Summary ───────────────────────────────────────────────────────────────────

const summary = document.createElement('p');
summary.style.marginTop = '24px';
summary.style.fontWeight = 'bold';
summary.style.fontSize = '1rem';
const total = passed + failed;
summary.textContent = `${passed} passed, ${failed} failed (${total} total)`;
summary.style.color = failed === 0 ? '#3fb950' : '#f85149';
results.appendChild(summary);
