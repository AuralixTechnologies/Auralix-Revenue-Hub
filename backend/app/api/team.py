from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.models import ServiceTaker, Service, Role, AuditLog
from app.schemas.schemas import ServiceTakerCreate, ServiceTakerUpdate, ServiceTakerResponse, RoleSchema, RoleCreate, RoleUpdate
from app.api.auth import get_current_user, User

router = APIRouter(prefix="/team", tags=["team"])

# --- Roles Management ---
@router.get("/roles", response_model=List[RoleSchema])
def get_roles(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Role).all()

@router.post("/roles", response_model=RoleSchema)
def create_role(role_in: RoleCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    role = Role(name=role_in.name, description=role_in.description, permissions={"all": True})
    db.add(role)
    db.commit()
    db.refresh(role)

    audit = AuditLog(
        user_id=current_user.id,
        user_email=current_user.email,
        action="CREATE_ROLE",
        record_type="Role",
        record_id=str(role.id),
        details=f"Created authority role '{role.name}'"
    )
    db.add(audit)
    db.commit()
    return role

@router.put("/roles/{role_id}", response_model=RoleSchema)
def update_role(role_id: int, role_in: RoleUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    if role_in.name:
        role.name = role_in.name
    if role_in.description is not None:
        role.description = role_in.description
        
    db.commit()
    db.refresh(role)

    audit = AuditLog(
        user_id=current_user.id,
        user_email=current_user.email,
        action="UPDATE_ROLE",
        record_type="Role",
        record_id=str(role.id),
        details=f"Updated role '{role.name}'"
    )
    db.add(audit)
    db.commit()
    return role

@router.delete("/roles/{role_id}")
def delete_role(role_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    role_name = role.name
    # Re-assign any user referencing this role to fallback role 1
    users_with_role = db.query(User).filter(User.role_id == role_id).all()
    for u in users_with_role:
        u.role_id = 1

    db.delete(role)
    db.commit()

    audit = AuditLog(
        user_id=current_user.id,
        user_email=current_user.email,
        action="DELETE_ROLE",
        record_type="Role",
        record_id=str(role_id),
        details=f"Deleted authority role '{role_name}'"
    )
    db.add(audit)
    db.commit()
    return {"message": f"Role '{role_name}' deleted successfully"}

# --- Team Members (Service Takers) ---
@router.get("", response_model=List[ServiceTakerResponse])
def get_service_takers(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    takers = db.query(ServiceTaker).all()
    res = []
    for tk in takers:
        services = db.query(Service).filter(Service.service_taker_id == tk.id).all()
        total_services = len(services)
        completed = sum(1 for s in services if s.payment_status == "Paid")
        pending = total_services - completed
        total_rev = sum(s.final_amount for s in services)

        item = ServiceTakerResponse.from_orm(tk)
        item.total_services = total_services
        item.completed_services = completed
        item.pending_services = pending
        item.total_revenue = round(total_rev, 2)
        res.append(item)
    return res

@router.post("", response_model=ServiceTakerResponse)
def create_service_taker(taker_in: ServiceTakerCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    tk = ServiceTaker(
        name=taker_in.name,
        role=taker_in.role,
        email=taker_in.email,
        phone=taker_in.phone,
        specialization=taker_in.specialization,
        status=taker_in.status or "active"
    )
    db.add(tk)
    db.commit()
    db.refresh(tk)

    audit = AuditLog(
        user_id=current_user.id,
        user_email=current_user.email,
        action="CREATE_SERVICE_TAKER",
        record_type="ServiceTaker",
        record_id=str(tk.id),
        details=f"Added team member '{tk.name}' ({tk.role})"
    )
    db.add(audit)
    db.commit()

    item = ServiceTakerResponse.from_orm(tk)
    item.total_services = 0
    item.completed_services = 0
    item.pending_services = 0
    item.total_revenue = 0.0
    return item

@router.put("/{taker_id}", response_model=ServiceTakerResponse)
def update_service_taker(taker_id: int, taker_in: ServiceTakerUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    tk = db.query(ServiceTaker).filter(ServiceTaker.id == taker_id).first()
    if not tk:
        raise HTTPException(status_code=404, detail="Team member not found")

    update_data = taker_in.dict(exclude_unset=True)
    for field, val in update_data.items():
        setattr(tk, field, val)

    db.commit()
    db.refresh(tk)

    audit = AuditLog(
        user_id=current_user.id,
        user_email=current_user.email,
        action="UPDATE_SERVICE_TAKER",
        record_type="ServiceTaker",
        record_id=str(tk.id),
        details=f"Updated team member '{tk.name}' ({tk.role})"
    )
    db.add(audit)
    db.commit()

    services = db.query(Service).filter(Service.service_taker_id == tk.id).all()
    total_services = len(services)
    completed = sum(1 for s in services if s.payment_status == "Paid")
    pending = total_services - completed
    total_rev = sum(s.final_amount for s in services)

    item = ServiceTakerResponse.from_orm(tk)
    item.total_services = total_services
    item.completed_services = completed
    item.pending_services = pending
    item.total_revenue = round(total_rev, 2)
    return item

@router.delete("/{taker_id}")
def delete_service_taker(taker_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    tk = db.query(ServiceTaker).filter(ServiceTaker.id == taker_id).first()
    if not tk:
        raise HTTPException(status_code=404, detail="Team member not found")

    db.delete(tk)
    db.commit()
    return {"message": "Team member deleted successfully"}
