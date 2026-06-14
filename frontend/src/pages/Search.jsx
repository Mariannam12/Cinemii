import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search as SearchIcon } from 'lucide-react';
import { searchMulti } from '../core/tmdb';
import { MovieCard } from '../components/movie/MovieCard';
import { MovieCardSkeleton } from '../components/ui/Skeleton';

export function Search() {
  const [params, setParams]   = useSearchParams();
  const q                     = params.get('q') || '';
  const [input, setInput]     = useState(q);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Keep input synced with URL (e.g. back/forward)
  useEffect(() => { setInput(q); }, [q]);

  useEffect(() => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    searchMulti(q)
      .then((data) => {
        setResults((data.results || []).filter(r => r.media_type !== 'person' && r.poster_path));
      })
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [q]);

  const submit = (e) => {
    e.preventDefault();
    setParams(input.trim() ? { q: input.trim() } : {});
  };

  return (
    <div className="min-h-screen bg-bg pt-24 pb-20">
      <div className="max-w-screen-2xl mx-auto px-6 md:px-10">
        {/* Search bar */}
        <form onSubmit={submit} className="relative mb-10 max-w-2xl">
          <SearchIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Search movies, TV shows…"
            autoFocus
            className="w-full glass rounded-2xl pl-12 pr-4 py-4 text-white placeholder:text-muted text-base focus:outline-none border border-white/10 focus:border-accent/40 transition"
          />
        </form>

        {/* Results */}
        {q && (
          <h1 className="text-xl font-bold text-white mb-6">
            {loading ? 'Searching…' : `Results for "${q}"`}
            {!loading && <span className="text-muted font-normal text-base ml-2">({results.length})</span>}
          </h1>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {loading
            ? Array.from({ length: 12 }).map((_, i) => <MovieCardSkeleton key={i} />)
            : results.map(r => (
                <MovieCard key={`${r.media_type}-${r.id}`} movie={r} mediaType={r.media_type} />
              ))
          }
        </div>

        {!loading && q && results.length === 0 && (
          <div className="text-center py-20 text-muted">
            <SearchIcon size={48} className="mx-auto mb-4 opacity-20" />
            <p className="font-semibold text-white">No results for "{q}"</p>
            <p className="text-sm mt-1">Try a different search term.</p>
          </div>
        )}

        {!q && (
          <div className="text-center py-20 text-muted">
            <SearchIcon size={48} className="mx-auto mb-4 opacity-20" />
            <p className="font-semibold text-white">Search Cinemii</p>
            <p className="text-sm mt-1">Find movies, TV shows and more.</p>
          </div>
        )}
      </div>
    </div>
  );
}
