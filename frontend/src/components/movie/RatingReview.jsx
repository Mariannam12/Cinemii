import { useState, useEffect } from 'react';
import { Star, Trash2, Check } from 'lucide-react';
import { api, isLoggedIn } from '../../core/backend';

export function RatingReview({ mediaType, mediaId, title, posterPath }) {
  const [rating, setRating]   = useState(0);
  const [hover, setHover]     = useState(0);
  const [review, setReview]   = useState('');
  const [saved, setSaved]     = useState(false);
  const [busy, setBusy]       = useState(false);
  const [existing, setExist]  = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) return;
    api.getReview(mediaType, mediaId)
      .then(r => { if (r) { setRating(r.rating); setReview(r.review || ''); setExist(true); } })
      .catch(() => {});
  }, [mediaType, mediaId]);

  if (!isLoggedIn()) return null;

  const save = async () => {
    if (!rating) return;
    setBusy(true);
    try {
      await api.saveReview({ media_type: mediaType, media_id: String(mediaId), title, poster_path: posterPath, rating, review });
      setExist(true); setSaved(true); setTimeout(() => setSaved(false), 2500);
    } catch { /* ignore */ }
    setBusy(false);
  };

  const remove = async () => {
    setBusy(true);
    try { await api.deleteReview(mediaType, mediaId); setRating(0); setReview(''); setExist(false); }
    catch { /* ignore */ }
    setBusy(false);
  };

  return (
    <div className="glass rounded-2xl p-5 mt-10 max-w-2xl">
      <h3 className="text-white font-bold mb-3">Your rating &amp; review</h3>
      <div className="flex items-center gap-1.5 mb-4">
        {[1, 2, 3, 4, 5].map(n => (
          <button key={n} onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)} onClick={() => setRating(n)} className="transition active:scale-90">
            <Star size={26} className={(hover || rating) >= n ? 'text-yellow-400' : 'text-white/20'} fill={(hover || rating) >= n ? 'currentColor' : 'none'} />
          </button>
        ))}
        {rating > 0 && <span className="text-muted text-sm ml-2">{rating}/5</span>}
      </div>
      <textarea
        value={review}
        onChange={e => setReview(e.target.value.slice(0, 2000))}
        placeholder="Write a review (optional)…"
        rows={3}
        className="w-full glass rounded-xl px-4 py-3 text-white placeholder:text-muted text-sm focus:outline-none focus:border-accent/50 border border-white/10 transition resize-none"
      />
      <div className="flex items-center gap-3 mt-3">
        <button onClick={save} disabled={busy || !rating} className="gradient-accent text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:opacity-90 active:scale-95 transition disabled:opacity-50 flex items-center gap-2">
          <Check size={15} /> {existing ? 'Update' : 'Save'}
        </button>
        {existing && (
          <button onClick={remove} disabled={busy} className="text-muted hover:text-red-400 text-sm flex items-center gap-1.5 transition">
            <Trash2 size={14} /> Remove
          </button>
        )}
        {saved && <span className="text-green-400 text-sm">Saved!</span>}
      </div>
    </div>
  );
}
