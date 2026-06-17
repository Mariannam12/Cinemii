"""CINEMII FastAPI application entry point.

Run (from the backend/ directory):
    uvicorn main:app --reload --port 8000
"""

from fastapi import FastAPI

from config import ALLOWED_ORIGINS, ALLOWED_ORIGIN_REGEX
from database import Base, engine, ensure_user_columns
from routers import account, auth, library, stream, realtime, tmdb_proxy, friends, messages

# Create tables on startup (fine for SQLite/staging; use Alembic for prod).
Base.metadata.create_all(bind=engine)
# Add any newly-introduced user columns to a pre-existing database.
ensure_user_columns()

app = FastAPI(title="CINEMII API", version="1.0.0")

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "http://127.0.0.1:3000",
    "http://localhost:3000",
    "http://127.0.0.1:3001",
    "http://localhost:3001",
    "http://127.0.0.1:3003",
    "http://localhost:3003",
    "http://127.0.0.1:5173",
    "http://localhost:5173",

    "https://cinemii.vercel.app",
    "https://cinemii-git-main-mariannam12.vercel.app",
],
allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth.router)
app.include_router(account.router)
app.include_router(library.router)
app.include_router(stream.router)
app.include_router(realtime.router)
app.include_router(tmdb_proxy.router)
app.include_router(friends.router)
app.include_router(messages.router)


@app.get("/api/health", tags=["meta"])
def health():
    return {"status": "ok", "service": "cinemii-api"}
