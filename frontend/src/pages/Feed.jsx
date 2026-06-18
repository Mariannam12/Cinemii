import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Star, Heart } from 'lucide-react';
import { api, isLoggedIn } from '../core/backend';
import { imgUrl } from '../core/tmdb';
import { Skeleton } from '../components/ui/Skeleton';

function timeAgo(ts) {
  if (!ts) return '';
  const diff = Date.now() - Date.parse(ts);
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

export function Feed() {
  const navigate           = useNavigate();
  const [items, setItems]  = useState(null);

  useEffect(() => {
    if (!isLoggedIn()) { navigate('/'); return; }
    api.feed().then(d => setItems(d.activity || [])).catch(() => setItems([]));
  }, [navigate]);

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="max-w-2xl mx-auto px-6">
        <h1 className="text-3xl font-black text-white mb-1 flex items-center gap-2">
          <Users size={26} className="text-accent" /> Activity
        </h1>
        <p className="text-muted text-sm mb-8">What the people you follow are watching.</p>

        {items === null && (
          <div className="flex flex-col gap-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
        )}

        {items?.length === 0 && (
          <div className="text-center py-20 text-muted">
            <Users size={42} className="mx-auto mb-4 opacity-20" />
            <p className="font-semibold text-white">No activity yet</p>
            <p className="text-sm mt-1">Follow people to see what they rate and favorite.</p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {items?.map((a, i) => {
            const u = a.user || {};
            const uInitial = u.name?.[0]?.toUpperCase() || '?';
            return (
              <div key={i} className="flex gap-3 glass rounded-2xl p-4 items-center">
                <button onClick={() => u.username && navigate(`/u/${u.username}`)} className="flex-shrink-0">
                  {u.picture
                    ? <img src={u.picture} alt={u.name} className="w-10 h-10 rounded-full object-cover" />
                    : <div className="w-10 h-10 rounded-full gradient-accent flex items-center justify-center text-white text-sm font-bold">{uInitial}</div>}
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white">
                    <button onClick={() => u.username && navigate(`/u/${u.username}`)} className="font-bold hover:text-accent transition">{u.name}</button>
                    <span className="text-muted">
                      {a.kind === 'review' ? ' rated ' : ' favorited '}
                    </span>
                    <button onClick={() => navigate(`/${a.media_type === 'tv' ? 'tv' : 'movie'}/${a.media_id}`)} className="font-semibold hover:text-accent transition">{a.title}</button>
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {a.kind === 'review'
                      ? <span className="flex items-center gap-0.5">{[1,2,3,4,5].map(n => <Star key={n} size={11} className={n <= a.rating ? 'text-yellow-400' : 'text-white/15'} fill={n <= a.rating ? 'currentColor' : 'none'} />)}</span>
                      : <Heart size={13} className="text-accent" fill="currentColor" />}
                    <span className="text-muted text-xs">{timeAgo(a.ts)}</span>
                  </div>
                </div>
                <button onClick={() => navigate(`/${a.media_type === 'tv' ? 'tv' : 'movie'}/${a.media_id}`)} className="w-10 h-14 rounded-lg overflow-hidden bg-surface flex-shrink-0">
                  {a.poster_path ? <img src={imgUrl(a.poster_path, 'w92')} alt="" className="w-full h-full object-cover" /> : null}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
