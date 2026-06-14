import { useState, useEffect } from 'react';
import { api, isLoggedIn } from '../core/backend';
import { fetchRecsForMovie } from '../core/tmdb';

export function usePersonalizedRecs() {
  const [movies,  setMovies]  = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) return;
    setLoading(true);

    api.listFavorites()
      .then(async (favs) => {
        const movieFavs = (favs || []).filter(f => f.media_type === 'movie').slice(0, 4);
        if (!movieFavs.length) return;

        const results = await Promise.allSettled(
          movieFavs.map(f => fetchRecsForMovie(f.media_id))
        );

        const seen = new Set(movieFavs.map(f => String(f.media_id)));
        const combined = [];

        for (const r of results) {
          if (r.status === 'fulfilled') {
            for (const m of (r.value?.results || [])) {
              if (!seen.has(String(m.id)) && m.poster_path) {
                seen.add(String(m.id));
                combined.push(m);
              }
            }
          }
        }

        // Sort by vote_average descending, take top 20
        combined.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
        setMovies(combined.slice(0, 20));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { movies, loading };
}
