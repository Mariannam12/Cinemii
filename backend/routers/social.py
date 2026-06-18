"""Public profiles, following, and an activity feed."""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from database import get_db
from deps import get_current_user
from models import Favorite, Follow, Review, User, WatchlistItem
from security import decode_access_token

router = APIRouter(prefix="/api/users", tags=["social"])
feed_router = APIRouter(prefix="/api", tags=["social"])

_optional = HTTPBearer(auto_error=False)


def _maybe_user(creds: Optional[HTTPAuthorizationCredentials], db: Session) -> Optional[User]:
    if not creds or not creds.credentials:
        return None
    payload = decode_access_token(creds.credentials)
    if not payload:
        return None
    sub = payload.get("sub")
    return db.get(User, int(sub)) if sub and str(sub).isdigit() else None


def _find(db: Session, username: str) -> User:
    user = db.query(User).filter(User.username == username.lower().strip()).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    return user


@router.get("/{username}")
def public_profile(
    username: str,
    db: Session = Depends(get_db),
    creds: Optional[HTTPAuthorizationCredentials] = Depends(_optional),
):
    user = _find(db, username)
    viewer = _maybe_user(creds, db)

    followers = db.query(Follow).filter(Follow.following_id == user.id).count()
    following = db.query(Follow).filter(Follow.follower_id == user.id).count()
    is_following = bool(
        viewer and db.query(Follow).filter(
            Follow.follower_id == viewer.id, Follow.following_id == user.id
        ).first()
    )

    favorites = (
        db.query(Favorite).filter(Favorite.user_id == user.id)
        .order_by(Favorite.created_at.desc()).limit(18).all()
    )
    reviews = (
        db.query(Review).filter(Review.user_id == user.id)
        .order_by(Review.updated_at.desc()).limit(10).all()
    )

    return {
        "name": user.name,
        "username": user.username,
        "picture": user.picture,
        "bio": user.bio,
        "followers": followers,
        "following": following,
        "is_following": is_following,
        "is_self": bool(viewer and viewer.id == user.id),
        "favorites": [
            {"media_type": f.media_type, "media_id": f.media_id, "title": f.title, "poster_path": f.poster_path}
            for f in favorites
        ],
        "reviews": [
            {"media_type": r.media_type, "media_id": r.media_id, "title": r.title,
             "poster_path": r.poster_path, "rating": r.rating, "review": r.review,
             "updated_at": r.updated_at.isoformat() if r.updated_at else None}
            for r in reviews
        ],
    }


@router.post("/{username}/follow", status_code=status.HTTP_204_NO_CONTENT)
def follow(username: str, db: Session = Depends(get_db), me: User = Depends(get_current_user)):
    target = _find(db, username)
    if target.id == me.id:
        raise HTTPException(status_code=400, detail="You can't follow yourself.")
    exists = db.query(Follow).filter(
        Follow.follower_id == me.id, Follow.following_id == target.id
    ).first()
    if not exists:
        db.add(Follow(follower_id=me.id, following_id=target.id))
        db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.delete("/{username}/follow", status_code=status.HTTP_204_NO_CONTENT)
def unfollow(username: str, db: Session = Depends(get_db), me: User = Depends(get_current_user)):
    target = _find(db, username)
    db.query(Follow).filter(
        Follow.follower_id == me.id, Follow.following_id == target.id
    ).delete()
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@feed_router.get("/feed")
def activity_feed(db: Session = Depends(get_db), me: User = Depends(get_current_user)):
    """Recent reviews & favorites from the people you follow."""
    following_ids = [f.following_id for f in db.query(Follow).filter(Follow.follower_id == me.id).all()]
    if not following_ids:
        return {"activity": []}

    users = {u.id: u for u in db.query(User).filter(User.id.in_(following_ids)).all()}

    items = []
    reviews = (
        db.query(Review).filter(Review.user_id.in_(following_ids))
        .order_by(Review.updated_at.desc()).limit(30).all()
    )
    for r in reviews:
        u = users.get(r.user_id)
        if not u:
            continue
        items.append({
            "kind": "review", "user": {"name": u.name, "username": u.username, "picture": u.picture},
            "media_type": r.media_type, "media_id": r.media_id, "title": r.title,
            "poster_path": r.poster_path, "rating": r.rating, "review": r.review,
            "ts": r.updated_at.isoformat() if r.updated_at else None,
        })

    favorites = (
        db.query(Favorite).filter(Favorite.user_id.in_(following_ids))
        .order_by(Favorite.created_at.desc()).limit(30).all()
    )
    for f in favorites:
        u = users.get(f.user_id)
        if not u:
            continue
        items.append({
            "kind": "favorite", "user": {"name": u.name, "username": u.username, "picture": u.picture},
            "media_type": f.media_type, "media_id": f.media_id, "title": f.title,
            "poster_path": f.poster_path,
            "ts": f.created_at.isoformat() if f.created_at else None,
        })

    items.sort(key=lambda x: x["ts"] or "", reverse=True)
    return {"activity": items[:40]}
