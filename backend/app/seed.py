from sqlalchemy.orm import Session
from app.core.database import engine, Base, SessionLocal
from app.core.security import hash_password
from app.models.models import (
    Role, User, ServiceCategory, ServiceTaker, Client, Service, Invoice,
    InvoiceItem, Payment, ExpenseCategory, Expense, Notification, AuditLog
)

def seed_database():
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    # 1. Seed Roles
    roles_data = [
        {"name": "Founder / CEO", "description": "Highest authority with full access, management, deletion, audit logs", "permissions": {"all": True}},
        {"name": "Co-Founder / MD", "description": "Full operational access, services, clients, revenue, invoices, analytics, team", "permissions": {"all": True}},
        {"name": "Co-Founder / COO", "description": "Services, clients, revenue, invoices, payments, reports, operational analytics", "permissions": {"all": True}},
        {"name": "Business Development Officer", "description": "Authorized member to add clients, services, create invoices, record payments", "permissions": {"all": True}}
    ]

    role_map = {}
    for r in roles_data:
        existing = db.query(Role).filter(Role.name == r["name"]).first()
        if not existing:
            role = Role(name=r["name"], description=r["description"], permissions=r["permissions"])
            db.add(role)
            db.flush()
            role_map[r["name"]] = role.id
        else:
            role_map[r["name"]] = existing.id

    # 2. Seed 4 Authorized Users
    users_data = [
        {
            "email": "hariharansivakumar64@gmail.com",
            "username": "md_hari",
            "full_name": "Hari Haran V S",
            "role_name": "Co-Founder / MD"
        },
        {
            "email": "rubini29082006@gmail.com",
            "username": "ceo_rubini",
            "full_name": "Rubini T (CEO)",
            "role_name": "Founder / CEO"
        },
        {
            "email": "vrashika71@gmail.com",
            "username": "coo_rashika",
            "full_name": "Rashika V (COO)",
            "role_name": "Co-Founder / COO"
        },
        {
            "email": "dhanusyasegaran@gmail.com",
            "username": "cbdo_dhanusya",
            "full_name": "Dhanusya D (CBDO)",
            "role_name": "Business Development Officer"
        }
    ]

    for u in users_data:
        existing_user = db.query(User).filter(
            (User.email == u["email"]) | (User.username == u["username"])
        ).first()
        
        if not existing_user:
            user = User(
                email=u["email"],
                username=u["username"],
                password_hash=hash_password("auralix123"),
                full_name=u["full_name"],
                role_id=role_map.get(u["role_name"], 1),
                status="active"
            )
            db.add(user)
        else:
            existing_user.password_hash = hash_password("auralix123")
            existing_user.status = "active"
    db.commit()

    # 3. Seed Service Categories
    categories = [
        "AI & Machine Learning", "Data Science", "Data Analytics", "Web Development",
        "Full Stack Development", "Mobile Application Development", "Cybersecurity",
        "Ethical Hacking", "Cloud Solutions", "UI/UX Design", "Automation",
        "Consulting", "Portfolio Development", "Resume Development", "Software Development",
        "Custom Solutions", "Other"
    ]
    for cat_name in categories:
        if not db.query(ServiceCategory).filter(ServiceCategory.name == cat_name).first():
            db.add(ServiceCategory(name=cat_name, description=f"{cat_name} services for clients"))

    # 4. Seed Expense Categories
    expense_cats = ["Software", "Hosting", "Domain", "Marketing", "Office", "Travel", "Equipment", "Salaries", "Advertising", "Training", "Miscellaneous"]
    for ec in expense_cats:
        if not db.query(ExpenseCategory).filter(ExpenseCategory.name == ec).first():
            db.add(ExpenseCategory(name=ec, description=f"{ec} expense category"))

    # 5. Seed Team Members / Service Takers
    takers_data = [
        {"name": "Hari Haran V S", "role": "Managing Director", "email": "hariharansivakumar64@gmail.com"},
        {"name": "Rubini T", "role": "Chief Executive Officer", "email": "rubini29082006@gmail.com"},
        {"name": "Rashika V", "role": "Chief Operation Officer", "email": "vrashika71@gmail.com"},
        {"name": "Dhanusya D", "role": "Chief Business Development Officer", "email": "dhanusyasegaran@gmail.com"}
    ]
    for tk in takers_data:
        if not db.query(ServiceTaker).filter(ServiceTaker.name == tk["name"]).first():
            db.add(ServiceTaker(name=tk["name"], role=tk["role"], email=tk["email"]))

    db.commit()
    db.close()
    print("Database seeded cleanly with updated authority users and team members.")

if __name__ == "__main__":
    seed_database()
