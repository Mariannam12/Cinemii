import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserPlus, UserCheck, Star, ArrowLeft } from 'lucide-react';
import { api, isLoggedIn } from '../core/backend';
import { useToast } from '../contexts/ToastContext';
import { imgUrl } from '../core/tmdb';
import { MovieCard } from '../components/movie/MovieCard';
import { Skeleton } from '../components/ui/Skeleton';

export function PublicProfile() {
  const { username }      = useParams();
  const navigate          = useNavigate();
  const { error }         = useToast();
  const [data, setData]   = useState(null);
  const [loading, setLoad] = useState(true);
  const [busy, setBusy]   = useState(false);

  useEffect(() => {
    setLoad(true);
    api.publicProfile(username)
      .then(setData)
      .catch(() => setData(false))
      .finally(() => setLoad(false));
  }, [username]);

  const toggleFollow = async () => {
    if (!isLoggedIn()) { error('Sign in to follow people.'); return; }
    setBusy(true);
    const wasFollowing = data.is_following;
    setData(d => ({ ...d, is_following: !wasFollowing, followers: d.followers + (wasFollowing ? -1 : 1) }));
    try {
      if (wasFollowing) await api.unfollow(username);
      else await api.follow(username);
    } catch {
      setData(d => ({ ...d, is_following: wasFollowing, followers: d.followers + (wasFollowing ? 1 : -1) }));
      error('Could not update follow.');
    }
    setBusy(false);
  };

  if (loading) return (
    <div className="min-h-screen pt-24 px-6 max-w-screen-xl mx-auto">
      <Skeleton className="w-24 h-24 rounded-full mb-4" />
      <Skeleton className="h-8 w-48" />
    </div>
  );
  if (!data) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-center">
      <p className="text-5xl">👤</p>
      <h1 className="text-2xl font-black text-white">User not found</h1>
      <p className="text-muted">No one here by @{username}.</p>
    </div>
  );

  const initials = data.name?.[0]?.toUpperCase() || '?';

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="max-w-screen-xl mx-auto px-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted hover:text-white transition text-sm mb-6">
          <ArrowLeft size={15} /> Back
        </button>

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-12">
          <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-accent/40 flex-shrink-0">
            {data.picture
              ? <img src={data.picture} alt={data.name} className="w-full h-full object-cover" />
              : <div className="w-full h-full gradient-accent flex items-center justify-center text-white text-3xl font-black">{initials}</div>}
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-black text-white">{data.name}</h1>
            {data.username && <p className="text-muted text-sm">@{data.username}</p>}
            {data.bio && <p className="text-white/80 text-sm mt-2 max-w-lg">{data.bio}</p>}
            <div className="flex gap-5 mt-3 text-sm">
              <span className="text-white font-bold">{data.followers} <span className="text-muted font-normal">followers</span></span>
              <span className="text-white font-bold">{data.following} <span className="text-muted font-normal">following</span></span>
            </div>
          </div>
          {!data.is_self && (
            <button
              onClick={toggleFollow}
              disabled={busy}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition active:scale-95 ${data.is_following ? 'glass text-white' : 'gradient-accent text-white shadow-lg shadow-accent/20'}`}
            >
              {data.is_following ? <><UserCheck size={16} /> Following</> : <><UserPlus size={16} /> Follow</>}
            </button>
          )}
        </div>

        {/* Reviews */}
        {data.reviews?.length > 0 && (
          <section className="mb-12">
            <h2 className="text-lg font-bold text-white mb-5">Recent ratings</h2>
            <div className="flex flex-col gap-3">
              {data.reviews.map(r => (
                <button
                  key={`${r.media_type}-${r.media_id}`}
                  onClick={() => navigate(`/${r.media_type === 'tv' ? 'tv' : 'movie'}/${r.media_id}`)}
                  className="flex gap-4 glass rounded-2xl p-4 text-left hover:bg-white/5 transition"
                >
                  <div className="w-12 h-16 rounded-lg overflow-hidden bg-surface flex-shrink-0">
                    {r.poster_path ? <img src={imgUrl(r.poster_path, 'w92')} alt="" className="w-full h-full object-cover" /> : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm">{r.title}</p>
                    <div className="flex items-center gap-0.5 my-1">
                      {[1,2,3,4,5].map(n => <Star key={n} size={13} className={n <= r.rating ? 'text-yellow-400' : 'text-white/15'} fill={n <= r.rating ? 'currentColor' : 'none'} />)}
                    </div>
                    {r.review && <p className="text-muted text-xs line-clamp-2">{r.review}</p>}
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Favorites */}
        {data.favorites?.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-white mb-5">Favorites</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {data.favorites.map(f => (
                <MovieCard
                  key={`${f.media_type}-${f.media_id}`}
                  movie={{ id: f.media_id, title: f.title, poster_path: f.poster_path, media_type: f.media_type }}
                  mediaType={f.media_type}
                />
              ))}
            </div>
          </section>
        )}

        {!data.reviews?.length && !data.favorites?.length && (
          <p className="text-muted text-center py-16">@{data.username} hasn't shared anything yet.</p>
        )}
      </div>
    </div>
  );
}
