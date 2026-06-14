import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Users, Send, Play, Pause, Copy, Check, ArrowLeft, Film, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE } from '../core/config';
import { api } from '../core/backend';
import { searchMulti, imgUrl } from '../core/tmdb';

const WS_BASE = API_BASE.replace('http', 'ws');

function genCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function resolveSource(src) {
  if (!src) return src;
  return src.startsWith('/') ? `${API_BASE}${src}` : src;
}

export function Room() {
  const { user }                          = useAuth();
  const navigate                          = useNavigate();
  const [searchParams]                    = useSearchParams();
  const [phase, setPhase]                 = useState('lobby'); // lobby | room
  const [code, setCode]                   = useState('');
  const [inputCode, setInputCode]         = useState('');
  const [members, setMembers]             = useState([]);
  const [messages, setMessages]           = useState([]);
  const [chatText, setChatText]           = useState('');
  const [copied, setCopied]               = useState(false);
  const [movie, setMovie]                 = useState(null); // selected movie
  const [streamLoading, setStreamLoading] = useState(false);
  const [search, setSearch]               = useState('');
  const [searchRes, setSearchRes]         = useState([]);
  const [isHost, setIsHost]               = useState(false);
  const videoRef                          = useRef(null);
  const wsRef                             = useRef(null);
  const chatRef                           = useRef(null);
  const name                              = user?.name || 'Guest';
  const debounceRef                       = useRef(null);

  const addMsg = useCallback((msg) => setMessages(prev => [...prev.slice(-99), msg]), []);

  const connect = useCallback((roomCode, host) => {
    const ws = new WebSocket(`${WS_BASE}/ws/room/${roomCode}?name=${encodeURIComponent(name)}`);
    wsRef.current = ws;

    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'joined' || data.type === 'left') {
        setMembers(data.members || []);
        addMsg({ type: 'system', text: data.type === 'joined' ? `${data.name} joined` : `${data.name} left` });
      } else if (data.type === 'chat') {
        addMsg({ type: 'chat', name: data.name, text: data.text });
      } else if (data.type === 'movie') {
        setMovie(data.movie);
        addMsg({ type: 'system', text: `${data.name} selected ${data.movie.title}` });
      } else if (data.type === 'play' && videoRef.current) {
        videoRef.current.currentTime = data.time;
        videoRef.current.play();
      } else if (data.type === 'pause' && videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = data.time;
      } else if (data.type === 'seek' && videoRef.current) {
        videoRef.current.currentTime = data.time;
      }
    };

    ws.onclose = () => addMsg({ type: 'system', text: 'Disconnected from room.' });
    setIsHost(host);
    setCode(roomCode);
    setPhase('room');
  }, [name, addMsg]);

  useEffect(() => () => wsRef.current?.close(), []);

  // Auto-join when arriving via a ?code= link (from a Live Stream card)
  useEffect(() => {
    const joinCode = searchParams.get('code');
    if (joinCode && phase === 'lobby') {
      connect(joinCode.toUpperCase(), false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Load the actual stream source whenever the selected movie changes
  useEffect(() => {
    if (!movie) return;
    let cancelled = false;
    setStreamLoading(true);
    api.streamInfo('movie', String(movie.id))
      .then((info) => {
        if (cancelled || !videoRef.current || !info?.source) return;
        videoRef.current.src = resolveSource(info.source);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setStreamLoading(false); });
    return () => { cancelled = true; };
  }, [movie]);

  // Scroll chat
  useEffect(() => { chatRef.current?.scrollTo(0, chatRef.current.scrollHeight); }, [messages]);

  // Movie search
  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!search.trim()) { setSearchRes([]); return; }
    debounceRef.current = setTimeout(async () => {
      const data = await searchMulti(search).catch(() => null);
      setSearchRes((data?.results || []).filter(r => r.media_type === 'movie').slice(0, 5));
    }, 350);
  }, [search]);

  const send = (payload) => wsRef.current?.readyState === 1 && wsRef.current.send(JSON.stringify(payload));

  const sendChat = () => {
    if (!chatText.trim()) return;
    send({ type: 'chat', text: chatText });
    addMsg({ type: 'chat', name, text: chatText, self: true });
    setChatText('');
  };

  const selectMovie = (m) => {
    setMovie(m);
    setSearch('');
    setSearchRes([]);
    send({
      type: 'movie',
      movie: { id: m.id, title: m.title, poster_path: m.poster_path, backdrop_path: m.backdrop_path },
      name,
    });
  };

  const onPlay = () => send({ type: 'play',  time: videoRef.current?.currentTime || 0 });
  const onPause = () => send({ type: 'pause', time: videoRef.current?.currentTime || 0 });
  const onSeeked = () => send({ type: 'seek',  time: videoRef.current?.currentTime || 0 });

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Lobby ──────────────────────────────────────────────────────────────────
  if (phase === 'lobby') {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted hover:text-white transition mb-8 text-sm">
            <ArrowLeft size={16} /> Back
          </button>

          <div className="glass-dark rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl gradient-accent flex items-center justify-center">
                <Users size={20} className="text-white" />
              </div>
              <h1 className="text-2xl font-black text-white">Watch Together</h1>
            </div>
            <p className="text-muted text-sm mb-8">Create or join a room to watch movies in sync with friends.</p>

            <div className="flex flex-col gap-4">
              <button
                onClick={() => connect(genCode(), true)}
                className="gradient-accent text-white font-bold py-3.5 rounded-xl hover:opacity-90 transition active:scale-95 flex items-center justify-center gap-2"
              >
                <Film size={18} /> Create a Room
              </button>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-muted text-xs">or join with a code</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              <div className="flex gap-2">
                <input
                  value={inputCode}
                  onChange={e => setInputCode(e.target.value.toUpperCase())}
                  placeholder="Enter room code…"
                  maxLength={6}
                  className="flex-1 glass rounded-xl px-4 py-3 text-white placeholder:text-muted text-sm font-mono tracking-widest focus:outline-none border border-transparent focus:border-accent/40 transition"
                />
                <button
                  onClick={() => inputCode.length >= 4 && connect(inputCode, false)}
                  disabled={inputCode.length < 4}
                  className="gradient-accent text-white font-bold px-5 rounded-xl hover:opacity-90 transition active:scale-95 disabled:opacity-40"
                >
                  Join
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Room ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-bg flex flex-col md:flex-row h-screen overflow-hidden pt-16">
      {/* Left — player + controls */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Room header */}
        <div className="flex items-center gap-3 px-4 py-3 glass-dark border-b border-white/5">
          <button onClick={() => { wsRef.current?.close(); setPhase('lobby'); }} className="text-muted hover:text-white transition">
            <X size={18} />
          </button>
          <span className="text-white font-bold text-sm">Room</span>
          <button onClick={copyCode} className="flex items-center gap-1.5 glass rounded-lg px-3 py-1.5 text-xs font-mono text-white hover:bg-white/10 transition">
            {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
            {code}
          </button>
          <div className="flex items-center gap-1.5 ml-auto">
            <Users size={14} className="text-muted" />
            <span className="text-muted text-xs">{members.length} watching</span>
          </div>
        </div>

        {/* Video area */}
        <div className="flex-1 bg-black relative flex items-center justify-center min-h-0">
          <video
            ref={videoRef}
            className={`w-full h-full object-contain ${movie ? '' : 'hidden'}`}
            controls
            onPlay={onPlay}
            onPause={onPause}
            onSeeked={onSeeked}
          />
          {movie && streamLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {!movie && (
            <div className="text-center text-muted p-8">
              <Film size={48} className="mx-auto mb-4 opacity-40" />
              <p className="font-semibold text-white mb-1">No movie selected</p>
              {isHost
                ? <p className="text-sm">Search for a movie below to start watching</p>
                : <p className="text-sm">Waiting for the host to pick a movie…</p>
              }
            </div>
          )}
        </div>

        {/* Movie search — host only */}
        {isHost && (
          <div className="px-4 py-3 glass-dark border-t border-white/5 relative">
            <div className="flex items-center gap-2">
              <Film size={16} className="text-muted shrink-0" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search and pick a movie…"
                className="flex-1 bg-transparent text-white placeholder:text-muted text-sm focus:outline-none"
              />
            </div>
            {searchRes.length > 0 && (
              <div className="absolute bottom-full left-0 right-0 glass-dark border border-white/5 rounded-t-xl overflow-hidden">
                {searchRes.map(r => (
                  <button key={r.id} onClick={() => selectMovie(r)} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition text-left">
                    {r.poster_path
                      ? <img src={imgUrl(r.poster_path, 'w92')} alt={r.title} className="w-8 h-12 rounded object-cover" />
                      : <div className="w-8 h-12 rounded bg-surface flex items-center justify-center"><Film size={14} className="text-muted" /></div>
                    }
                    <div>
                      <p className="text-white text-sm font-medium">{r.title}</p>
                      <p className="text-muted text-xs">{r.release_date?.slice(0,4)}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Members bar */}
        <div className="px-4 py-2 flex items-center gap-2 border-t border-white/5 overflow-x-auto hide-scrollbar">
          {members.map((m, i) => (
            <div key={i} className="flex items-center gap-1.5 flex-shrink-0">
              <div className="w-6 h-6 rounded-full gradient-accent flex items-center justify-center text-white text-xs font-bold">
                {m[0]?.toUpperCase()}
              </div>
              <span className="text-xs text-muted">{m}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right — chat */}
      <div className="w-full md:w-80 flex flex-col glass-dark border-t md:border-t-0 md:border-l border-white/5 min-h-0 max-h-64 md:max-h-full">
        <div className="px-4 py-3 border-b border-white/5">
          <h3 className="text-sm font-bold text-white">Room Chat</h3>
        </div>

        <div ref={chatRef} className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2 min-h-0">
          {messages.map((m, i) => (
            m.type === 'system'
              ? <p key={i} className="text-center text-xs text-muted italic">{m.text}</p>
              : (
                <div key={i} className={`flex flex-col ${m.self ? 'items-end' : 'items-start'}`}>
                  {!m.self && <span className="text-xs text-accent font-semibold mb-0.5">{m.name}</span>}
                  <span className={`text-sm px-3 py-2 rounded-xl max-w-[85%] ${m.self ? 'gradient-accent text-white' : 'glass text-white'}`}>
                    {m.text}
                  </span>
                </div>
              )
          ))}
          {messages.length === 0 && (
            <p className="text-center text-xs text-muted mt-4">Chat starts here…</p>
          )}
        </div>

        <div className="px-3 py-3 border-t border-white/5 flex gap-2">
          <input
            value={chatText}
            onChange={e => setChatText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendChat()}
            placeholder="Message…"
            className="flex-1 glass rounded-xl px-3 py-2 text-white placeholder:text-muted text-sm focus:outline-none border border-transparent focus:border-accent/40 transition"
          />
          <button onClick={sendChat} className="gradient-accent text-white rounded-xl p-2.5 hover:opacity-90 transition active:scale-95">
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
