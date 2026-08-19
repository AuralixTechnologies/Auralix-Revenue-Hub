# 🚀 Auralix RevenueHub — Quick Run Guide

## Prerequisites

- **Node.js** (v18+) — for the frontend
- **Python** (v3.10+) — for the backend

---

## 🔑 Default Authority Login Credentials

The database is automatically seeded on startup with the following 4 authority accounts (Password for all: `auralix123`):

| Role | Username | Email | Full Name |
| :--- | :--- | :--- | :--- |
| **Founder / CEO** | `ceo_rubini` | `rubini29082006@gmail.com` | Rubini T |
| **Co-Founder / MD** | `md_hari` | `hariharansivakumar64@gmail.com` | Hari Haran V S |
| **Co-Founder / COO** | `coo_rashika` | `vrashika71@gmail.com` | Rashika V |
| **Business Development Officer** | `cbdo_dhanusya` | `dhanusyasegaran@gmail.com` | Dhanusya D |

*Tip: On the frontend login page, click any **Quick Login** button to auto-fill credentials!*

---

## 🔗 Single Link Mode (Frontend + Backend on 1 URL)

You can run both Frontend and Backend on **a single URL** (`http://127.0.0.1:8000`):

1. **Build Frontend**:
   ```powershell
   cd "frontend"
   npm run build
   ```

2. **Start Unified Server**:
   ```powershell
   cd "backend"
   python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
   ```

3. **Access Everything at 1 Link**:
   - 🌐 **Single Link (UI & API)**: **http://127.0.0.1:8000**
   - 📑 **Interactive API Docs**: **http://127.0.0.1:8000/docs**

---

## 💻 Development Mode (Two Terminals with Hot Reload)

If you are developing frontend features with hot-reloading:

### Terminal 1 — Backend (FastAPI)
```powershell
cd "backend"
python -m uvicorn app.main:app --reload --port 8000
```

### Terminal 2 — Frontend (Vite React)
```powershell
cd "frontend"
npm run dev
```
> Access UI at: **http://localhost:5173**


