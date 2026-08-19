from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_password, create_access_token, decode_access_token
from app.models.models import User, Role, AuditLog
from app.schemas.schemas import LoginRequest, Token, UserResponse, PasswordChangeRequest, EmailChangeRequest
from fastapi.security import OAuth2PasswordBearer

router = APIRouter(prefix="/auth", tags=["auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user or user.status != "active":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User account inactive or not found")
    return user

from sqlalchemy import func

@router.post("/login", response_model=Token)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    identifier = (req.username_or_email or "").strip().lower()
    user_pass = (req.password or "").strip()

    user = db.query(User).filter(
        (func.lower(User.username) == identifier) | (func.lower(User.email) == identifier)
    ).first()
    
    if not user or not verify_password(user_pass, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username/email or password")
    
    access_token = create_access_token(subject=user.id)
    
    # Audit log
    audit = AuditLog(
        user_id=user.id,
        user_email=user.email,
        action="USER_LOGIN",
        record_type="User",
        record_id=str(user.id),
        details=f"User {user.username} logged in successfully"
    )
    db.add(audit)
    db.commit()
    
    role = db.query(Role).filter(Role.id == user.role_id).first()
    role_name = role.name if role else "Member"
    
    user_data = {
        "id": user.id,
        "email": user.email,
        "username": user.username,
        "full_name": user.full_name,
        "role_id": user.role_id,
        "role_name": role_name,
        "permissions": role.permissions if role else {}
    }
    
    return {"access_token": access_token, "token_type": "bearer", "user": user_data}

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    role = db.query(Role).filter(Role.id == current_user.role_id).first()
    res = UserResponse.from_orm(current_user)
    res.role_name = role.name if role else "Member"
    return res

@router.post("/change-password")
def change_password(req: PasswordChangeRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not verify_password(req.old_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect current password")
    from app.core.security import hash_password
    current_user.password_hash = hash_password(req.new_password)
    db.commit()
    
    audit = AuditLog(
        user_id=current_user.id,
        user_email=current_user.email,
        action="PASSWORD_CHANGE",
        record_type="User",
        record_id=str(current_user.id),
        details="User changed password"
    )
    db.add(audit)
    db.commit()
    return {"message": "Password updated successfully"}

@router.get("/users")
def get_users(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    users = db.query(User).all()
    res = []
    for u in users:
        role = db.query(Role).filter(Role.id == u.role_id).first()
        res.append({
            "id": u.id,
            "email": u.email,
            "username": u.username,
            "full_name": u.full_name,
            "role_id": u.role_id,
            "role_name": role.name if role else "Member",
            "status": u.status,
            "phone": u.phone,
            "created_at": u.created_at.isoformat() if u.created_at else None
        })
    return res

@router.put("/me/email")
def change_email(req: EmailChangeRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Verify current password before allowing email change
    if not verify_password(req.password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect password. Please confirm your current password.")

    # Ensure new email is not already taken by another user
    existing = db.query(User).filter(User.email == req.new_email, User.id != current_user.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="This email address is already in use by another account.")

    old_email = current_user.email
    current_user.email = req.new_email
    db.commit()
    db.refresh(current_user)

    audit = AuditLog(
        user_id=current_user.id,
        user_email=current_user.email,
        action="EMAIL_CHANGE",
        record_type="User",
        record_id=str(current_user.id),
        details=f"User changed email from {old_email} to {current_user.email}"
    )
    db.add(audit)
    db.commit()

    role = db.query(Role).filter(Role.id == current_user.role_id).first()
    return {
        "message": "Email updated successfully",
        "user": {
            "id": current_user.id,
            "email": current_user.email,
            "username": current_user.username,
            "full_name": current_user.full_name,
            "role_id": current_user.role_id,
            "role_name": role.name if role else "Member",
        }
    }

