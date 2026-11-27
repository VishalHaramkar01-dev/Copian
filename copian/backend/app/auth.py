import os
from datetime import datetime, timedelta, timezone
from typing import Optional
import bcrypt
import jwt
from fastapi import Depends, HTTPException, Header
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import AdminUser, Customer

JWT_SECRET = os.getenv("JWT_SECRET", "copian-b2b-enterprise-secret-key-2026")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24
ENABLE_DEMO_AUTH = os.getenv("ENABLE_DEMO_AUTH", "true").lower() in ("1", "true", "yes")


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))


def create_access_token(user_id: int, email: str, role_slug: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    payload = {
        "sub": str(user_id),
        "email": email,
        "role": role_slug,
        "exp": expire,
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def get_current_admin_optional(
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
) -> Optional[AdminUser]:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.split(" ", 1)[1].strip()
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = int(payload.get("sub", 0))
        return db.query(AdminUser).filter(AdminUser.id == user_id, AdminUser.is_active == True).first()
    except Exception:
        return None


def require_admin(
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
) -> AdminUser:
    user = get_current_admin_optional(authorization=authorization, db=db)
    if not user:
        raise HTTPException(status_code=401, detail="Admin authentication required")
    return user


def create_buyer_token(customer_id: int, email: str) -> str:
    """Issue a scoped 24-hour JWT token for B2B Customer self-service portal access."""
    expire = datetime.now(timezone.utc) + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    payload = {
        "sub": str(customer_id),
        "email": email,
        "token_type": "buyer",
        "exp": expire,
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def require_buyer(
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
) -> Customer:
    """Decode and verify a buyer-scoped JWT bearer token."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Buyer authentication required")
    token = authorization.split(" ", 1)[1].strip()
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("token_type") != "buyer":
            raise HTTPException(status_code=401, detail="Invalid buyer session")
        customer_id = int(payload.get("sub", 0))
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=401, detail="Invalid or expired buyer session") from exc

    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=401, detail="Buyer account not found")
    return customer


def require_permission(module: str, action: str = "view"):
    """FastAPI dependency checking JWT auth and granular role permission matrix."""

    def _dependency(user: AdminUser = Depends(require_admin)) -> AdminUser:
        if user.role and user.role.slug == "super-admin":
            return user
        perms = (user.role.permissions or {}) if user.role else {}
        if module in perms and perms.get(module, {}).get(action):
            return user
        raise HTTPException(status_code=403, detail=f"Insufficient permission ({module}:{action})")

    return _dependency
