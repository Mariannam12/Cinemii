// Vercel serverless TMDB proxy (single function).
// The TMDB path is passed via the `__p` query param by a vercel.json rewrite
// (e.g. /api/tmdb/search/multi?query=x -> /api/tmdb?__p=search/multi&query=x).
// Keeps the API key server-side; mirrors backend/routers/tmdb_proxy.py.

const TMDB_KEY = process.env.TMDB_API_KEY || '47729336f5fe1d690418538825a71879';
const TMDB_BASE = 'https://api.themoviedb.org/3';
const ALLOWED = ['trending', 'movie', 'tv', 'person', 'discover', 'search', 'genre'];

export default async function handler(req, res) {
  const p = (req.query.__p || '').replace(/^\/+/, '');
  const first = p.split('/')[0];

  if (!p || !ALLOWED.includes(first)) {
    res.status(403).json({ detail: 'Endpoint not allowed.' });
    return;
  }

  const url = new URL(`${TMDB_BASE}/${p}`);
  for (const [k, v] of Object.entries(req.query)) {
    if (k !== '__p' && k !== 'api_key') url.searchParams.set(k, v);
  }
  url.searchParams.set('api_key', TMDB_KEY);

  try {
    const upstream = await fetch(url.toString());
    const data = await upstream.json();
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    res.status(upstream.status).json(data);
  } catch (e) {
    res.status(502).json({ detail: 'TMDB upstream error.' });
  }
}
