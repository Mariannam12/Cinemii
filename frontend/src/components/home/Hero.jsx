import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Info } from 'lucide-react';
import { backdropUrl, imgUrl } from '../../core/tmdb';
import { HeroSkeleton } from '../ui/Skeleton';

const INTERVAL_MS = 7000;

export function Hero({ movies = [], loading = false, onWatchClick }) {
  const [idx, setIdx]           = useState(0);
  const [fading, setFading]     = useState(false);
  const navigate                = useNavigate();

  const goTo = useCallback((next) => {
    setFading(true);
    setTimeout(() => {
      setIdx(next);
      setFading(false);
    }, 400);
  }, []);

  useEffect(() => {
    if (!movies.length) return;
    const t = setInterval(() => {
      goTo((idx + 1) % movies.length);
    }, INTERVAL_MS);
    return () => clearInterval(t);
  }, [idx, movies.length, goTo]);

  if (loading || !movies.length) return <HeroSkeleton />;

  const movie    = movies[idx];
  const title    = movie.title || movie.name || '';
  const overview = movie.overview || '';
  const rating   = movie.vote_average?.toFixed(1);
  const year     = (movie.release_date || '').slice(0, 4);
  const backdrop = backdropUrl(movie.backdrop_path);
  const poster   = imgUrl(movie.poster_path, 'w342');

  return (
    <div className="relative w-full h-screen min-h-[600px] overflow-hidden">
      {/* Background */}
      <div
        className={`absolute inset-0 transition-opacity duration-500 ${fading ? 'opacity-0' : 'opacity-100'}`}
      >
        {backdrop && (
          <img
            src={backdrop}
            alt=""
            className="absolute inset-0 w-full h-full object-cover hero-zoom"
          />
        )}
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-bg/40 to-transparent" />
      </div>

      {/* Content */}
      <div className={`relative z-10 h-full flex items-center transition-opacity duration-400 ${fading ? 'opacity-0' : 'opacity-100'}`}>
        <div className="px-8 md:px-16 lg:px-24 max-w-3xl">
          {/* Label */}
          <div className="flex items-center gap-2 mb-4">
            <span className="w-8 h-0.5 bg-accent" />
            <span className="text-accent text-xs font-bold tracking-[0.2em] uppercase">Now Streaming</span>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-6xl font-black text-white leading-tight mb-4 drop-shadow-lg">
            {title}
          </h1>

          {/* Meta */}
          <div className="flex items-center gap-3 mb-5">
            {rating && (
              <span className="flex items-center gap-1 text-yellow-400 font-semibold text-sm">
                ★ {rating}
              </span>
            )}
            {year && <span className="text-muted text-sm">{year}</span>}
          </div>

          {/* Overview */}
          <p className="text-white/80 text-base leading-relaxed line-clamp-3 mb-8 max-w-xl">
            {overview}
          </p>

          {/* Buttons */}
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => onWatchClick && onWatchClick(movie, 'movie')}
              className="gradient-accent text-white font-bold px-8 py-3.5 rounded-xl hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-accent/30 flex items-center gap-2"
            >
              <Play size={18} fill="white" /> Watch Now
            </button>
            <button
              onClick={() => navigate(`/movie/${movie.id}`)}
              className="glass text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-white/10 transition-all active:scale-95 flex items-center gap-2"
            >
              <Info size={18} /> More Info
            </button>
          </div>
        </div>

        {/* Poster float (hidden on small screens) */}
        {poster && (
          <div className="hidden lg:block absolute right-24 top-1/2 -translate-y-1/2">
            <img
              src={poster}
              alt={title}
              className={`w-52 rounded-2xl shadow-2xl shadow-black/60 rotate-2 transition-opacity duration-500 ${fading ? 'opacity-0' : 'opacity-100'}`}
            />
          </div>
        )}
      </div>

      {/* Dot indicators */}
      <div className="absolute bottom-10 left-8 md:left-16 lg:left-24 z-10 flex gap-2">
        {movies.slice(0, 8).map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`transition-all duration-300 rounded-full ${
              i === idx
                ? 'w-8 h-2 bg-accent'
                : 'w-2 h-2 bg-white/30 hover:bg-white/60'
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
