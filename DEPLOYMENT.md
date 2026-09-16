# Low-Level System Design (LLD) Platform — Deployment Guide

This guide provides step-by-step instructions for deploying the LLD Practice Platform to production.

---

## 🚀 Option 1: One-Click Docker Compose Deployment

The fastest way to deploy the complete full-stack application on any VPS (AWS EC2, DigitalOcean, Hetzner, GCP) is using **Docker Compose**.

### Prerequisites
- Docker & Docker Compose installed on your host machine / VPS.

### Execution Steps
```bash
# 1. Clone your repository
git clone <your-repo-url>
cd assesment

# 2. Set your environment variables (optional for AI feedback)
export GEMINI_API_KEY="your-gemini-api-key"

# 3. Build and launch services
docker-compose up -d --build
```
- **Frontend App**: Accessible at `http://<your-server-ip>` (Port 80)
- **Backend API**: Accessible at `http://<your-server-ip>:3001/api`
- **Health Check**: `http://<your-server-ip>:3001/api/health`

---

## 🌐 Option 2: Render / Railway Deployment

### A. Deploy Backend (NestJS + SQLite)
1. Sign in to [Render](https://render.com) or [Railway](https://railway.app).
2. Create a new **Web Service** and link your Git repository.
3. Set **Root Directory**: `backend`
4. **Build Command**: `npm install && npx prisma generate && npm run build`
5. **Start Command**: `npm run start:prod` (runs `node dist/main.js`)
6. Add Environment Variables:
   - `PORT`: `3001`
   - `DATABASE_URL`: `file:./dev.db`
   - `GEMINI_API_KEY`: `<your-gemini-api-key>`
   - `FRONTEND_URL`: `https://your-frontend-domain.com`

### B. Deploy Frontend (Vite + React)
1. Sign in to [Vercel](https://vercel.com) or [Netlify](https://netlify.com) or [Render Static Site].
2. Create a new project pointing to your Git repository.
3. Set **Root Directory**: `frontend`
4. **Build Command**: `npm run build`
5. **Output Directory**: `dist`
6. Add Environment Variable:
   - `VITE_API_BASE_URL`: `https://your-backend-render-url.onrender.com/api`

---

## 🛠 Option 3: Manual Server Setup (Ubuntu / Linux)

```bash
# 1. Setup Backend
cd backend
npm ci
npx prisma db push
npx ts-node prisma/seed.ts
npm run build
pm2 start dist/main.js --name "lld-backend"

# 2. Setup Frontend
cd ../frontend
npm ci
VITE_API_BASE_URL="http://localhost:3001/api" npm run build
```

---

## ✅ Deployment Health Verification

After deployment, verify that:
1. Health endpoint responds: `GET /api/health` -> `{"status":"ok"}`
2. Problems listing endpoint works: `GET /api/problems` -> returns 3 seed problems.
3. Frontend page loads cleanly and connects to backend without CORS errors.
