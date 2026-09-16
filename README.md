# Low-Level System Design (LLD) Practice Platform

A full-stack low-level system design platform with hybrid rule-based and AI evaluation, real-time timer, state machine tracking, and Docker deployment.

---

## 🏗 Stack Overview

- **Frontend**: React 19, TypeScript, Vite, React Router 7, Vanilla CSS Design System.
- **Backend**: NestJS 12, TypeScript, Prisma ORM, SQLite (`dev.db`).
- **Evaluation Engine**: Dual-layer hybrid architecture (40% deterministic rule verification + 60% Gemini AI architecture reasoning).

---

## ⚡ Quick Start

### 1. Setup Backend
```bash
cd backend
npm install
npx prisma db push
npm run db:seed
npm run dev
```
Backend server runs at `http://localhost:3001/api`.

### 2. Setup Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend app runs at `http://localhost:5173`.

---

## 🧪 Testing & Build Verification

```bash
# Run Backend Unit Tests (7/7 Passing)
cd backend && npm run test

# Run Frontend Production Build
cd frontend && npm run build
```

---

## 🐳 Docker Deployment

```bash
# Deploy full stack with Docker Compose
docker-compose up -d --build
```

---

## 📄 Documentation & Audits

- **[ARCHITECTURE_AUDIT.md](ARCHITECTURE_AUDIT.md)** — Architectural design review & guidelines compliance audit.
- **[DEPLOYMENT.md](DEPLOYMENT.md)** — Production deployment guide for Docker, Render, Vercel, Railway, and VPS.
