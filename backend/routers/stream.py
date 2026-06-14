"""Streaming endpoints.

IMPORTANT — legality:
This server only ever points the player at content that is legal to stream:
public-domain / Creative-Commons sample films, or files you drop into
`backend/media/` that you hold the rights to. It deliberately does NOT proxy
or embed third-party pirate sources. Swap `_CATALOG` / drop files in to use
your own licensed catalog.
"""

import os
import re
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from database import get_db
from models import User, WatchProgress
from schemas import StreamInfoOut
from security import decode_access_token

router = APIRouter(prefix="/api/stream", tags=["stream"])

MEDIA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "media")
os.makedirs(MEDIA_DIR, exist_ok=True)

# A legal, freely-streamable demo clip (Blender Foundation, CC-BY 3.0).
# If backend/media/sample.mp4 exists we serve it ourselves (range-capable,
# no external egress needed); otherwise we fall back to a public CC URL.
_LOCAL_SAMPLE = os.path.join(MEDIA_DIR, "sample.mp4")
if os.path.isfile(_LOCAL_SAMPLE):
    _DEFAULT_SOURCE = "/api/stream/file/sample.mp4"
else:
    _DEFAULT_SOURCE = (
        "https://commondatastorage.googleapis.com/"
        "gtv-videos-bucket/sample/BigBuckBunny.mp4"
    )

_DEFAULT_SAMPLE = {
    "source": _DEFAULT_SOURCE,
    "mime_type": "video/mp4",
    "license": "Big Buck Bunny — © Blender Foundation, CC-BY 3.0 (demo content)",
}

# Map specific titles to specific legal files here if you wish, e.g.:
#   "movie:603": {"source": "/api/stream/file/the-matrix.mp4", "mime_type": "video/mp4",
#                 "license": "Licensed copy you provided"}
_CATALOG: dict = {}

_optional_bearer = HTTPBearer(auto_error=False)
_RANGE_RE = re.compile(r"bytes=(\d+)-(\d*)")
_CHUNK = 1024 * 1024  # 1 MiB


def _maybe_user(
    creds: Optional[HTTPAuthorizationCredentials], db: Session
) -> Optional[User]:
    """Resolve the user if a valid token is present; otherwise None."""
    if not creds or not creds.credentials:
        return None
    payload = decode_access_token(creds.credentials)
    if not payload:
        return None
    sub = payload.get("sub")
    if not sub or not str(sub).isdigit():
        return None
    return db.get(User, int(sub))


@router.get("/info/{media_type}/{media_id}", response_model=StreamInfoOut)
def stream_info(
    media_type: str,
    media_id: str,
    db: Session = Depends(get_db),
    creds: Optional[HTTPAuthorizationCredentials] = Depends(_optional_bearer),
):
    entry = _CATALOG.get(f"{media_type}:{media_id}", _DEFAULT_SAMPLE)

    resume = 0.0
    user = _maybe_user(creds, db)
    if user:
        row = (
            db.query(WatchProgress)
            .filter(
                WatchProgress.user_id == user.id,
                WatchProgress.media_type == media_type,
                WatchProgress.media_id == str(media_id),
            )
            .first()
        )
        if row:
            resume = row.position_seconds

    return StreamInfoOut(
        media_type=media_type,
        media_id=str(media_id),
        source=entry["source"],
        mime_type=entry["mime_type"],
        resume_seconds=resume,
        license=entry["license"],
    )


def _safe_media_path(name: str) -> str:
    # Block path traversal — only plain filenames inside MEDIA_DIR are allowed.
    if "/" in name or "\\" in name or name.startswith("."):
        raise HTTPException(status_code=400, detail="Invalid filename.")
    path = os.path.abspath(os.path.join(MEDIA_DIR, name))
    if not path.startswith(os.path.abspath(MEDIA_DIR) + os.sep):
        raise HTTPException(status_code=400, detail="Invalid path.")
    if not os.path.isfile(path):
        raise HTTPException(status_code=404, detail="Media not found.")
    return path


@router.get("/file/{name}")
def stream_file(name: str, request: Request, range: str = Header(default=None)):
    """Serve a local media file with HTTP range support (real seeking)."""
    path = _safe_media_path(name)
    file_size = os.path.getsize(path)
    start, end = 0, file_size - 1

    status_code = status.HTTP_200_OK
    if range:
        m = _RANGE_RE.match(range)
        if m:
            start = int(m.group(1))
            if m.group(2):
                end = min(int(m.group(2)), file_size - 1)
            status_code = status.HTTP_206_PARTIAL_CONTENT

    if start > end or start >= file_size:
        raise HTTPException(
            status_code=status.HTTP_416_REQUESTED_RANGE_NOT_SATISFIABLE,
            headers={"Content-Range": f"bytes */{file_size}"},
        )

    length = end - start + 1

    def iter_file():
        with open(path, "rb") as f:
            f.seek(start)
            remaining = length
            while remaining > 0:
                chunk = f.read(min(_CHUNK, remaining))
                if not chunk:
                    break
                remaining -= len(chunk)
                yield chunk

    headers = {
        "Content-Range": f"bytes {start}-{end}/{file_size}",
        "Accept-Ranges": "bytes",
        "Content-Length": str(length),
    }
    return StreamingResponse(
        iter_file(),
        status_code=status_code,
        media_type="video/mp4",
        headers=headers,
    )
