"""Watchlist and user ratings/reviews (JWT-protected)."""

from typing import List, Optional

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from database import get_db
from deps import get_current_user
from models import Review, User, WatchlistItem
from schemas import ReviewIn, ReviewOut, WatchlistIn, WatchlistOut

router = APIRouter(prefix="/api", tags=["content"])


# --- Watchlist --------------------------------------------------------------

@router.get("/watchlist", response_model=List[WatchlistOut])
def list_watchlist(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return (
        db.query(WatchlistItem)
        .filter(WatchlistItem.user_id == user.id)
        .order_by(WatchlistItem.created_at.desc())
        .all()
    )


@router.post("/watchlist", response_model=WatchlistOut)
def add_watchlist(
    body: WatchlistIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    item = (
        db.query(WatchlistItem)
        .filter(
            WatchlistItem.user_id == user.id,
            WatchlistItem.media_type == body.media_type,
            WatchlistItem.media_id == body.media_id,
        )
        .first()
    )
    if not item:
        item = WatchlistItem(user_id=user.id, **body.model_dump())
        db.add(item)
        db.commit()
        db.refresh(item)
    return item


@router.delete("/watchlist/{media_type}/{media_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_watchlist(
    media_type: str,
    media_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    db.query(WatchlistItem).filter(
        WatchlistItem.user_id == user.id,
        WatchlistItem.media_type == media_type,
        WatchlistItem.media_id == media_id,
    ).delete()
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# --- Reviews / ratings ------------------------------------------------------

@router.get("/reviews", response_model=List[ReviewOut])
def my_reviews(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return (
        db.query(Review)
        .filter(Review.user_id == user.id)
        .order_by(Review.updated_at.desc())
        .all()
    )


@router.get("/reviews/{media_type}/{media_id}", response_model=Optional[ReviewOut])
def my_review_for(
    media_type: str,
    media_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return (
        db.query(Review)
        .filter(
            Review.user_id == user.id,
            Review.media_type == media_type,
            Review.media_id == media_id,
        )
        .first()
    )


@router.post("/reviews", response_model=ReviewOut)
def upsert_review(
    body: ReviewIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    row = (
        db.query(Review)
        .filter(
            Review.user_id == user.id,
            Review.media_type == body.media_type,
            Review.media_id == body.media_id,
        )
        .first()
    )
    if row:
        row.rating = body.rating
        row.review = body.review
        if body.title:
            row.title = body.title
        if body.poster_path:
            row.poster_path = body.poster_path
    else:
        row = Review(user_id=user.id, **body.model_dump())
        db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.delete("/reviews/{media_type}/{media_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_review(
    media_type: str,
    media_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    db.query(Review).filter(
        Review.user_id == user.id,
        Review.media_type == media_type,
        Review.media_id == media_id,
    ).delete()
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
