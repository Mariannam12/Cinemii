import { useState, useCallback, useRef, useEffect, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Heart, Film, Star, ChevronDown, Volume2, VolumeX } from 'lucide-react';
import { imgUrl, fetchVideos } from '../../core/tmdb';
import { useFavorites } from '../../contexts/FavoritesContext';

const HOVER_DELAY = 700;

export const MovieCard = memo(function MovieCard({ movie, mediaType = 'movie', onWatchClick }) {
  const navigate              = useNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [imgErr, setImgErr]   = useState(false);
  const [imgLoaded, setLoaded] = useState(false);
  const [previewing, setPreview] = useState(false);
  const [muted, setMuted]     = useState(true);
  const trailerRef            = useRef(undefined); // cached key: undefined=unfetched, null=none
  const timerRef              = useRef(null);

  const title  = movie.title || movie.name || 'Untitled';
  const year   = (movie.release_date || movie.first_air_date || '').slice(0, 4);
  const rating = movie.vote_average?.toFixed(1);
  const match  = movie.vote_average ? Math.round(movie.vote_average * 10) : null;
  const poster = imgUrl(movie.poster_path, 'w342');
  const type   = movie.media_type || mediaType;
  const favd   = isFavorite(type, movie.id);

  const goDetail = useCallback(() => {
    navigate(`/${type === 'tv' ? 'tv' : 'movie'}/${movie.id}`);
  }, [navigate, movie.id, type]);

  const toggleFav = useCallback((e) => { e.stopPropagation(); toggleFavorite(movie, type); }, [toggleFavorite, movie, type]);
  const handleWatch = useCallback((e) => { e.stopPropagation(); onWatchClick ? onWatchClick(movie, type) : goDetail(); }, [onWatchClick, movie, type, goDetail]);

  const onEnter = useCallback(() => {
    timerRef.current = setTimeout(async () => {
      if (trailerRef.current === undefined) {
        try {
          const data = await fetchVideos(type, movie.id);
          const v = (data.results || []).find(x => x.site === 'YouTube' && (x.type === 'Trailer' || x.type === 'Teaser'));
          trailerRef.current = v?.key || null;
        } catch { trailerRef.current = null; }
      }
      if (trailerRef.current) setPreview(true);
    }, HOVER_DELAY);
  }, [type, movie.id]);

  const onLeave = useCallback(() => {
    clearTimeout(timerRef.current);
    setPreview(false);
  }, []);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const ytSrc = previewing && trailerRef.current
    ? `https://www.youtube.com/embed/${trailerRef.current}?autoplay=1&mute=${muted ? 1 : 0}&controls=0&loop=1&playlist=${trailerRef.current}&modestbranding=1&rel=0&playsinline=1&disablekb=1`
    : null;

  return (
    <div
      className="group relative flex-shrink-0 w-full cursor-pointer card-hover"
      onClick={goDetail}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      <div className="relative overflow-hidden rounded-xl aspect-[2/3] bg-surface ring-1 ring-white/5 group-hover:ring-white/15 transition">
        {/* Poster with blur-up */}
        {poster && !imgErr ? (
          <img
            src={poster}
            alt={title}
            loading="lazy"
            decoding="async"
            onLoad={() => setLoaded(true)}
            onError={() => setImgErr(true)}
            className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${imgLoaded ? 'blur-0 opacity-100' : 'blur-md opacity-60 scale-105'}`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted"><Film size={28} /></div>
        )}

        {/* Trailer preview */}
        {ytSrc && (
          <div className="absolute inset-0 animate-overlay">
            <iframe
              src={ytSrc}
              title={`${title} trailer`}
              allow="autoplay; encrypted-media"
              className="absolute inset-0 w-[300%] h-[300%] -left-[100%] -top-[100%] pointer-events-none"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <button
              onClick={(e) => { e.stopPropagation(); setMuted(m => !m); }}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition"
              title={muted ? 'Unmute' : 'Mute'}
            >
              {muted ? <VolumeX size={13} /> : <Volume2 size={13} />}
            </button>
          </div>
        )}

        {/* Rating */}
        {rating && !previewing && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/70 backdrop-blur-sm rounded-lg px-2 py-1">
            <Star size={11} className="text-yellow-400" fill="currentColor" />
            <span className="text-white text-xs font-semibold">{rating}</span>
          </div>
        )}

        {/* Hover overlay — Netflix-style circular icon buttons + match % */}
        <div className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200">
          {match >= 60 && (
            <p className="text-green-400 text-xs font-bold mb-1.5">{match}% Match</p>
          )}
          <div className="flex items-center gap-1.5">
            <button onClick={handleWatch} title="Watch" className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center hover:bg-white/85 transition shadow-lg">
              <Play size={15} fill="currentColor" className="ml-0.5" />
            </button>
            <button onClick={toggleFav} title={favd ? 'Remove from favorites' : 'Add to favorites'} className="w-9 h-9 rounded-full border-2 border-white/40 bg-black/30 backdrop-blur-sm flex items-center justify-center hover:border-white transition">
              <Heart size={14} fill={favd ? 'currentColor' : 'none'} className={favd ? 'text-accent heart-burst' : 'text-white'} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); goDetail(); }} title="More info" className="w-9 h-9 rounded-full border-2 border-white/40 bg-black/30 backdrop-blur-sm flex items-center justify-center hover:border-white transition ml-auto">
              <ChevronDown size={16} className="text-white" />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-2 px-0.5">
        <p className="text-sm font-semibold text-white line-clamp-1">{title}</p>
        <p className="text-xs text-muted mt-0.5 flex items-center gap-1">
          {year}
          {year && rating && <span className="text-muted/50">·</span>}
          {rating && <span className="flex items-center gap-0.5"><Star size={10} className="text-yellow-400" fill="currentColor" /> {rating}</span>}
        </p>
      </div>
    </div>
  );
});
