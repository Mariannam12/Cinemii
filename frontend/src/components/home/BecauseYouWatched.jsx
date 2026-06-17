import { useState, useEffect } from 'react';
import { Clapperboard } from 'lucide-react';
import { MovieSection } from './MovieSection';
import { api, isLoggedIn } from '../../core/backend';
import { fetchMovie, discoverMovies } from '../../core/tmdb';

// "Because you watched X" — seeded from the user's most recent activity.
export function BecauseYouWatched({ onWatchClick }) {
  const [seed, setSeed]     = useState(null);   // { title }
  const [movies, setMovies] = useState([]);
  const [loading, setLoad]  = useState(true);

  useEffect(() => {
    if (!isLoggedIn()) { setLoad(false); return; }
    let cancelled = false;

    (async () => {
      try {
        // Pick a seed: most recent in-progress, else most recent favorite.
        let seedItem = null;
        const prog = await api.listProgress().catch(() => []);
        const movieProg = (prog || []).filter(p => p.media_type === 'movie' && p.media_id);
        if (movieProg.length) seedItem = movieProg[0];
        if (!seedItem) {
          const favs = await api.listFavorites().catch(() => []);
          const movieFav = (favs || []).filter(f => f.media_type === 'movie' && f.media_id);
          if (movieFav.length) seedItem = movieFav[0];
        }
        if (!seedItem) { if (!cancelled) setLoad(false); return; }

        const detail = await fetchMovie(seedItem.media_id);
        const genres = (detail.genres || []).slice(0, 2).map(g => g.id).join('|');
        const data = await discoverMovies({ with_genres: genres, 'vote_average.gte': 6 });
        const results = (data.results || [])
          .filter(m => m.poster_path && String(m.id) !== String(seedItem.media_id))
          .slice(0, 14);

        if (!cancelled) {
          setSeed({ title: detail.title || seedItem.title });
          setMovies(results);
          setLoad(false);
        }
      } catch { if (!cancelled) setLoad(false); }
    })();

    return () => { cancelled = true; };
  }, []);

  if (!isLoggedIn() || (!loading && (!seed || movies.length === 0))) return null;

  return (
    <MovieSection
      title={seed ? `Because you watched ${seed.title}` : 'Because you watched…'}
      icon={Clapperboard}
      movies={movies}
      loading={loading}
      onWatchClick={onWatchClick}
    />
  );
}
