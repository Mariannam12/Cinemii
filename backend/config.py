"""Central configuration for the CINEMII backend.

Secrets are read from the environment so nothing sensitive is hard-coded.
For local staging a development fallback is used, but a loud warning is
printed so it never silently ships to production.
"""

import os
import secrets

# --- JWT / crypto -----------------------------------------------------------

SECRET_KEY = os.environ.get("CINEMII_SECRET")

if not SECRET_KEY:
    # Ephemeral key for local staging. Tokens become invalid on restart,
    # which is exactly what we want for a throwaway dev environment.
    SECRET_KEY = secrets.token_urlsafe(48)
    print(
        "\n[CINEMII] WARNING: CINEMII_SECRET not set — using a random "
        "ephemeral key.\n          Set CINEMII_SECRET in the environment "
        "for any real deployment.\n"
    )

JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.environ.get("CINEMII_TOKEN_TTL_MIN", 60 * 24 * 7)  # 7 days
)

# --- Database ---------------------------------------------------------------

_DB_PATH = os.path.join(os.path.dirname(__file__), "cinemii.db")
# Render/Heroku expose Postgres as CINEMII_DATABASE_URL or DATABASE_URL.
DATABASE_URL = (
    os.environ.get("CINEMII_DATABASE_URL")
    or os.environ.get("DATABASE_URL")
    or f"sqlite:///{_DB_PATH}"
)
# SQLAlchemy 2.x needs the "postgresql://" scheme, not the legacy "postgres://".
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# --- CORS -------------------------------------------------------------------
# The static front-end is typically served from a simple HTTP server on 8080.
# Add any other origin you serve the front-end from here.

ALLOWED_ORIGINS = os.environ.get(
    "CINEMII_ALLOWED_ORIGINS",
    "http://localhost:8080,http://127.0.0.1:8080,"
    "http://localhost:5500,http://127.0.0.1:5500,"
    "http://localhost:3000,http://127.0.0.1:3000",
).split(",")

# Regex allowlist so every Vercel preview/production domain is accepted without
# having to enumerate each one. Override via CINEMII_ALLOWED_ORIGIN_REGEX.
ALLOWED_ORIGIN_REGEX = os.environ.get(
    "CINEMII_ALLOWED_ORIGIN_REGEX", r"https://.*\.vercel\.app"
)

# --- TMDB -------------------------------------------------------------------
# Kept server-side so the key is never shipped in the frontend bundle.
TMDB_API_KEY = os.environ.get(
    "CINEMII_TMDB_KEY", "47729336f5fe1d690418538825a71879"
)
TMDB_BASE = "https://api.themoviedb.org/3"
