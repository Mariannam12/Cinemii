import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Bell, Film, TrendingUp, History } from 'lucide-react';
import { imgUrl } from '../../core/tmdb';
import { buildNotifications, getReadSet, markRead } from '../../core/notifications';

function timeAgo(ts) {
  if (!ts) return '';
  const diff = Date.now() - ts;
  if (diff < 0)        return 'soon';
  if (diff < 60000)    return 'just now';
  if (diff < 3600000)  return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

const KIND_ICON = {
  new:      <Film size={15} className="text-accent" />,
  trend:    <TrendingUp size={15} className="text-yellow-400" />,
  continue: <History size={15} className="text-blue-400" />,
};

export function NotificationPanel({ onClose, onRead }) {
  const ref               = useRef(null);
  const navigate          = useNavigate();
  const [items, setItems] = useState(null);
  const [read, setRead]   = useState(() => getReadSet());

  useEffect(() => {
    buildNotifications().then(setItems).catch(() => setItems([]));
  }, []);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose]);

  // Only unread notifications are shown — reading one removes it from the list.
  const visible = (items || []).filter(n => !read.has(n.id));

  const open = (n) => {
    markRead([n.id]);
    setRead(getReadSet());
    onRead?.();
    onClose();
    navigate(n.link);
  };

  const markAll = () => {
    if (!items) return;
    markRead(items.map(n => n.id));
    setRead(getReadSet());
    onRead?.();
  };

  return (
    <div ref={ref} className="absolute top-full right-0 mt-2 w-[340px] max-w-[90vw] glass-dark rounded-2xl shadow-2xl border border-white/10 overflow-hidden z-50 animate-pop">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Bell size={15} className="text-accent" />
          <span className="text-white font-bold text-sm">Notifications</span>
        </div>
        <button onClick={onClose} className="text-muted hover:text-white transition"><X size={15} /></button>
      </div>

      <div className="divide-y divide-white/5 max-h-96 overflow-y-auto">
        {items === null && (
          <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>
        )}
        {items !== null && visible.length === 0 && (
          <div className="px-4 py-10 text-center text-muted text-sm">
            <Bell size={28} className="mx-auto mb-3 opacity-20" />
            You're all caught up.
          </div>
        )}
        {visible.map((n) => (
          <button key={n.id} onClick={() => open(n)} className="w-full flex items-start gap-3 px-4 py-3 text-left transition bg-accent/[0.06] hover:bg-accent/10">
            {n.poster
              ? <img src={imgUrl(n.poster, 'w92')} alt="" className="w-9 rounded-md object-cover flex-shrink-0" style={{ height: '52px' }} />
              : <div className="w-9 rounded-md glass flex items-center justify-center flex-shrink-0" style={{ height: '52px' }}>{KIND_ICON[n.kind]}</div>
            }
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                {KIND_ICON[n.kind]}
                <p className="text-white text-xs font-semibold">{n.title}</p>
                <span className="w-1.5 h-1.5 rounded-full bg-accent ml-auto" />
              </div>
              <p className="text-muted text-xs mt-0.5 line-clamp-2">{n.body}</p>
              <p className="text-muted/60 text-[11px] mt-1">{timeAgo(n.ts)}</p>
            </div>
          </button>
        ))}
      </div>

      {visible.length > 0 && (
        <div className="px-4 py-2.5 border-t border-white/5">
          <button onClick={markAll} className="w-full text-center text-xs text-accent hover:text-accent-light transition font-medium">
            Mark all as read
          </button>
        </div>
      )}
    </div>
  );
}
