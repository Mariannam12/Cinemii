import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Search, Sparkles, User } from 'lucide-react';

export function BottomNav({ onSearch, onFor }) {
  const navigate = useNavigate();
  const loc      = useLocation();

  const items = [
    { key: 'home',    icon: Home,     label: 'Home',    active: loc.pathname === '/',        onClick: () => navigate('/') },
    { key: 'search',  icon: Search,   label: 'Search',  active: loc.pathname === '/search',  onClick: onSearch },
    { key: 'foryou',  icon: Sparkles, label: 'For You', active: false,                       onClick: onFor },
    { key: 'profile', icon: User,     label: 'Profile', active: loc.pathname.startsWith('/profile'), onClick: () => navigate('/profile') },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[850] glass-dark border-t border-white/10 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-14">
        {items.map(({ key, icon: Icon, label, active, onClick }) => (
          <button
            key={key}
            onClick={onClick}
            className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition ${active ? 'text-accent' : 'text-muted hover:text-white'}`}
            aria-label={label}
            aria-current={active ? 'page' : undefined}
          >
            <Icon size={20} fill={active && key === 'foryou' ? 'currentColor' : 'none'} />
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
