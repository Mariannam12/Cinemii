const KEY = 'cinemii_taste';

// Genres offered in the first-run picker.
export const TASTE_GENRES = [
  { id: 28,    name: 'Action' },
  { id: 12,    name: 'Adventure' },
  { id: 35,    name: 'Comedy' },
  { id: 18,    name: 'Drama' },
  { id: 878,   name: 'Sci-Fi' },
  { id: 53,    name: 'Thriller' },
  { id: 27,    name: 'Horror' },
  { id: 10749, name: 'Romance' },
  { id: 16,    name: 'Animation' },
  { id: 14,    name: 'Fantasy' },
  { id: 9648,  name: 'Mystery' },
  { id: 80,    name: 'Crime' },
  { id: 10751, name: 'Family' },
  { id: 99,    name: 'Documentary' },
];

export const genreName = (id) => TASTE_GENRES.find(g => g.id === id)?.name || '';

export function getTaste() {
  try { const v = JSON.parse(localStorage.getItem(KEY)); return Array.isArray(v) ? v : []; }
  catch { return []; }
}

export function setTaste(ids) {
  localStorage.setItem(KEY, JSON.stringify(ids));
}

// Whether the user has gone through the picker at all (even if they skipped).
export function hasChosenTaste() {
  return localStorage.getItem(KEY) !== null;
}
