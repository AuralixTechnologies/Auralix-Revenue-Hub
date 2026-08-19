# 🚀 Auralix RevenueHub — Enterprise Revenue & Business Tracker

An enterprise-grade Revenue, Client, Service & Invoice Management System built for **Auralix Technologies**. Features real-time financial dashboards, custom interactive PDF invoice generation, expense tracking, and authority governance.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Framer Motion, Recharts, Lucide Icons
- **Backend**: FastAPI (Python 3.10+), SQLAlchemy, Uvicorn, ReportLab (PDF Generation), JWT Security

---

## 📂 Project Structure

```text
Revenue Tracker/
├── backend/
│   ├── app/
│   │   ├── api/          # FastAPI routers (auth, clients, invoices, services, etc.)
│   │   ├── core/         # Security, Database session & Configuration
│   │   ├── models/       # SQLAlchemy database models
│   │   ├── schemas/      # Pydantic data schemas
│   │   └── utils/        # PDF Generator & Export helpers
│   ├── main.py           # App entrypoint & middleware
│   └── requirements.txt  # Python backend dependencies
├── frontend/
│   ├── src/
│   │   ├── components/   # UI & Shared Components
│   │   ├── pages/        # Dashboard, Invoices, Generator, Clients, Team, etc.
│   │   ├── services/     # Axios API service
│   │   └── types/        # TypeScript Interfaces
│   └── package.json      # Frontend package configuration
└── RUN_COMMANDS.md       # Quick command reference
```

---

## ⚡ Quick Start (Local Setup)

### 1. Backend Setup

```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```
> Backend running at: `http://127.0.0.1:8000`  
> API Documentation: `http://127.0.0.1:8000/docs`

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```
> Frontend running at: `http://localhost:5173`

---

## 🐳 1-Click Docker Deployment

Run the entire application stack (Backend + Nginx Frontend) instantly:

```bash
docker compose up --build -d
```

- **Frontend**: `http://localhost:3000`
- **Backend API**: `http://localhost:8000`
- **API Documentation**: `http://localhost:8000/docs`

For detailed production deployment options (Render, Vercel, Netlify, Railway, Nginx VPS), check out the [Deployment Guide](file:///f:/Auralix/Revenue%20Tracker/DEPLOYMENT.md).

---

## ✨ Key Features

- **Interactive Invoice Generator**: Enter required services & spent project costs with live paper document preview.
- **Automated Sequential Invoice Counting**: Auto-increments invoice numbers sequentially (`AUR-INV-2026-0001`...).
- **Corporate PDF Export**: Instant ReportLab PDF downloading with *Business Development Executive* authorized signature.
- **Client & Service Management**: Full CRUD for corporate clients, pricing packages, and team service takers.
- **Revenue Analytics**: Real-time KPI summary, monthly breakdowns, and revenue/expense charts.
- **Company Brand Profile**: Editable company information persistent in system database.
