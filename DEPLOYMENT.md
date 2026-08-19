# 🚀 Auralix RevenueHub — Production Deployment Guide

This guide covers deployment options for **Auralix RevenueHub** (FastAPI backend + React Vite frontend). Choose the deployment method that best suits your infrastructure.

---

## 🛠️ Method 1: Docker Compose (Recommended for 1-Click Server Setup)

The easiest way to run the entire stack (Backend + Nginx Frontend) with volume persistence for SQLite or external database configuration.

### Prerequisites
- [Docker Engine](https://docs.docker.com/get-docker/) (v20+)
- [Docker Compose](https://docs.docker.com/compose/install/) (v2+)

### Steps

1. **Clone & Environment Setup**:
   ```bash
   cp .env.example .env
   ```
   *Edit `.env` to set your custom `SECRET_KEY`.*

2. **Build and Launch Containers**:
   ```bash
   docker compose up --build -d
   ```

3. **Access Services**:
   - **Frontend UI**: `http://localhost:3000`
   - **Backend API**: `http://localhost:8000`
   - **API Docs (Swagger)**: `http://localhost:8000/docs`
   - **Healthcheck**: `http://localhost:8000/health`

4. **Stop Containers**:
   ```bash
   docker compose down
   ```

---

## ☁️ Single-Link Cloud Deployment (Render.com)

The project includes a unified `render.yaml` Blueprint that deploys **both the Frontend UI and Backend API on a SINGLE URL** (e.g. `https://auralix-revenuehub.onrender.com`).

### Steps for 1-Click Render Deployment:
1. Push your repository to **GitHub** or **GitLab**.
2. Log into **[Render.com](https://render.com/)**.
3. Click **New +** (top right) -> Select **Blueprint**.
4. Select your repository. Render automatically reads `render.yaml` and spins up:
   - 🗄️ **Managed PostgreSQL Database** (`auralix-db`)
   - 🌐 **Single Unified Web Service** (`auralix-revenuehub`) serving both React UI and FastAPI backend API on 1 link.
5. Click **Apply**. Once finished, your single link URL will be live!

---

### B. Vercel (Frontend) + Render / Railway (Backend)

#### 1. Deploy Backend (Render / Railway / Fly.io):
- **Build Command**: `pip install -r backend/requirements.txt`
- **Start Command**: `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Environment Variables**:
  - `SECRET_KEY`: (Secure random 32+ char string)
  - `DATABASE_URL`: (PostgreSQL connection string or SQLite path)
  - `CORS_ORIGINS`: `https://your-frontend.vercel.app`

#### 2. Deploy Frontend (Vercel):
- Import the `frontend` folder into [Vercel](https://vercel.com).
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Environment Variables**:
  - `VITE_API_BASE_URL`: `https://your-backend-service.onrender.com/api/v1`

### C. Netlify (Frontend)
- The repo includes `frontend/netlify.toml` pre-configured with SPA redirect rules (`/*` -> `/index.html`).
- Set `VITE_API_BASE_URL` in your Netlify site settings.

---

## 💻 Method 3: Manual Bare-Metal / VPS Deployment (Ubuntu / Systemd + Nginx)

### 1. Backend Service Setup (Systemd)

Create `/etc/systemd/system/auralix-backend.service`:
```ini
[Unit]
Description=Auralix RevenueHub FastAPI Service
After=network.target

[Service]
User=www-data
WorkingDirectory=/var/www/auralix/backend
ExecStart=/var/www/auralix/backend/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 4
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable & start backend service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now auralix-backend
```

### 2. Frontend Build Setup
```bash
cd frontend
npm install
npm run build
```
Copy `dist` contents to `/var/www/auralix/frontend/dist`.

### 3. Nginx Server Configuration
Create `/etc/nginx/sites-available/auralix`:
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    root /var/www/auralix/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
Link and reload Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/auralix /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🔒 Security Best Practices Checklist

- [ ] Change default `SECRET_KEY` in environment variables.
- [ ] Set exact `CORS_ORIGINS` (e.g. `https://revenue.auralix.com`) instead of `*`.
- [ ] Enable HTTPS using free SSL certificates via [Certbot / Let's Encrypt](https://certbot.eff.org/).
- [ ] Use a managed PostgreSQL database for multi-instance scaling and automatic backups.
