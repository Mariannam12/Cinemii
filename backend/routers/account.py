"""Account management: profile edits, email/password change, 2FA, deletion."""

import re

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from config import FRONTEND_URL
from database import get_db
from ratelimit import rate_limiter
from deps import get_current_user
from mailer import send_email
from models import User
from schemas import (
    BackupCodesOut,
    DeleteAccountIn,
    EmailChangeIn,
    ForgotPasswordIn,
    PasswordChangeIn,
    ProfileUpdateIn,
    ResetPasswordIn,
    TwoFACodeIn,
    TwoFAEnableOut,
    TwoFASetupOut,
    UserOut,
)
from security import (
    create_reset_token,
    decode_reset_token,
    generate_2fa_secret,
    generate_backup_codes,
    hash_password,
    qr_svg_data_uri,
    totp_uri,
    verify_2fa,
    verify_password,
)

router = APIRouter(prefix="/api/auth", tags=["account"])

_USERNAME_RE = re.compile(r"^[a-zA-Z0-9_.]+$")
_DOB_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


@router.patch("/profile", response_model=UserOut)
def update_profile(
    body: ProfileUpdateIn,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    if body.name is not None:
        current.name = body.name.strip()

    if body.username is not None:
        handle = body.username.strip().lower()
        if not _USERNAME_RE.match(handle):
            raise HTTPException(400, "Username may only contain letters, numbers, '.' and '_'.")
        clash = (
            db.query(User)
            .filter(User.username == handle, User.id != current.id)
            .first()
        )
        if clash:
            raise HTTPException(409, "That username is taken.")
        current.username = handle

    if body.bio is not None:
        current.bio = body.bio.strip() or None

    if body.date_of_birth is not None:
        dob = body.date_of_birth.strip()
        if dob and not _DOB_RE.match(dob):
            raise HTTPException(400, "Date of birth must be YYYY-MM-DD.")
        current.date_of_birth = dob or None

    if body.picture is not None:
        current.picture = body.picture.strip() or None

    db.commit()
    db.refresh(current)
    return current


@router.post("/change-email", response_model=UserOut)
def change_email(
    body: EmailChangeIn,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    # Require the current password to confirm identity.
    if not current.hashed_password:
        raise HTTPException(400, "Set a password first before changing your email.")
    if not verify_password(body.password, current.hashed_password):
        raise HTTPException(401, "Incorrect password.")

    new_email = body.new_email.lower().strip()
    if new_email == current.email:
        raise HTTPException(400, "That is already your email.")
    if db.query(User).filter(User.email == new_email).first():
        raise HTTPException(409, "That email is already in use.")

    current.email = new_email
    db.commit()
    db.refresh(current)
    return current


@router.post("/change-password", response_model=UserOut)
def change_password(
    body: PasswordChangeIn,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    # If a password already exists, the current one must match. Google users
    # with no password can set one for the first time without it.
    if current.hashed_password:
        if not body.current_password or not verify_password(
            body.current_password, current.hashed_password
        ):
            raise HTTPException(401, "Current password is incorrect.")

    current.hashed_password = hash_password(body.new_password)
    db.commit()
    db.refresh(current)
    return current


# --- Two-factor (TOTP) ------------------------------------------------------

@router.post("/2fa/setup", response_model=TwoFASetupOut)
def twofa_setup(
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    """Generate (but don't yet enable) a TOTP secret + QR for the user."""
    if current.two_factor_enabled:
        raise HTTPException(400, "Two-factor is already enabled.")
    secret = generate_2fa_secret()
    current.two_factor_secret = secret  # stored, enabled only after verify
    db.commit()
    uri = totp_uri(secret, current.email)
    return TwoFASetupOut(secret=secret, otpauth_uri=uri, qr_svg=qr_svg_data_uri(uri))


@router.post("/2fa/enable", response_model=TwoFAEnableOut)
def twofa_enable(
    body: TwoFACodeIn,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    if current.two_factor_enabled:
        raise HTTPException(400, "Two-factor is already enabled.")
    if not verify_2fa(current.two_factor_secret, body.code):
        raise HTTPException(400, "That code is incorrect. Try again.")
    current.two_factor_enabled = True
    plaintext, hashed_json = generate_backup_codes()
    current.backup_codes = hashed_json
    db.commit()
    db.refresh(current)
    # Plaintext codes are shown exactly once, here.
    return TwoFAEnableOut(user=UserOut.model_validate(current), backup_codes=plaintext)


@router.post("/2fa/backup-codes", response_model=BackupCodesOut)
def regenerate_backup_codes(
    body: TwoFACodeIn,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    """Issue a fresh set of recovery codes (invalidates the old ones)."""
    if not current.two_factor_enabled:
        raise HTTPException(400, "Two-factor is not enabled.")
    if not verify_2fa(current.two_factor_secret, body.code):
        raise HTTPException(400, "That code is incorrect.")
    plaintext, hashed_json = generate_backup_codes()
    current.backup_codes = hashed_json
    db.commit()
    return BackupCodesOut(backup_codes=plaintext)


@router.post("/2fa/disable", response_model=UserOut)
def twofa_disable(
    body: TwoFACodeIn,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    if not current.two_factor_enabled:
        raise HTTPException(400, "Two-factor is not enabled.")
    if not verify_2fa(current.two_factor_secret, body.code):
        raise HTTPException(400, "That code is incorrect.")
    current.two_factor_enabled = False
    current.two_factor_secret = None
    current.backup_codes = None
    db.commit()
    db.refresh(current)
    return current


@router.delete("/account", status_code=status.HTTP_204_NO_CONTENT)
def delete_account(
    body: DeleteAccountIn,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    # Confirm with password when the account has one.
    if current.hashed_password:
        if not body.password or not verify_password(
            body.password, current.hashed_password
        ):
            raise HTTPException(401, "Incorrect password.")
    db.delete(current)
    db.commit()
    return None


# --- Password reset (no auth) -----------------------------------------------

@router.post("/forgot-password", dependencies=[Depends(rate_limiter(4, 300))])
def forgot_password(body: ForgotPasswordIn, db: Session = Depends(get_db)):
    """Email a reset link. Always returns 200 so we don't leak which emails exist."""
    email = body.email.lower().strip()
    user = db.query(User).filter(User.email == email).first()
    if user and user.hashed_password:
        token = create_reset_token(user.id)
        link = f"{FRONTEND_URL}/reset-password?token={token}"
        send_email(
            to=user.email,
            subject="Reset your Cinemii password",
            body=(
                f"Hi {user.name},\n\n"
                f"Use this link to reset your password (valid 15 minutes):\n{link}\n\n"
                "If you didn't request this, you can ignore this email."
            ),
        )
    return {"ok": True, "message": "If that email exists, a reset link has been sent."}


@router.post("/reset-password", response_model=UserOut, dependencies=[Depends(rate_limiter(8, 300))])
def reset_password(body: ResetPasswordIn, db: Session = Depends(get_db)):
    user_id = decode_reset_token(body.token)
    if not user_id:
        raise HTTPException(400, "This reset link is invalid or has expired.")
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(400, "This reset link is invalid or has expired.")
    user.hashed_password = hash_password(body.new_password)
    db.commit()
    db.refresh(user)
    return user
