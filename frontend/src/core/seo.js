import { useEffect } from 'react';

const DEFAULT_TITLE = 'Cinemii — Your Cinema, Your Rules';
const DEFAULT_DESC  = 'Discover movies and TV shows, build your watchlist, rate, and watch together with friends.';

function setMeta(attr, key, value) {
  if (!value) return;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', value);
}

// Sets the document title + description/OG per page (client-side).
// Crawlers that execute JS (Google) pick this up; the static tags in
// index.html cover non-JS unfurls.
export function useSeo({ title, description, image } = {}) {
  useEffect(() => {
    const fullTitle = title ? `${title} · Cinemii` : DEFAULT_TITLE;
    const desc = description || DEFAULT_DESC;
    document.title = fullTitle;
    setMeta('name', 'description', desc);
    setMeta('property', 'og:title', fullTitle);
    setMeta('property', 'og:description', desc);
    setMeta('name', 'twitter:title', fullTitle);
    setMeta('name', 'twitter:description', desc);
    if (image) {
      setMeta('property', 'og:image', image);
      setMeta('name', 'twitter:image', image);
    }
    return () => { document.title = DEFAULT_TITLE; };
  }, [title, description, image]);
}
