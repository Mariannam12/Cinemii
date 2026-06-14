import { useState, useEffect, useRef } from 'react';

// Fires the fetch only when the returned `ref` element scrolls near the viewport.
// Pass a stable function reference (module-level or useCallback) as `fetcher`.
export function useLazyTMDB(fetcher) {
  const ref                   = useRef(null);
  const fetcherRef            = useRef(fetcher);
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [fired,   setFired]   = useState(false);

  // Keep the fetcher ref fresh without re-running the observer effect
  useEffect(() => { fetcherRef.current = fetcher; });

  useEffect(() => {
    const el = ref.current;
    if (!el || fired) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        setFired(true);
        setLoading(true);
        fetcherRef.current()
          .then((d) => { setData(d); setLoading(false); })
          .catch(()  => { setLoading(false); });
      },
      { rootMargin: '400px' }  // pre-load 400px before visible
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [fired]);

  return { ref, data, loading };
}
