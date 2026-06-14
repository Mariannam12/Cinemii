import { useState } from 'react';
import { Star, Award, Clapperboard, Swords, Laugh, Rocket, Eye, Ghost, Tv } from 'lucide-react';
import { MovieSection } from '../components/home/MovieSection';
import { CinemaPlayer } from '../components/player/CinemaPlayer';
import { useTMDB } from '../hooks/useTMDB';
import {
  fetchPopular, fetchTopRated, fetchNowPlaying,
  fetchPopularTV, fetchByGenre,
} from '../core/tmdb';

function WatchPage({ title, subtitle, children, player, onClose }) {
  return (
    <div className="min-h-screen bg-bg pt-24 pb-20">
      <div className="max-w-screen-2xl mx-auto px-6 md:px-10 flex flex-col gap-14">
        <div>
          <h1 className="text-3xl font-black text-white mb-2">{title}</h1>
          {subtitle && <p className="text-muted text-sm">{subtitle}</p>}
        </div>
        {children}
      </div>
      {player && <CinemaPlayer {...player} onClose={onClose} />}
    </div>
  );
}

export function Movies() {
  const [player, setPlayer] = useState(null);
  const popular   = useTMDB(fetchPopular);
  const topRated  = useTMDB(fetchTopRated);
  const now       = useTMDB(fetchNowPlaying);
  const action    = useTMDB(() => fetchByGenre(28),  []);
  const comedy    = useTMDB(() => fetchByGenre(35),  []);
  const scifi     = useTMDB(() => fetchByGenre(878), []);
  const thriller  = useTMDB(() => fetchByGenre(53),  []);
  const horror    = useTMDB(() => fetchByGenre(27),  []);

  const handleWatch = (movie, type) =>
    setPlayer({ mediaType: type || 'movie', mediaId: String(movie.id), title: movie.title || movie.name || '' });

  return (
    <WatchPage title="Movies" subtitle="Browse the full catalog" player={player} onClose={() => setPlayer(null)}>
      <MovieSection title="Popular"    icon={Star}        movies={popular.data?.results  || []} loading={popular.loading}  onWatchClick={handleWatch} />
      <MovieSection title="Top Rated"  icon={Award}       movies={topRated.data?.results || []} loading={topRated.loading} onWatchClick={handleWatch} />
      <MovieSection title="Now Playing" icon={Clapperboard} movies={now.data?.results    || []} loading={now.loading}      onWatchClick={handleWatch} />
      <MovieSection title="Action"     icon={Swords}      movies={action.data?.results   || []} loading={action.loading}   onWatchClick={handleWatch} />
      <MovieSection title="Comedy"     icon={Laugh}       movies={comedy.data?.results   || []} loading={comedy.loading}   onWatchClick={handleWatch} />
      <MovieSection title="Sci-Fi"     icon={Rocket}      movies={scifi.data?.results    || []} loading={scifi.loading}    onWatchClick={handleWatch} />
      <MovieSection title="Thriller"   icon={Eye}         movies={thriller.data?.results || []} loading={thriller.loading} onWatchClick={handleWatch} />
      <MovieSection title="Horror"     icon={Ghost}       movies={horror.data?.results   || []} loading={horror.loading}   onWatchClick={handleWatch} />
    </WatchPage>
  );
}

export function TVShows() {
  const [player, setPlayer] = useState(null);
  const tv = useTMDB(fetchPopularTV);
  const handleWatch = (movie) =>
    setPlayer({ mediaType: 'tv', mediaId: String(movie.id), title: movie.name || '' });

  return (
    <WatchPage title="TV Shows" subtitle="Binge-worthy series" player={player} onClose={() => setPlayer(null)}>
      <MovieSection title="Popular TV Shows" icon={Tv} movies={tv.data?.results || []} loading={tv.loading} mediaType="tv" onWatchClick={handleWatch} />
    </WatchPage>
  );
}

export function TopRated() {
  const [player, setPlayer] = useState(null);
  const movies = useTMDB(fetchTopRated);
  const handleWatch = (movie, type) =>
    setPlayer({ mediaType: type || 'movie', mediaId: String(movie.id), title: movie.title || '' });

  return (
    <WatchPage title="Top Rated" subtitle="The highest-rated films of all time" player={player} onClose={() => setPlayer(null)}>
      <MovieSection title="Top Rated All Time" icon={Award} movies={movies.data?.results || []} loading={movies.loading} onWatchClick={handleWatch} />
    </WatchPage>
  );
}
