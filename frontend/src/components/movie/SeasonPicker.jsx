import { useState, useEffect } from 'react';
import { ChevronDown, Play, Calendar } from 'lucide-react';
import { fetchTVSeason, imgUrl } from '../../core/tmdb';
import { Skeleton } from '../ui/Skeleton';

export function SeasonPicker({ tvId, seasons, onPlay }) {
  const [selected, setSelected]   = useState(seasons[0]?.season_number ?? 1);
  const [episodes, setEpisodes]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [open, setOpen]           = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchTVSeason(tvId, selected)
      .then((data) => { if (!cancelled) setEpisodes(data.episodes || []); })
      .catch(() => { if (!cancelled) setEpisodes([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [tvId, selected]);

  const current = seasons.find(s => s.season_number === selected);

  return (
    <div>
      {/* Header with season dropdown */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-white">Episodes</h2>
        <div className="relative">
          <button
            onClick={() => setOpen(o => !o)}
            className="flex items-center gap-2 glass rounded-xl px-4 py-2 text-white text-sm font-semibold hover:bg-white/10 transition"
          >
            {current?.name || `Season ${selected}`}
            <ChevronDown size={15} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
          {open && (
            <div className="absolute right-0 top-full mt-2 w-48 glass-dark rounded-xl shadow-xl overflow-hidden z-20 max-h-64 overflow-y-auto border border-white/5">
              {seasons.map(s => (
                <button
                  key={s.id}
                  onClick={() => { setSelected(s.season_number); setOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition flex items-center justify-between ${s.season_number === selected ? 'text-accent bg-accent/10' : 'text-white hover:bg-white/5'}`}
                >
                  <span>{s.name}</span>
                  <span className="text-muted text-xs">{s.episode_count} ep</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Episode list */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {episodes.map(ep => (
            <button
              key={ep.id}
              onClick={onPlay}
              className="flex gap-4 glass rounded-xl p-3 text-left hover:bg-white/5 transition group"
            >
              {/* Thumbnail */}
              <div className="relative w-36 h-20 rounded-lg overflow-hidden bg-surface flex-shrink-0">
                {ep.still_path
                  ? <img src={imgUrl(ep.still_path, 'w300')} alt={ep.name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-muted text-xs">No preview</div>
                }
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                  <Play size={24} className="text-white" fill="white" />
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 py-0.5">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-accent font-bold text-sm">E{ep.episode_number}</span>
                  <span className="text-white font-semibold text-sm line-clamp-1">{ep.name}</span>
                </div>
                <p className="text-muted text-xs line-clamp-2 mb-1">{ep.overview || 'No description available.'}</p>
                <div className="flex items-center gap-3 text-muted text-xs">
                  {ep.air_date && <span className="flex items-center gap-1"><Calendar size={11} /> {ep.air_date}</span>}
                  {ep.vote_average > 0 && <span>★ {ep.vote_average.toFixed(1)}</span>}
                  {ep.runtime && <span>{ep.runtime}m</span>}
                </div>
              </div>
            </button>
          ))}
          {episodes.length === 0 && (
            <p className="text-muted text-sm text-center py-8">No episode information available for this season.</p>
          )}
        </div>
      )}
    </div>
  );
}
