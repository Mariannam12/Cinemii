import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { searchMulti, imgUrl } from '../../core/tmdb';

export function SearchOverlay({ onClose }) {
  const [query, setQuery]     = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef              = useRef(null);
  const navigate              = useNavigate();
  const debounceRef           = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', h); document.body.style.overflow = ''; };
  }, [onClose]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!query.trim()) { setResults([]); return; }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await searchMulti(query);
        setResults((data.results || []).filter((r) => r.media_type !== 'person').slice(0, 10));
      } catch { /* silent */ }
      setLoading(false);
    }, 300);
  }, [query]);

  const goTo = (result) => {
    onClose();
    const type = result.media_type === 'tv' ? 'tv' : 'movie';
    navigate(`/${type}/${result.id}`);
  };

  const submit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    onClose();
    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <div
      className="fixed inset-0 z-[9997] bg-black/80 backdrop-blur-md flex flex-col items-center pt-24 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-2xl">
        {/* Search input */}
        <form onSubmit={submit} className="relative mb-2">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search movies, TV shows…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full glass-dark rounded-2xl pl-12 pr-12 py-4 text-white placeholder:text-muted text-base focus:outline-none border border-white/10 focus:border-accent/40 transition"
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-white">
              <X size={18} />
            </button>
          )}
        </form>
        <p className="text-muted text-xs mb-4 px-1">Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white">Enter</kbd> to see all results</p>

        {/* Results */}
        {loading && (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {!loading && results.length > 0 && (
          <div className="glass-dark rounded-2xl overflow-hidden divide-y divide-white/5">
            {results.map((r) => {
              const title   = r.title || r.name || 'Untitled';
              const year    = (r.release_date || r.first_air_date || '').slice(0, 4);
              const poster  = imgUrl(r.poster_path, 'w92');
              const type    = r.media_type === 'tv' ? 'TV Show' : 'Movie';
              return (
                <button
                  key={r.id}
                  onClick={() => goTo(r)}
                  className="w-full flex items-center gap-4 px-4 py-3 hover:bg-white/5 transition text-left"
                >
                  <div className="w-10 h-14 rounded-lg overflow-hidden bg-surface flex-shrink-0">
                    {poster
                      ? <img src={poster} alt={title} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-muted text-xs">?</div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm truncate">{title}</p>
                    <p className="text-muted text-xs mt-0.5">{type}{year ? ` · ${year}` : ''}</p>
                  </div>
                  <span className="text-muted text-xs">›</span>
                </button>
              );
            })}
          </div>
        )}
        {!loading && query && results.length === 0 && (
          <div className="text-center py-10 text-muted">No results for "{query}"</div>
        )}
      </div>
    </div>
  );
}
