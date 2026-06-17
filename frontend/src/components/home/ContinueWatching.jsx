import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, History, ChevronLeft, ChevronRight, X, Info } from 'lucide-react';
import { api, isLoggedIn } from '../../core/backend';
import { imgUrl } from '../../core/tmdb';

export function ContinueWatching({ onWatchClick }) {
  const [items, setItems] = useState([]);
  const navigate          = useNavigate();
  const rowRef            = useRef(null);

  const load = useCallback(() => {
    if (!isLoggedIn()) { setItems([]); return; }
    api.listProgress()
      .then(list => setItems(
        (list || [])
          .filter(p => p.position_seconds > 5 &&
            (!p.duration_seconds || p.position_seconds < p.duration_seconds * 0.95))
      ))
      .catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  if (!items.length) return null;

  const scroll = (d) => rowRef.current?.scrollBy({ left: d * 600, behavior: 'smooth' });

  const remove = async (e, item) => {
    e.stopPropagation();
    setItems(prev => prev.filter(p => !(p.media_type === item.media_type && p.media_id === item.media_id)));
    try { await api.saveProgress({ media_type: item.media_type, media_id: item.media_id, title: item.title, position_seconds: 0, duration_seconds: item.duration_seconds || 0 }); } catch { /* ignore */ }
  };

  return (
    <section className="group/section">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2.5">
          <span className="w-7 h-7 rounded-lg bg-accent/15 flex items-center justify-center">
            <History size={16} className="text-accent" />
          </span>
          <h2 className="text-xl font-extrabold text-white tracking-tight">Continue Watching</h2>
        </div>
        <div className="flex gap-2 opacity-0 group-hover/section:opacity-100 transition-opacity duration-200">
          <button onClick={() => scroll(-1)} className="w-8 h-8 rounded-full glass flex items-center justify-center text-white hover:bg-white/15 transition"><ChevronLeft size={16} /></button>
          <button onClick={() => scroll(1)}  className="w-8 h-8 rounded-full glass flex items-center justify-center text-white hover:bg-white/15 transition"><ChevronRight size={16} /></button>
        </div>
      </div>

      <div ref={rowRef} className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
        {items.map(item => {
          const pct = item.duration_seconds ? Math.min(100, (item.position_seconds / item.duration_seconds) * 100) : 8;
          const mins = Math.floor(item.position_seconds / 60);
          return (
            <div
              key={`${item.media_type}-${item.media_id}`}
              onClick={() => onWatchClick?.({ id: item.media_id, title: item.title }, item.media_type)}
              className="group/cw relative flex-shrink-0 w-44 cursor-pointer card-hover"
            >
              <div className="relative rounded-xl overflow-hidden aspect-[16/10] bg-surface ring-1 ring-white/5 group-hover/cw:ring-white/15 transition">
                {item.poster_path
                  ? <img src={imgUrl(item.poster_path, 'w500')} alt={item.title} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-muted">🎬</div>
                }
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

                {/* Play on hover */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/cw:opacity-100 transition">
                  <span className="w-11 h-11 rounded-full bg-white/95 text-black flex items-center justify-center shadow-lg">
                    <Play size={18} fill="currentColor" className="ml-0.5" />
                  </span>
                </div>

                {/* Remove */}
                <button onClick={(e) => remove(e, item)} title="Remove" className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover/cw:opacity-100 hover:bg-accent transition">
                  <X size={13} />
                </button>

                {/* Info */}
                <button onClick={(e) => { e.stopPropagation(); navigate(`/${item.media_type === 'tv' ? 'tv' : 'movie'}/${item.media_id}`); }} title="Details" className="absolute bottom-2 right-2 w-7 h-7 rounded-full bg-black/50 border border-white/30 text-white flex items-center justify-center opacity-0 group-hover/cw:opacity-100 hover:border-white transition">
                  <Info size={13} />
                </button>

                {/* Progress bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                  <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
                </div>
              </div>
              <p className="text-sm font-semibold text-white line-clamp-1 mt-2">{item.title}</p>
              <p className="text-xs text-muted mt-0.5">{mins}m watched</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
