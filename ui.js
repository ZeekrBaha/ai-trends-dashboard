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
  }[item.source] ?? escHtml(String(item.source));

  const dateMs = item.date instanceof Date ? item.date.getTime() : Date.parse(item.date ?? 0);
  const daysAgo = Math.max(0, Math.round((Date.now() - dateMs) / (1000 * 60 * 60 * 24)));
  const dateLabel = daysAgo === 0 ? 'today' : daysAgo === 1 ? '1 day ago' : `${daysAgo} days ago`;

  card.innerHTML = `
    <div class="card-header">
      <span class="card-title">${escHtml(item.title)}</span>
      <span class="badge ${badgeClass}">${badgeLabel}</span>
    </div>
    ${item.description ? `<p class="card-description">${escHtml(item.description)}</p>` : ''}
    <div class="card-meta">
      <span class="card-growth">${escHtml(item.growthLabel)}</span>
    </div>
    <div class="card-footer">
      <span class="card-date">${dateLabel}</span>
      ${item.url ? `<a class="card-link" href="${escAttr(item.url)}" target="_blank" rel="noopener noreferrer">Open →</a>` : ''}
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

/**
 * Render a styled empty-state message with optional links.
 * Accepts plain text only — links are passed as descriptors and built safely.
 *
 * @param {HTMLElement} grid
 * @param {string} message - plain text message (not HTML)
 * @param {{ label: string, href: string }[]} [links] - optional action links
 */
export function renderEmptyState(grid, message, links = []) {
  grid.replaceChildren();
  const el = document.createElement('div');
  el.className = 'empty-state';

  const msg = document.createElement('p');
  msg.textContent = message;
  el.appendChild(msg);

  for (const { label, href } of links) {
    const safeHref = /^https?:\/\//i.test(href) ? href : '#';
    const a = document.createElement('a');
    a.href = safeHref;
    a.textContent = label;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.style.color = 'var(--accent)';
    a.style.display = 'block';
    a.style.marginTop = '8px';
    el.appendChild(a);
  }

  grid.appendChild(el);
}

export function renderSkeletons(grid, count = 6) {
  grid.replaceChildren();
  const fragment = document.createDocumentFragment();
  for (let i = 0; i < count; i++) {
    const card = document.createElement('div');
    card.className = 'skeleton-card';
    card.innerHTML = `
      <div class="skeleton-line" style="height:16px;width:60%"></div>
      <div class="skeleton-line" style="height:12px;width:90%"></div>
      <div class="skeleton-line" style="height:12px;width:75%"></div>
      <div class="skeleton-line" style="height:12px;width:40%"></div>
    `;
    fragment.appendChild(card);
  }
  grid.appendChild(fragment);
}

function escHtml(str) {
  // Note: ' not escaped — safe for innerHTML/double-quoted attributes; don't use in event handler attrs
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
  return encodeURI(s).replace(/'/g, '%27').replace(/`/g, '%60');
}
