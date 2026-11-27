from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.auth import ENABLE_DEMO_AUTH, get_current_admin_optional, require_permission
from app.database import get_db
from app.models import AdminUser
from app.schemas import AdminUserCreate, AdminUserUpdate, LoginRequest, RoleUpdate
from app.security import rate_limit
from app.services import auth_service

router = APIRouter(prefix="/api", tags=["auth-roles"])


@router.post("/auth/login", dependencies=[Depends(rate_limit("auth_login", max_calls=15, window_seconds=60))])
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    return auth_service.authenticate_admin(db, payload)


@router.get("/auth/demo-session")
def demo_session(email: str = "arjun@copian.in", db: Session = Depends(get_db)):
    """Issues a valid JWT session for the selected seeded admin account when demo auth is enabled."""
    if not ENABLE_DEMO_AUTH:
        raise HTTPException(status_code=403, detail="Demo session issuance is disabled in production")
    return auth_service.issue_demo_session(db, email)


@router.get("/auth/me")
def get_me(user: AdminUser = Depends(get_current_admin_optional)):
    if not user:
        return {"authenticated": False, "user": None}
    return {"authenticated": True, "user": auth_service.serialize_auth_user(user)}


@router.get("/roles")
def list_roles(
    _admin: AdminUser = Depends(require_permission("Roles & Permissions", "view")),
    db: Session = Depends(get_db),
):
    return auth_service.get_roles_and_users(db)


@router.put("/roles/{role_id}")
def update_role(
    role_id: int,
    payload: RoleUpdate,
    _admin: AdminUser = Depends(require_permission("Roles & Permissions", "edit")),
    db: Session = Depends(get_db),
):
    return auth_service.update_role_permissions(db, role_id, payload)


@router.get("/audit-logs")
def list_audit_logs(
    limit: int = 25,
    _admin: AdminUser = Depends(require_permission("Roles & Permissions", "view")),
    db: Session = Depends(get_db),
):
    return auth_service.list_audit_logs(db, limit)


@router.post("/roles/users")
def create_admin_user(
    payload: AdminUserCreate,
    _admin: AdminUser = Depends(require_permission("Roles & Permissions", "create")),
    db: Session = Depends(get_db),
):
    return auth_service.create_admin_user(db, payload)


@router.patch("/roles/users/{user_id}")
def update_admin_user(
    user_id: int,
    payload: AdminUserUpdate,
    _admin: AdminUser = Depends(require_permission("Roles & Permissions", "edit")),
    db: Session = Depends(get_db),
):
    return auth_service.update_admin_user(db, user_id, payload)
