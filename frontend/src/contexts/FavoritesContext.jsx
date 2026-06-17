import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, isLoggedIn } from '../core/backend';
import { useToast } from './ToastContext';

const FavoritesContext = createContext(null);

const key = (type, id) => `${type}:${id}`;

export function FavoritesProvider({ children }) {
  const [favSet, setFavSet] = useState(() => new Set());
  const [loaded, setLoaded] = useState(false);
  const { success, error, info } = useToast();

  // Load the user's favorites once on mount / login
  const reload = useCallback(() => {
    if (!isLoggedIn()) { setFavSet(new Set()); setLoaded(true); return; }
    api.listFavorites()
      .then((favs) => {
        setFavSet(new Set((favs || []).map((f) => key(f.media_type, f.media_id))));
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => { reload(); }, [reload]);

  // Re-sync when auth changes elsewhere
  useEffect(() => {
    const onLogout = () => setFavSet(new Set());
    window.addEventListener('cinemii:logout', onLogout);
    return () => window.removeEventListener('cinemii:logout', onLogout);
  }, []);

  const isFavorite = useCallback(
    (type, id) => favSet.has(key(type, String(id))),
    [favSet]
  );

  const toggleFavorite = useCallback(async (movie, type) => {
    if (!isLoggedIn()) { info('Sign in to save favorites.'); return false; }
    const k = key(type, String(movie.id));
    const currentlyFav = favSet.has(k);

    // Optimistic update
    setFavSet((prev) => {
      const next = new Set(prev);
      if (currentlyFav) next.delete(k);
      else next.add(k);
      return next;
    });

    const label = movie.title || movie.name || 'Title';
    try {
      if (currentlyFav) {
        await api.removeFavorite(type, movie.id);
        info(`Removed "${label}" from favorites`);
      } else {
        await api.addFavorite({
          media_type: type,
          media_id: String(movie.id),
          title: label,
          poster_path: movie.poster_path,
        });
        success(`Added "${label}" to favorites`);
      }
      return !currentlyFav;
    } catch {
      // Roll back on failure
      setFavSet((prev) => {
        const next = new Set(prev);
        if (currentlyFav) next.add(k);
        else next.delete(k);
        return next;
      });
      error('Could not update favorites. Try again.');
      return currentlyFav;
    }
  }, [favSet, success, error, info]);

  return (
    <FavoritesContext.Provider value={{ isFavorite, toggleFavorite, reload, loaded }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export const useFavorites = () => useContext(FavoritesContext);
