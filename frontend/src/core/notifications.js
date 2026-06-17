// Real, data-driven notifications — no hardcoded demo entries.
// Built from live TMDB (new releases, trending) + the user's own watch progress.

import { fetchNowPlaying, fetchTrending } from './tmdb';
import { api, isLoggedIn } from './backend';

const READ_KEY = 'cinemii_notifs_read';

export function getReadSet() {
  try { return new Set(JSON.parse(localStorage.getItem(READ_KEY) || '[]')); }
  catch { return new Set(); }
}

export function markRead(ids) {
  const set = getReadSet();
  ids.forEach((i) => set.add(i));
  localStorage.setItem(READ_KEY, JSON.stringify([...set].slice(-200)));
}

export async function buildNotifications() {
  const out = [];

  try {
    const np = await fetchNowPlaying();
    (np.results || []).filter(m => m.poster_path).slice(0, 4).forEach((m) => {
      out.push({
        id: `new-${m.id}`, kind: 'new', title: 'New release',
        body: `${m.title} is now streaming`, poster: m.poster_path,
        ts: m.release_date ? Date.parse(m.release_date) : Date.now(),
        link: `/movie/${m.id}`,
      });
    });
  } catch { /* ignore */ }

  try {
    const tr = await fetchTrending();
    (tr.results || []).filter(m => m.poster_path).slice(0, 3).forEach((m) => {
      out.push({
        id: `trend-${m.id}`, kind: 'trend', title: 'Trending now',
        body: `${m.title || m.name} is trending this week`, poster: m.poster_path,
        ts: Date.now() - 3600 * 1000, link: `/movie/${m.id}`,
      });
    });
  } catch { /* ignore */ }

  if (isLoggedIn()) {
    try {
      const prog = await api.listProgress();
      (prog || [])
        .filter(p => p.position_seconds > 5 && (!p.duration_seconds || p.position_seconds < p.duration_seconds * 0.95))
        .slice(0, 4)
        .forEach((p) => {
          out.push({
            id: `cw-${p.media_type}-${p.media_id}`, kind: 'continue', title: 'Continue watching',
            body: `Pick up where you left off in ${p.title || 'your title'}`, poster: p.poster_path,
            ts: p.updated_at ? Date.parse(p.updated_at) : Date.now(),
            link: `/${p.media_type === 'tv' ? 'tv' : 'movie'}/${p.media_id}`,
          });
        });
    } catch { /* ignore */ }
  }

  // De-dup by id, newest first.
  const seen = new Set();
  return out
    .filter(n => (seen.has(n.id) ? false : seen.add(n.id)))
    .sort((a, b) => (b.ts || 0) - (a.ts || 0));
}

export function countUnread(list) {
  const read = getReadSet();
  return list.filter(n => !read.has(n.id)).length;
}
