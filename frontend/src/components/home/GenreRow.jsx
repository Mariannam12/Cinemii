import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MovieSection } from './MovieSection';
import { useLazyTMDB } from '../../hooks/useLazyTMDB';
import { fetchByGenre } from '../../core/tmdb';

// A self-contained, lazy-loaded genre row (so we can render a variable number
// of taste-based rows without breaking the rules of hooks).
export function GenreRow({ genreId, title, icon, onWatchClick }) {
  const navigate = useNavigate();
  const { ref, data, loading } = useLazyTMDB(useCallback(() => fetchByGenre(genreId), [genreId]));
  return (
    <MovieSection
      title={title}
      icon={icon}
      movies={(data?.results || []).slice(0, 14)}
      loading={loading}
      onWatchClick={onWatchClick}
      sectionRef={ref}
      onSeeAll={() => navigate(`/genre/${genreId}`)}
    />
  );
}
