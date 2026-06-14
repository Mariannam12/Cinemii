import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Radio, Users, Plus, Play, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '../../core/backend';
import { backdropUrl, imgUrl } from '../../core/tmdb';

export function LiveStreams() {
  const [rooms, setRooms] = useState([]);
  const navigate          = useNavigate();
  const rowRef            = useRef(null);

  const load = useCallback(() => {
    api.listRooms().then(d => setRooms(d.rooms || [])).catch(() => {});
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 10000); // refresh every 10s
    return () => clearInterval(t);
  }, [load]);

  const scroll = (dir) => rowRef.current?.scrollBy({ left: dir * 600, behavior: 'smooth' });

  return (
    <section>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2.5">
          <span className="relative flex items-center justify-center w-6 h-6">
            <span className="absolute w-6 h-6 rounded-full bg-accent/20 animate-ping" />
            <Radio size={18} className="text-accent relative" />
          </span>
          <h2 className="text-lg font-bold text-white">Live Streams</h2>
          {rooms.length > 0 && (
            <span className="text-xs font-semibold text-accent bg-accent/10 px-2 py-0.5 rounded-full">
              {rooms.length} live
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/room')} className="text-sm text-muted hover:text-white transition font-medium hidden sm:block">See All</button>
          <button onClick={() => scroll(-1)} className="w-8 h-8 rounded-full glass flex items-center justify-center text-white hover:bg-white/10 transition"><ChevronLeft size={16} /></button>
          <button onClick={() => scroll(1)}  className="w-8 h-8 rounded-full glass flex items-center justify-center text-white hover:bg-white/10 transition"><ChevronRight size={16} /></button>
        </div>
      </div>

      {/* Cards */}
      <div ref={rowRef} className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
        {/* Go Live CTA card */}
        <button
          onClick={() => navigate('/room')}
          className="flex-shrink-0 w-72 rounded-2xl overflow-hidden bg-surface ring-1 ring-white/10 hover:ring-accent/50 transition group text-left"
        >
          <div className="relative h-40 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-accent/20 via-surface to-surface">
            <div className="w-14 h-14 rounded-2xl gradient-accent flex items-center justify-center shadow-lg shadow-accent/30 group-hover:scale-110 transition-transform">
              <Plus size={26} className="text-white" />
            </div>
            <p className="text-white font-bold">Start Watching Together</p>
          </div>
          <div className="px-4 py-3">
            <p className="text-white text-sm font-semibold">Host your own stream</p>
            <p className="text-muted text-xs mt-0.5">Create a room and invite friends</p>
          </div>
        </button>

        {/* Active room cards */}
        {rooms.map(room => {
          const movie = room.movie;
          const thumb = movie?.backdrop_path ? backdropUrl(movie.backdrop_path)
                      : movie?.poster_path   ? imgUrl(movie.poster_path, 'w500')
                      : null;
          return (
            <button
              key={room.code}
              onClick={() => navigate(`/room?code=${room.code}`)}
              className="flex-shrink-0 w-72 rounded-2xl overflow-hidden bg-surface ring-1 ring-white/10 hover:ring-accent/50 transition group text-left"
            >
              {/* Thumbnail */}
              <div className="relative h-40 bg-black overflow-hidden">
                {thumb
                  ? <img src={thumb} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  : <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900/40 to-surface"><Play size={30} className="text-white/40" /></div>
                }
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />

                {/* LIVE badge */}
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 bg-accent rounded-md px-2 py-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  <span className="text-white text-[11px] font-bold tracking-wide">LIVE</span>
                </div>

                {/* Viewer count */}
                <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-black/70 backdrop-blur-sm rounded-md px-2 py-1">
                  <Users size={12} className="text-white" />
                  <span className="text-white text-[11px] font-bold">{room.viewers}</span>
                </div>

                {/* Play overlay on hover */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                  <div className="w-12 h-12 rounded-full bg-accent/90 flex items-center justify-center">
                    <Play size={22} className="text-white ml-0.5" fill="white" />
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="px-4 py-3 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full gradient-accent flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {room.host?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="min-w-0">
                  <p className="text-white text-sm font-semibold truncate">
                    {movie?.title || 'Picking a movie…'}
                  </p>
                  <p className="text-muted text-xs truncate">hosted by {room.host}</p>
                </div>
              </div>
            </button>
          );
        })}

        {/* Empty hint when no rooms */}
        {rooms.length === 0 && (
          <div className="flex-shrink-0 flex items-center px-6 text-muted text-sm">
            No live streams right now — be the first to go live!
          </div>
        )}
      </div>
    </section>
  );
}
