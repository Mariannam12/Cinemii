// Real HTML5 cinema player.
//
// Plays the legal stream the backend hands back (CC / public-domain sample,
// or your own licensed media), restores the saved resume position, and
// periodically syncs progress to the backend (and localStorage as a guest
// fallback). This is NOT a trailer — it's the actual playback surface.

import { api, isLoggedIn } from "../core/backend.js";
import { API_BASE } from "../core/config.js";

const SAVE_INTERVAL_MS = 5000;

// Sources the backend serves itself come back as relative paths
// (e.g. "/api/stream/file/sample.mp4"); resolve them against the API origin.
function resolveSource(source) {
    if (!source) return source;
    return source.startsWith("/") ? `${API_BASE}${source}` : source;
}

export async function openPlayer({ mediaType = "movie", mediaId, title = "" }) {
    mediaId = String(mediaId);

    let info;
    try {
        info = await api.streamInfo(mediaType, mediaId);
    } catch (error) {
        alert("Stream is not available right now.\n" + error.message);
        return;
    }

    if (!info || !info.source) {
        alert("No playable source for this title.");
        return;
    }

    const localKey = `cinemii_progress_${mediaType}_${mediaId}`;
    const resumeAt = Number(
        info.resume_seconds || localStorage.getItem(localKey) || 0
    );

    const overlay = buildOverlay(info, title);
    const video = overlay.querySelector(".cinema-player-video");

    document.body.appendChild(overlay);
    document.body.style.overflow = "hidden";

    video.src = resolveSource(info.source);

    // Restore resume position once we know the duration.
    video.addEventListener("loadedmetadata", () => {
        if (resumeAt > 1 && resumeAt < video.duration - 5) {
            video.currentTime = resumeAt;
        }
    });

    const persist = () => saveProgress(video, mediaType, mediaId, title, localKey);
    const saveTimer = setInterval(persist, SAVE_INTERVAL_MS);
    video.addEventListener("pause", persist);
    video.addEventListener("ended", persist);

    const close = () => {
        persist();
        clearInterval(saveTimer);
        video.pause();
        overlay.remove();
        document.body.style.overflow = "";
        document.removeEventListener("keydown", onKey);
    };

    function onKey(e) {
        if (e.key === "Escape") close();
    }

    overlay.querySelector(".cinema-player-close")
        .addEventListener("click", close);

    overlay.addEventListener("click", e => {
        if (e.target === overlay) close();
    });

    document.addEventListener("keydown", onKey);
}

function buildOverlay(info, title) {
    const overlay = document.createElement("div");
    overlay.className = "cinema-player";

    overlay.innerHTML = `
        <div class="cinema-player-box">
            <button class="cinema-player-close" aria-label="Close">✕</button>
            <video
                class="cinema-player-video"
                controls
                autoplay
                playsinline
            ></video>
            <div class="cinema-player-bar">
                <span class="cinema-player-title"></span>
                <span class="cinema-player-license"></span>
            </div>
        </div>
    `;

    // Set as text (never innerHTML) so titles/licenses can't inject markup.
    overlay.querySelector(".cinema-player-title").textContent =
        title || "Now Playing";
    overlay.querySelector(".cinema-player-license").textContent =
        info.license || "";

    return overlay;
}

function saveProgress(video, mediaType, mediaId, title, localKey) {
    const position = video.currentTime || 0;
    const duration = Number.isFinite(video.duration) ? video.duration : 0;

    if (position <= 0) return;

    // Guest fallback so resume works even without an account.
    localStorage.setItem(localKey, String(position));

    if (isLoggedIn()) {
        api.saveProgress({
            media_type: mediaType,
            media_id: mediaId,
            title,
            position_seconds: position,
            duration_seconds: duration,
        }).catch(() => {
            /* offline / token expired — local copy already saved */
        });
    }
}
