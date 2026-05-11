# AI Trends Dashboard

Single-page dashboard tracking AI trends over the last 7 days from GitHub, HackerNews, and YouTube.

## Features

- **3 live sources**: GitHub trending AI/ML repos (GitHub Search API), HackerNews top AI stories (Algolia API), mock YouTube AI videos
- **4 tabs**: Overview (all sources), GitHub, YouTube, HackerNews
- **Search**: filter across all sources simultaneously
- **Sort**: by growth rate, date, or popularity
- **Dark / light theme** toggle
- **No build step**: open `index.html` directly in a browser

## Run

```bash
open index.html
# or serve locally:
npx serve .
```

## Test

```bash
open test.html
```

All 18 tests run in the browser. Results shown inline with pass/fail colours.

## Add real YouTube data

YouTube currently shows mock data. To wire up real results:

1. Get a key from [Google Cloud Console → YouTube Data API v3](https://console.cloud.google.com/)
2. In `data.js`, replace `mockYouTube()` with:

```js
export async function fetchYouTube(apiKey) {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/search?part=snippet&q=artificial+intelligence&type=video&order=viewCount&publishedAfter=${since}&maxResults=20&key=${apiKey}`
  );
  if (!res.ok) throw new Error(`YouTube API ${res.status}`);
  const data = await res.json();
  return data.items.map(v => ({
    id: `yt-${v.id.videoId}`,
    source: 'youtube',
    title: v.snippet.title,
    description: `by ${v.snippet.channelTitle}`,
    url: `https://www.youtube.com/watch?v=${v.id.videoId}`,
    growthValue: 0,         // viewCount requires a Statistics request
    growthLabel: '📺 trending',
    popularityValue: 0,
    date: new Date(v.snippet.publishedAt),
  }));
}
```

3. In `app.js`, call `fetchYouTube(YOUR_KEY)` alongside the other fetches in `init()`.

## File structure

```
ai-radar/
├── index.html    # App shell — header, tabs, search, sort, card grid
├── style.css     # Dark/light themes via CSS custom properties
├── app.js        # State management, event wiring
├── data.js       # Fetch functions and data transformations
├── ui.js         # Card renderer (XSS-safe)
├── test.html     # Test runner
└── test.js       # 18 browser-native unit tests
```
