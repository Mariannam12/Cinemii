import { useEffect, useRef } from 'react';
import { X, Bell, Film, Tv, Star, Clock } from 'lucide-react';

// Static notifications for now — easily replaced with a backend push later.
const SAMPLE = [
  { id: 1, icon: 'film',  title: 'New release',    body: 'Avatar: Fire and Ash is now available.',  ts: Date.now() - 1000 * 60 * 5  },
  { id: 2, icon: 'star',  title: 'Top rated',      body: 'The Brutalist just entered the top 10.',  ts: Date.now() - 1000 * 60 * 30 },
  { id: 3, icon: 'tv',    title: 'New episode',    body: 'The Last of Us S2 — episode 6 is out.',   ts: Date.now() - 1000 * 60 * 90 },
  { id: 4, icon: 'clock', title: 'Continue watching', body: 'Pick up where you left off in Dune.', ts: Date.now() - 1000 * 60 * 180 },
];

function timeAgo(ts) {
  const diff = Date.now() - ts;
  if (diff < 60000)         return 'just now';
  if (diff < 3600000)       return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000)      return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

const ICONS = {
  film:  <Film  size={16} className="text-accent" />,
  tv:    <Tv    size={16} className="text-accent" />,
  star:  <Star  size={16} className="text-yellow-400" />,
  clock: <Clock size={16} className="text-blue-400" />,
};

export function NotificationPanel({ onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose]);

  return (
    <div ref={ref} className="absolute top-full right-0 mt-2 w-80 glass-dark rounded-2xl shadow-2xl border border-white/10 overflow-hidden z-50">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Bell size={15} className="text-accent" />
          <span className="text-white font-bold text-sm">Notifications</span>
        </div>
        <button onClick={onClose} className="text-muted hover:text-white transition">
          <X size={15} />
        </button>
      </div>

      <div className="divide-y divide-white/5 max-h-80 overflow-y-auto">
        {SAMPLE.map(n => (
          <div key={n.id} className="flex items-start gap-3 px-4 py-3 hover:bg-white/5 transition cursor-pointer">
            <div className="w-8 h-8 rounded-lg glass flex items-center justify-center flex-shrink-0 mt-0.5">
              {ICONS[n.icon]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold">{n.title}</p>
              <p className="text-muted text-xs mt-0.5 line-clamp-2">{n.body}</p>
            </div>
            <span className="text-muted text-xs flex-shrink-0">{timeAgo(n.ts)}</span>
          </div>
        ))}
      </div>

      <div className="px-4 py-2.5 border-t border-white/5">
        <button className="w-full text-center text-xs text-accent hover:text-accent-light transition font-medium">
          Mark all as read
        </button>
      </div>
    </div>
  );
}
