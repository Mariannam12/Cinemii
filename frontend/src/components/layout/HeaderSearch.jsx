import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, CornerDownLeft } from 'lucide-react';
import { searchMulti, imgUrl } from '../../core/tmdb';

export function HeaderSearch() {
  const [query, setQuery]     = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [active, setActive]   = useState(-1);
  const wrapRef               = useRef(null);
  const inputRef              = useRef(null);
  const debounceRef           = useRef(null);
  const navigate              = useNavigate();

  // Close on outside click
  useEffect(() => {
    const h = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // Cmd/Ctrl+K focuses the inline input
  useEffect(() => {
    const h = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); inputRef.current?.focus(); setOpen(true); }
    };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    setActive(-1);
    if (!query.trim()) { setResults([]); setLoading(false); return; }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await searchMulti(query);
        setResults((data.results || []).filter(r => r.media_type !== 'person' && r.poster_path).slice(0, 6));
      } catch { setResults([]); }
      setLoading(false);
    }, 280);
  }, [query]);

  const goToResult = (r) => {
    setOpen(false);
    setQuery('');
    navigate(`/${r.media_type === 'tv' ? 'tv' : 'movie'}/${r.id}`);
  };

  const goToAll = () => {
    if (!query.trim()) return;
    setOpen(false);
    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    setQuery('');
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(a - 1, -1)); }
    else if (e.key === 'Enter') {
      if (active >= 0 && results[active]) goToResult(results[active]);
      else goToAll();
    } else if (e.key === 'Escape') { setOpen(false); inputRef.current?.blur(); }
  };

  return (
    <div ref={wrapRef} className="relative w-full">
      {/* Input */}
      <div className={`flex items-center gap-2.5 rounded-full px-4 h-10 transition-all duration-200 ${
        open ? 'bg-white/10 ring-2 ring-accent/40' : 'bg-white/5 ring-1 ring-white/10 hover:bg-white/[0.07]'
      }`}>
        <Search size={16} className={open ? 'text-accent' : 'text-muted'} />
        <input
          ref={inputRef}
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search movies, shows, people…"
          className="flex-1 bg-transparent text-white placeholder:text-muted text-sm focus:outline-none min-w-0"
        />
        {query ? (
          <button onClick={() => { setQuery(''); inputRef.current?.focus(); }} className="text-muted hover:text-white transition">
            <X size={15} />
          </button>
        ) : (
          <kbd className="hidden lg:flex items-center gap-0.5 text-[10px] text-muted/70 bg-white/5 px-1.5 py-0.5 rounded border border-white/10">
            ⌘K
          </kbd>
        )}
      </div>

      {/* Dropdown */}
      {open && query.trim() && (
        <div className="absolute top-full left-0 right-0 mt-2 glass-dark rounded-2xl shadow-2xl border border-white/10 overflow-hidden z-50">
          {loading && results.length === 0 && (
            <div className="flex items-center justify-center py-6">
              <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!loading && results.length === 0 && (
            <div className="px-4 py-6 text-center text-muted text-sm">No matches for "{query}"</div>
          )}

          {results.map((r, i) => {
            const title = r.title || r.name || 'Untitled';
            const year  = (r.release_date || r.first_air_date || '').slice(0, 4);
            return (
              <button
                key={`${r.media_type}-${r.id}`}
                onMouseEnter={() => setActive(i)}
                onClick={() => goToResult(r)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition ${active === i ? 'bg-white/10' : 'hover:bg-white/5'}`}
              >
                <img src={imgUrl(r.poster_path, 'w92')} alt={title} className="w-9 h-13 rounded-md object-cover bg-surface flex-shrink-0" style={{ height: '52px' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold truncate">{title}</p>
                  <p className="text-muted text-xs mt-0.5">
                    {r.media_type === 'tv' ? 'TV Show' : 'Movie'}{year ? ` · ${year}` : ''}
                    {r.vote_average > 0 && <span className="text-yellow-400"> · ★ {r.vote_average.toFixed(1)}</span>}
                  </p>
                </div>
              </button>
            );
          })}

          {/* See all */}
          {results.length > 0 && (
            <button
              onClick={goToAll}
              className="w-full flex items-center justify-between px-4 py-3 border-t border-white/5 text-sm text-accent hover:bg-white/5 transition font-medium"
            >
              <span>See all results for "{query}"</span>
              <CornerDownLeft size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
