import { useEffect, useRef, useState, useCallback } from "react";
import { X, Maximize, Keyboard } from "lucide-react";
import { API_BASE } from "../../core/config";
import { api } from "../../core/backend";

function resolveSource(src) {
  if (!src) return src;
  return src.startsWith("/") ? `${API_BASE}${src}` : src;
}

export function CinemaPlayer({ mediaType, mediaId, title, onClose }) {
  const boxRef = useRef(null);

  const [info, setInfo] = useState(null);
  const [error, setError] = useState(null);
  const [showHelp, setHelp] = useState(false);

  useEffect(() => {
    api
      .streamInfo(mediaType, mediaId)
      .then(setInfo)
      .catch((e) => setError(e.message));
  }, [mediaType, mediaId]);

  const toggleFullscreen = useCallback(() => {
    const el = boxRef.current;
    if (!el) return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      el.requestFullscreen?.();
    }
  }, []);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    const onKey = (e) => {
      switch (e.key.toLowerCase()) {
        case "escape":
          handleClose();
          break;
        case "f":
          toggleFullscreen();
          break;
        default:
          break;
      }
    };

    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [handleClose, toggleFullscreen]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-md"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        ref={boxRef}
        className="relative w-full max-w-5xl mx-4 rounded-2xl overflow-hidden bg-black shadow-2xl"
      >
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-end gap-2 p-3 bg-gradient-to-b from-black/70 to-transparent">
          <button
            onClick={toggleFullscreen}
            className="w-8 h-8 rounded-lg bg-black/50 hover:bg-black/70 text-white flex items-center justify-center"
          >
            <Maximize size={15} />
          </button>

          <button
            onClick={() => setHelp((v) => !v)}
            className="w-8 h-8 rounded-lg bg-black/50 hover:bg-black/70 text-white flex items-center justify-center"
          >
            <Keyboard size={15} />
          </button>

          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-lg bg-black/50 hover:bg-red-600 text-white flex items-center justify-center"
          >
            <X size={16} />
          </button>
        </div>

        {showHelp && (
          <div
            className="absolute top-14 right-3 z-20 rounded-xl p-4 text-xs text-white bg-black/80 shadow-xl w-52"
            onClick={() => setHelp(false)}
          >
            <p className="font-bold mb-2">Keyboard shortcuts</p>

            <div className="flex justify-between py-1">
              <span>Fullscreen</span>
              <kbd>F</kbd>
            </div>

            <div className="flex justify-between py-1">
              <span>Close</span>
              <kbd>Esc</kbd>
            </div>
          </div>
        )}

        {error ? (
          <div className="aspect-video flex items-center justify-center text-white">
            {error}
          </div>
        ) : !info ? (
          <div className="aspect-video flex items-center justify-center">
            <div className="w-10 h-10 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <iframe
            src={resolveSource(info.source)}
            title={title || "Player"}
            className="w-full aspect-video bg-black"
            width="100%"
            height="100%"
            frameBorder="0"
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        )}

        {info && (
          <div className="px-4 py-3 bg-black/80 flex items-center justify-between">
            <span className="text-white font-semibold truncate">
              {title || "Now Playing"}
            </span>

            {info.license && (
              <span className="text-gray-400 text-xs">{info.license}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
