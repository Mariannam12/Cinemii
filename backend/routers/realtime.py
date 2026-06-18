"""WebSocket endpoints for community chat and watch-together rooms,
plus a REST endpoint that lists active rooms as "live streams"."""

import time
from collections import defaultdict, deque
from typing import Optional

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query

router = APIRouter(tags=["realtime"])

# Keep last 60 community messages in memory
_chat_history: deque = deque(maxlen=60)
_chat_connections: list[dict] = []  # [{ws, name}]

# room_code → list of {ws, name}
_rooms: dict[str, list[dict]] = defaultdict(list)
# room_code → {host, movie, started_at, public}
_room_meta: dict[str, dict] = {}


# ── Community chat ────────────────────────────────────────────────────────────

@router.websocket("/ws/chat")
async def chat_ws(websocket: WebSocket, name: Optional[str] = Query("Guest")):
    await websocket.accept()
    conn = {"ws": websocket, "name": name}
    _chat_connections.append(conn)

    # Send history + current online count to the new joiner
    await websocket.send_json({"type": "history", "messages": list(_chat_history)})
    await _broadcast_chat({"type": "presence", "online": len(_chat_connections)})

    join_msg = {"type": "system", "text": f"{name} joined the chat", "ts": _now_ms()}
    _chat_history.append(join_msg)
    await _broadcast_chat(join_msg)

    try:
        while True:
            data = await websocket.receive_json()
            msg = {
                "type": "chat",
                "name": str(data.get("name", name))[:30],
                "text": str(data.get("text", ""))[:500],
                "ts":   _now_ms(),
            }
            _chat_history.append(msg)
            await _broadcast_chat(msg)
    except (WebSocketDisconnect, Exception):
        if conn in _chat_connections:
            _chat_connections.remove(conn)
        leave_msg = {"type": "system", "text": f"{name} left the chat", "ts": _now_ms()}
        _chat_history.append(leave_msg)
        await _broadcast_chat(leave_msg)
        await _broadcast_chat({"type": "presence", "online": len(_chat_connections)})


async def _broadcast_chat(msg: dict):
    dead = []
    # Snapshot: a disconnect can mutate _chat_connections during an await.
    for conn in list(_chat_connections):
        try:
            await conn["ws"].send_json(msg)
        except Exception:
            dead.append(conn)
    for c in dead:
        if c in _chat_connections:
            _chat_connections.remove(c)


# ── Watch-together rooms ──────────────────────────────────────────────────────

@router.websocket("/ws/room/{code}")
async def room_ws(
    websocket: WebSocket,
    code: str,
    name: Optional[str] = Query("Guest"),
    host: int = Query(0),
):
    await websocket.accept()
    entry = {"ws": websocket, "name": name}
    _rooms[code].append(entry)

    # Register room metadata on first join (host)
    if code not in _room_meta:
        _room_meta[code] = {
            "host": name,
            "movie": None,
            "started_at": time.time(),
            "public": True,
        }

    await _broadcast_room(code, {
        "type": "joined", "name": name, "members": _room_names(code),
    })

    try:
        while True:
            data = await websocket.receive_json()
            ev_type = data.get("type")

            if ev_type in ("play", "pause", "seek", "movie"):
                # Track what the room is currently watching
                if ev_type == "movie" and code in _room_meta:
                    _room_meta[code]["movie"] = data.get("movie")
                await _broadcast_room(code, data, exclude=websocket)
            elif ev_type == "chat":
                msg = {"type": "chat", "name": name, "text": str(data.get("text", ""))[:500]}
                await _broadcast_room(code, msg)
    except (WebSocketDisconnect, Exception):
        _rooms[code] = [e for e in _rooms[code] if e["ws"] is not websocket]
        await _broadcast_room(code, {"type": "left", "name": name, "members": _room_names(code)})
        if not _rooms[code]:
            _rooms.pop(code, None)
            _room_meta.pop(code, None)


def _room_names(code: str) -> list[str]:
    return [e["name"] for e in _rooms.get(code, [])]


async def _broadcast_room(code: str, msg: dict, exclude: Optional[WebSocket] = None):
    dead = []
    # Snapshot: a disconnect can mutate the room list during an await.
    for entry in list(_rooms.get(code, [])):
        if entry["ws"] is exclude:
            continue
        try:
            await entry["ws"].send_json(msg)
        except Exception:
            dead.append(entry)
    for e in dead:
        if e in _rooms.get(code, []):
            _rooms[code].remove(e)


# ── REST: active rooms as "live streams" ──────────────────────────────────────

@router.get("/api/rooms")
def list_rooms():
    """Public list of active watch-together rooms, newest first."""
    out = []
    # Snapshot: this sync endpoint runs in a threadpool while async WS handlers
    # mutate _rooms in the event loop — iterate a copy to avoid a race.
    for code, members in list(_rooms.items()):
        meta = _room_meta.get(code, {})
        if not meta.get("public", True) or not members:
            continue
        out.append({
            "code": code,
            "host": meta.get("host", "Guest"),
            "viewers": len(members),
            "movie": meta.get("movie"),
            "started_at": meta.get("started_at", 0),
        })
    out.sort(key=lambda r: r["started_at"], reverse=True)
    return {"rooms": out}


def _now_ms() -> int:
    return int(time.time() * 1000)
