"""Per-user library: favorites and watch progress (all JWT-protected)."""

from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from database import get_db
from deps import get_current_user
from models import Favorite, User, WatchProgress
from schemas import FavoriteIn, FavoriteOut, ProgressIn, ProgressOut

router = APIRouter(prefix="/api", tags=["library"])


# --- Favorites --------------------------------------------------------------

@router.get("/favorites", response_model=List[FavoriteOut])
def list_favorites(
    db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    return (
        db.query(Favorite)
        .filter(Favorite.user_id == user.id)
        .order_by(Favorite.created_at.desc())
        .all()
    )


@router.post("/favorites", response_model=FavoriteOut)
def add_favorite(
    body: FavoriteIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    fav = (
        db.query(Favorite)
        .filter(
            Favorite.user_id == user.id,
            Favorite.media_type == body.media_type,
            Favorite.media_id == body.media_id,
        )
        .first()
    )
    if not fav:
        fav = Favorite(user_id=user.id, **body.model_dump())
        db.add(fav)
        db.commit()
        db.refresh(fav)
    return fav


@router.delete("/favorites/{media_type}/{media_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_favorite(
    media_type: str,
    media_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    db.query(Favorite).filter(
        Favorite.user_id == user.id,
        Favorite.media_type == media_type,
        Favorite.media_id == media_id,
    ).delete()
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# --- Watch progress ---------------------------------------------------------

@router.get("/watch-progress", response_model=List[ProgressOut])
def list_progress(
    db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    return (
        db.query(WatchProgress)
        .filter(WatchProgress.user_id == user.id)
        .order_by(WatchProgress.updated_at.desc())
        .all()
    )


@router.get("/watch-progress/{media_type}/{media_id}", response_model=ProgressOut)
def get_progress(
    media_type: str,
    media_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    row = (
        db.query(WatchProgress)
        .filter(
            WatchProgress.user_id == user.id,
            WatchProgress.media_type == media_type,
            WatchProgress.media_id == media_id,
        )
        .first()
    )
    if not row:
        # Return a zeroed record rather than 404 so the player can just resume(0).
        return ProgressOut(
            media_type=media_type,
            media_id=media_id,
            position_seconds=0.0,
            duration_seconds=0.0,
            updated_at=datetime.now(timezone.utc),
        )
    return row


@router.post("/watch-progress", response_model=ProgressOut)
def upsert_progress(
    body: ProgressIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    row = (
        db.query(WatchProgress)
        .filter(
            WatchProgress.user_id == user.id,
            WatchProgress.media_type == body.media_type,
            WatchProgress.media_id == body.media_id,
        )
        .first()
    )
    if row:
        row.position_seconds = body.position_seconds
        row.duration_seconds = body.duration_seconds
        if body.title:
            row.title = body.title
        if body.poster_path:
            row.poster_path = body.poster_path
    else:
        row = WatchProgress(user_id=user.id, **body.model_dump())
        db.add(row)

    db.commit()
    db.refresh(row)
    return row
