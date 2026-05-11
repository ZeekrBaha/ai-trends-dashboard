// Normalised item shape used throughout the app:
// { id, source, title, description, url, growthValue, growthLabel, popularityValue, date }

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export async function fetchGitHub() {
  const since = new Date(Date.now() - ONE_WEEK_MS).toISOString().slice(0, 10);
  const queries = [
    `topic:machine-learning+topic:ai+created:>${since}`,
    `topic:llm+stars:>50+created:>${since}`,
  ];

  const results = await Promise.allSettled(
    queries.map(q =>
      fetch(
        `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&sort=stars&order=desc&per_page=10`,
        { headers: { Accept: 'application/vnd.github+json' } }
      ).then(r => {
        if (r.status === 403 || r.status === 429) throw new Error('RATE_LIMITED');
        if (!r.ok) throw new Error(`GitHub API ${r.status}`);
        return r.json();
      })
    )
  );

  const allRateLimited = results.every(
    r => r.status === 'rejected' && r.reason?.message === 'RATE_LIMITED'
  );
  if (allRateLimited) {
    const err = new Error('GitHub API rate limit reached. Add a GITHUB_TOKEN to lift it.');
    err.code = 'RATE_LIMITED';
    throw err;
  }

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
        growthLabel: `⭐ ${fmtNum(repo.stargazers_count)} total stars`,
        popularityValue: repo.stargazers_count,
        date: new Date(repo.pushed_at ?? repo.created_at),
      });
    }
  }

  return items;
}

export async function fetchHackerNews() {
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
  } else {
    console.warn(`sortItems: unknown sortKey "${sortKey}"`);
  }
  return copy;
}

export function filterItems(items, query) {
  if (!query.trim()) return items;
  const q = query.toLowerCase();
  return items.filter(
    item =>
      (item.title ?? '').toLowerCase().includes(q) ||
      (item.description ?? '').toLowerCase().includes(q)
  );
}

function fmtNum(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
  return String(n);
}
