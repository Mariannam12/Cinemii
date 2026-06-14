# CINEMII Backend (FastAPI)

Staging backend: JWT auth, bcrypt-hashed passwords, watch-progress, favorites,
and a range-capable streaming endpoint for **legal** content only.

## Run

```bash
cd backend
python3 -m venv venv
./venv/bin/pip install -r requirements.txt
./venv/bin/uvicorn main:app --host 127.0.0.1 --port 8001 --reload
```

Then serve the front-end from the project root (any static server), e.g.:

```bash
python3 -m http.server 3000
```

Open http://localhost:3000 . The front-end talks to the API at
`http://127.0.0.1:8001` (see `assets/js/core/config.js`).

> On this machine `localhost` resolves to IPv6 and collides with other local
> services on 8000/8080, so the backend uses port **8001** and the front-end
> calls **127.0.0.1** explicitly.

## Environment variables

| Var | Default | Purpose |
|-----|---------|---------|
| `CINEMII_SECRET` | random per-boot | JWT signing key — **set this in production** |
| `CINEMII_TOKEN_TTL_MIN` | `10080` (7d) | Access-token lifetime |
| `CINEMII_DATABASE_URL` | `sqlite:///backend/cinemii.db` | DB connection |
| `CINEMII_ALLOWED_ORIGINS` | localhost dev origins | CORS allowlist |

## API

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/auth/signup` | – | Create account → JWT |
| POST | `/api/auth/login` | – | Email/password → JWT |
| POST | `/api/auth/google` | – | Verify Google ID token server-side → JWT |
| GET  | `/api/auth/me` | ✓ | Current user |
| GET/POST | `/api/watch-progress` | ✓ | Resume position sync |
| GET/POST/DELETE | `/api/favorites` | ✓ | Favorites |
| GET | `/api/stream/info/{type}/{id}` | optional | Playable (legal) source + resume |
| GET | `/api/stream/file/{name}` | – | Range-served local media |

## Streaming & legality

This server **never** proxies or embeds third-party pirate sources. It points
the player at:

1. files you drop into `backend/media/` that you hold the rights to, or
2. a Creative-Commons / public-domain demo clip (`sample.mp4`, Big Buck Bunny,
   © Blender Foundation, CC-BY 3.0).

To use your own licensed catalog, drop MP4s in `backend/media/` and map titles
in `_CATALOG` inside `routers/stream.py`.
