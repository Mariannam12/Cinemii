import { useRef, memo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MovieCard } from '../movie/MovieCard';
import { MovieCardSkeleton } from '../ui/Skeleton';

const SKELETONS = Array.from({ length: 7 });

export const MovieSection = memo(function MovieSection({
  title, icon: Icon, movies = [], loading = false, onWatchClick, mediaType = 'movie', sectionRef, onSeeAll,
}) {
  const rowRef = useRef(null);
  const scroll = (dir) => rowRef.current?.scrollBy({ left: dir * 640, behavior: 'smooth' });

  return (
    <section ref={sectionRef} className="group/section">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <button
          onClick={onSeeAll}
          className="flex items-center gap-2.5 group/title"
          disabled={!onSeeAll}
        >
          {Icon && (
            <span className="w-7 h-7 rounded-lg bg-accent/15 flex items-center justify-center flex-shrink-0">
              <Icon size={16} className="text-accent" />
            </span>
          )}
          <h2 className="text-xl font-extrabold text-white tracking-tight">{title}</h2>
          {onSeeAll && (
            <span className="flex items-center gap-0.5 text-accent text-xs font-semibold opacity-0 -translate-x-2 group-hover/section:opacity-100 group-hover/section:translate-x-0 transition-all duration-300">
              Explore all <ChevronRight size={13} />
            </span>
          )}
        </button>

        <div className="flex gap-2 opacity-0 group-hover/section:opacity-100 transition-opacity duration-200">
          <button onClick={() => scroll(-1)} className="w-8 h-8 rounded-full glass flex items-center justify-center text-white hover:bg-white/15 transition" aria-label="Scroll left"><ChevronLeft size={16} /></button>
          <button onClick={() => scroll(1)}  className="w-8 h-8 rounded-full glass flex items-center justify-center text-white hover:bg-white/15 transition" aria-label="Scroll right"><ChevronRight size={16} /></button>
        </div>
      </div>

      {/* Row */}
      <div ref={rowRef} className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
        {loading
          ? SKELETONS.map((_, i) => (
              <div key={i} className="flex-shrink-0 w-40 sm:w-44">
                <MovieCardSkeleton />
              </div>
            ))
          : movies.map((movie) => (
              <div key={movie.id} className="flex-shrink-0 w-40 sm:w-44">
                <MovieCard movie={movie} mediaType={mediaType} onWatchClick={onWatchClick} />
              </div>
            ))}
      </div>
    </section>
  );
});
