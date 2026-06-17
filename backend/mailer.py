"""Tiny email sender. Uses SMTP when configured, otherwise logs to console.

Logging-as-fallback means password reset works on staging without an email
provider — you just read the reset link from the server logs.
"""

import smtplib
from email.message import EmailMessage

from config import SMTP_FROM, SMTP_HOST, SMTP_PASS, SMTP_PORT, SMTP_USER


def send_email(to: str, subject: str, body: str) -> None:
    if not SMTP_HOST:
        # No SMTP configured — log it so it's still usable in dev/staging.
        print(f"\n[CINEMII EMAIL → {to}] {subject}\n{body}\n")
        return

    msg = EmailMessage()
    msg["From"] = SMTP_FROM
    msg["To"] = to
    msg["Subject"] = subject
    msg.set_content(body)

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15) as server:
            server.starttls()
            if SMTP_USER and SMTP_PASS:
                server.login(SMTP_USER, SMTP_PASS)
            server.send_message(msg)
    except Exception as exc:  # never break the request on email failure
        print(f"[CINEMII EMAIL ERROR → {to}] {exc}")
