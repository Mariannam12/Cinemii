import { useState, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Heart, Film, Star } from 'lucide-react';
import { imgUrl } from '../../core/tmdb';
import { useFavorites } from '../../contexts/FavoritesContext';

export const MovieCard = memo(function MovieCard({ movie, mediaType = 'movie', onWatchClick }) {
  const navigate              = useNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [imgErr, setImgErr]   = useState(false);

  const title  = movie.title || movie.name || 'Untitled';
  const year   = (movie.release_date || movie.first_air_date || '').slice(0, 4);
  const rating = movie.vote_average?.toFixed(1);
  const poster = imgUrl(movie.poster_path, 'w185'); // smaller image = faster load
  const type   = movie.media_type || mediaType;
  const favd   = isFavorite(type, movie.id);

  const goDetail = useCallback(() => {
    navigate(`/${type === 'tv' ? 'tv' : 'movie'}/${movie.id}`);
  }, [navigate, movie.id, type]);

  const toggleFav = useCallback((e) => {
    e.stopPropagation();
    toggleFavorite(movie, type);
  }, [toggleFavorite, movie, type]);

  const handleWatch = useCallback((e) => {
    e.stopPropagation();
    if (onWatchClick) onWatchClick(movie, type);
    else goDetail();
  }, [onWatchClick, movie, type, goDetail]);

  return (
    <div className="group relative flex-shrink-0 w-full cursor-pointer" onClick={goDetail}>
      {/* Poster */}
      <div className="relative overflow-hidden rounded-xl aspect-[2/3] bg-surface">
        {poster && !imgErr ? (
          <img
            src={poster}
            alt={title}
            loading="lazy"
            decoding="async"
            onError={() => setImgErr(true)}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted"><Film size={28} /></div>
        )}

        {/* Rating */}
        {rating && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/70 backdrop-blur-sm rounded-lg px-2 py-1">
            <Star size={11} className="text-yellow-400" fill="currentColor" />
            <span className="text-white text-xs font-semibold">{rating}</span>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-3 gap-2">
          <button onClick={handleWatch} className="w-full gradient-accent text-white text-xs font-bold py-2 rounded-lg hover:opacity-90 transition active:scale-95 flex items-center justify-center gap-1.5">
            <Play size={13} fill="white" /> Watch
          </button>
          <button onClick={toggleFav} className="w-full glass text-white text-xs font-semibold py-2 rounded-lg hover:bg-white/10 transition active:scale-95 flex items-center justify-center gap-1.5">
            <Heart size={13} fill={favd ? 'currentColor' : 'none'} className={favd ? 'text-accent' : ''} /> {favd ? 'Saved' : 'Favorite'}
          </button>
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
