import { useEffect, useRef, useState } from 'react';
import { API_BASE } from '../../core/config';
import { api, isLoggedIn } from '../../core/backend';

const SAVE_EVERY = 5000;

function resolveSource(src) {
  if (!src) return src;
  return src.startsWith('/') ? `${API_BASE}${src}` : src;
}

export function CinemaPlayer({ mediaType, mediaId, title, onClose }) {
  const videoRef   = useRef(null);
  const timerRef   = useRef(null);
  const [info, setInfo]       = useState(null);
  const [error, setError]     = useState(null);
  const localKey = `cinemii_progress_${mediaType}_${mediaId}`;

  useEffect(() => {
    api.streamInfo(mediaType, mediaId)
      .then(setInfo)
      .catch((e) => setError(e.message));
  }, [mediaType, mediaId]);

  useEffect(() => {
    if (!info?.source || !videoRef.current) return;
    const video = videoRef.current;
    video.src = resolveSource(info.source);

    const resumeAt = Number(info.resume_seconds || localStorage.getItem(localKey) || 0);
    const onMeta = () => {
      if (resumeAt > 1 && resumeAt < video.duration - 5) {
        video.currentTime = resumeAt;
      }
    };
    video.addEventListener('loadedmetadata', onMeta);
    return () => video.removeEventListener('loadedmetadata', onMeta);
  }, [info, localKey]);

  const persist = () => {
    const video = videoRef.current;
    if (!video || video.currentTime <= 0) return;
    const position = video.currentTime;
    const duration = Number.isFinite(video.duration) ? video.duration : 0;
    localStorage.setItem(localKey, String(position));
    if (isLoggedIn()) {
      api.saveProgress({ media_type: mediaType, media_id: mediaId, title, position_seconds: position, duration_seconds: duration })
        .catch(() => {});
    }
  };

  useEffect(() => {
    timerRef.current = setInterval(persist, SAVE_EVERY);
    return () => clearInterval(timerRef.current);
  });

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') handleClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClose = () => {
    persist();
    clearInterval(timerRef.current);
    if (videoRef.current) videoRef.current.pause();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-md"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className="relative w-full max-w-5xl mx-4 rounded-2xl overflow-hidden bg-black shadow-2xl">
        {/* Close */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-black/60 hover:bg-accent text-white flex items-center justify-center transition-colors text-lg"
          aria-label="Close player"
        >
          ✕
        </button>

        {/* Video */}
        {error ? (
          <div className="aspect-video flex items-center justify-center text-muted">
            <div className="text-center">
              <p className="text-lg font-semibold text-white mb-2">Playback unavailable</p>
              <p className="text-sm text-muted">{error}</p>
            </div>
          </div>
        ) : !info ? (
          <div className="aspect-video flex items-center justify-center">
            <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <video
            ref={videoRef}
            className="w-full aspect-video bg-black"
            controls
            autoPlay
            playsInline
            onPause={persist}
            onEnded={persist}
          />
        )}

        {/* Bar */}
        {info && (
          <div className="px-4 py-3 bg-black/80 flex items-center justify-between gap-4">
            <span className="text-white font-semibold text-sm truncate">{title || 'Now Playing'}</span>
            {info.license && (
              <span className="text-muted text-xs shrink-0">{info.license}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
