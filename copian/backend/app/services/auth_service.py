"""Authentication, session issuance, role permission matrix, and audit log services."""

from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.auth import create_access_token, hash_password, verify_password
from app.models import AdminUser, AuditLog, Role
from app.schemas import AdminUserCreate, AdminUserUpdate, LoginRequest, RoleUpdate


def serialize_auth_user(user: AdminUser) -> dict:
    """Serialize an authenticated AdminUser and role permissions cleanly."""
    return {
        "id": user.id,
        "name": user.name,
        "initials": user.initials,
        "email": user.email,
        "role": user.role.name,
        "role_slug": user.role.slug,
        "permissions": user.role.permissions,
    }


def authenticate_admin(db: Session, payload: LoginRequest) -> dict:
    """Validate credentials and issue a signed JWT bearer session."""
    user = db.query(AdminUser).filter(AdminUser.email == payload.email.strip().lower()).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account disabled")
    token = create_access_token(user.id, user.email, user.role.slug)
    return {"access_token": token, "token_type": "bearer", "user": serialize_auth_user(user)}


def issue_demo_session(db: Session, email: str) -> dict:
    """Issue a demo JWT session for the specified seeded active admin account."""
    user = (
        db.query(AdminUser)
        .filter(AdminUser.email == email.strip().lower(), AdminUser.is_active == True)
        .first()
    )
    if not user:
        user = db.query(AdminUser).filter(AdminUser.is_active == True).first()
    if not user:
        raise HTTPException(status_code=404, detail="No admin user configured")
    token = create_access_token(user.id, user.email, user.role.slug)
    return {"access_token": token, "token_type": "bearer", "user": serialize_auth_user(user)}


def get_roles_and_users(db: Session) -> dict:
    """Return all ERP RBAC roles alongside configured admin accounts."""
    roles = db.query(Role).order_by(Role.id).all()
    users = db.query(AdminUser).order_by(AdminUser.id).all()
    return {
        "roles": [
            {
                "id": r.id,
                "name": r.name,
                "slug": r.slug,
                "description": r.description,
                "permissions": r.permissions,
            }
            for r in roles
        ],
        "users": [
            {
                "id": u.id,
                "name": u.name,
                "initials": u.initials,
                "email": u.email,
                "role_id": u.role_id,
                "role_name": u.role.name if u.role else "",
                "is_active": u.is_active,
            }
            for u in users
        ],
    }


def update_role_permissions(db: Session, role_id: int, payload: RoleUpdate) -> dict:
    """Persist permission matrix updates for an ERP role and record an audit event."""
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    role.permissions = payload.permissions
    db.add(
        AuditLog(
            user_name="Arjun Mehta",
            action="UPDATE_ROLE_MATRIX",
            module="Roles & Permissions",
            entity_id=role.name,
            details=f"Updated permission matrix for {role.name}",
        )
    )
    db.commit()
    db.refresh(role)
    return {
        "id": role.id,
        "name": role.name,
        "slug": role.slug,
        "description": role.description,
        "permissions": role.permissions,
    }


def list_audit_logs(db: Session, limit: int = 25) -> list[dict]:
    """Fetch recent audit trail logs in reverse chronological order."""
    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit).all()
    return [
        {
            "id": log.id,
            "user_name": log.user_name,
            "action": log.action,
            "module": log.module,
            "entity_id": log.entity_id,
            "details": log.details,
            "created_at": log.created_at.isoformat(),
        }
        for log in logs
    ]


def create_admin_user(db: Session, payload: AdminUserCreate) -> dict:
    email = payload.email.strip().lower()
    if db.query(AdminUser).filter(AdminUser.email == email).first():
        raise HTTPException(status_code=400, detail="Admin email already registered")
    role = db.query(Role).filter(Role.id == payload.role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    parts = [p for p in payload.name.strip().split() if p]
    initials = "".join(p[0].upper() for p in parts[:2]) or "AD"
    user = AdminUser(
        name=payload.name.strip(),
        initials=initials,
        email=email,
        password_hash=hash_password(payload.password),
        role_id=role.id,
        is_active=True,
    )
    db.add(user)
    db.add(
        AuditLog(
            user_name="Arjun Mehta",
            action="CREATE_ADMIN_USER",
            module="Roles & Permissions",
            entity_id=email,
            details=f"Added {user.name} ({role.name})",
        )
    )
    db.commit()
    db.refresh(user)
    return {"id": user.id, "name": user.name, "email": user.email, "role_name": role.name}


def update_admin_user(db: Session, user_id: int, payload: AdminUserUpdate) -> dict:
    user = db.query(AdminUser).filter(AdminUser.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Admin user not found")
    if payload.role_id is not None:
        user.role_id = payload.role_id
    if payload.is_active is not None:
        user.is_active = payload.is_active
    db.commit()
    db.refresh(user)
    return {"id": user.id, "is_active": user.is_active, "role_id": user.role_id}
