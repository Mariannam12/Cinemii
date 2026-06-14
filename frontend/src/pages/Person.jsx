import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Film, Tv, Calendar, MapPin } from 'lucide-react';
import { fetchPerson, imgUrl, backdropUrl } from '../core/tmdb';
import { MovieSection } from '../components/home/MovieSection';
import { Skeleton } from '../components/ui/Skeleton';

export function Person() {
  const { id }           = useParams();
  const navigate         = useNavigate();
  const [person, set]    = useState(null);
  const [loading, setLd] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    setLd(true);
    fetchPerson(id).then(set).catch(console.error).finally(() => setLd(false));
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-bg pt-24 px-6 md:px-10">
      <div className="max-w-screen-xl mx-auto flex gap-10">
        <Skeleton className="w-48 h-72 rounded-2xl flex-shrink-0" />
        <div className="flex-1 flex flex-col gap-4 pt-4">
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    </div>
  );

  if (!person) return (
    <div className="min-h-screen flex items-center justify-center text-muted">Person not found.</div>
  );

  const movies  = (person.movie_credits?.cast || []).filter(m => m.poster_path).sort((a, b) => (b.popularity || 0) - (a.popularity || 0)).slice(0, 20);
  const tvShows = (person.tv_credits?.cast   || []).filter(m => m.poster_path).sort((a, b) => (b.popularity || 0) - (a.popularity || 0)).slice(0, 20);
  const age     = person.birthday ? Math.floor((Date.now() - new Date(person.birthday)) / 31557600000) : null;
  const photo   = imgUrl(person.profile_path, 'h632');

  return (
    <div className="min-h-screen bg-bg pb-20">
      {/* Header backdrop using most popular movie */}
      {movies[0]?.backdrop_path && (
        <div className="relative h-64 overflow-hidden">
          <img src={backdropUrl(movies[0].backdrop_path)} alt="" className="w-full h-full object-cover object-top" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-bg" />
        </div>
      )}

      <div className={`max-w-screen-xl mx-auto px-6 md:px-10 ${movies[0]?.backdrop_path ? '-mt-32 relative z-10' : 'pt-24'}`}>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 glass rounded-xl px-4 py-2 text-white text-sm font-medium hover:bg-white/10 transition mb-8"
        >
          <ArrowLeft size={16} /> Back
        </button>

        <div className="flex flex-col md:flex-row gap-8 mb-14">
          {/* Photo */}
          <div className="flex-shrink-0 mx-auto md:mx-0">
            {photo
              ? <img src={photo} alt={person.name} className="w-44 md:w-52 rounded-2xl shadow-2xl ring-1 ring-white/10" />
              : <div className="w-44 md:w-52 aspect-[2/3] rounded-2xl bg-surface flex items-center justify-center text-4xl text-muted">👤</div>
            }
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl md:text-5xl font-black text-white mb-3">{person.name}</h1>

            <div className="flex flex-wrap gap-3 mb-5">
              {person.known_for_department && (
                <div className="flex items-center gap-1.5 glass px-3 py-1.5 rounded-lg text-sm text-white">
                  <Film size={14} className="text-accent" /> {person.known_for_department}
                </div>
              )}
              {age && (
                <div className="flex items-center gap-1.5 glass px-3 py-1.5 rounded-lg text-sm text-white">
                  <Calendar size={14} className="text-accent" /> {age} years old
                </div>
              )}
              {person.place_of_birth && (
                <div className="flex items-center gap-1.5 glass px-3 py-1.5 rounded-lg text-sm text-white">
                  <MapPin size={14} className="text-accent" /> {person.place_of_birth}
                </div>
              )}
              {movies.length > 0 && (
                <div className="flex items-center gap-1.5 glass px-3 py-1.5 rounded-lg text-sm text-white">
                  <Star size={14} className="text-yellow-400" /> {movies.length} known films
                </div>
              )}
            </div>

            {person.biography && (
              <p className="text-white/75 leading-relaxed text-sm line-clamp-4 max-w-2xl">{person.biography}</p>
            )}
          </div>
        </div>

        {/* Known for — movies */}
        {movies.length > 0 && (
          <div className="mb-14">
            <MovieSection title="Movies" movies={movies} mediaType="movie" />
          </div>
        )}

        {/* Known for — TV */}
        {tvShows.length > 0 && (
          <div className="mb-14">
            <MovieSection title="TV Shows" movies={tvShows} mediaType="tv" />
          </div>
        )}
      </div>
    </div>
  );
}
