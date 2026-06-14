import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { imgUrl } from '../../core/tmdb';
import { MovieCardSkeleton } from '../ui/Skeleton';

export function RankedRow({ title = 'Top 10 Today', movies = [], loading = false, mediaType = 'movie' }) {
  const rowRef   = useRef(null);
  const navigate = useNavigate();
  const top10    = movies.slice(0, 10);
  const scroll = (dir) => rowRef.current?.scrollBy({ left: dir * 640, behavior: 'smooth' });

  return (
    <section className="group/section">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2.5">
          <span className="w-7 h-7 rounded-lg bg-accent/15 flex items-center justify-center">
            <TrendingUp size={16} className="text-accent" />
          </span>
          <h2 className="text-xl font-extrabold text-white tracking-tight">{title}</h2>
        </div>
        <div className="flex gap-2 opacity-0 group-hover/section:opacity-100 transition-opacity duration-200">
          <button onClick={() => scroll(-1)} className="w-8 h-8 rounded-full glass flex items-center justify-center text-white hover:bg-white/15 transition"><ChevronLeft size={16} /></button>
          <button onClick={() => scroll(1)}  className="w-8 h-8 rounded-full glass flex items-center justify-center text-white hover:bg-white/15 transition"><ChevronRight size={16} /></button>
        </div>
      </div>

      <div ref={rowRef} className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-[260px] sm:w-[280px]"><MovieCardSkeleton /></div>
            ))
          : top10.map((movie, i) => {
              const title = movie.title || movie.name || '';
              const type  = movie.media_type || mediaType;
              return (
                <button
                  key={movie.id}
                  onClick={() => navigate(`/${type === 'tv' ? 'tv' : 'movie'}/${movie.id}`)}
                  className="flex-shrink-0 flex items-end group/rank relative h-44 sm:h-52 w-[230px] sm:w-[250px]"
                >
                  {/* Big rank number */}
                  <span
                    className="font-black leading-none select-none transition-transform duration-300 group-hover/rank:scale-105"
                    style={{
                      fontSize: '150px',
                      WebkitTextStroke: '3px rgba(255,255,255,0.22)',
                      color: 'transparent',
                      marginRight: '-26px',
                      lineHeight: 0.78,
                    }}
                  >
                    {i + 1}
                  </span>
                  {/* Poster */}
                  <div className="relative w-28 sm:w-32 h-full rounded-lg overflow-hidden ring-1 ring-white/10 flex-shrink-0 shadow-lg shadow-black/40">
                    {movie.poster_path
                      ? <img src={imgUrl(movie.poster_path, 'w342')} alt={title} loading="lazy" className="w-full h-full object-cover group-hover/rank:scale-105 transition-transform duration-300" />
                      : <div className="w-full h-full bg-surface" />
                    }
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover/rank:opacity-100 transition" />
                  </div>
                </button>
              );
            })}
      </div>
    </section>
  );
}
