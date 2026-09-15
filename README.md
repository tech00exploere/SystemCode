# Mini Job Queue Dashboard

A **Mini Job Queue Management System** built with **NestJS**, **Prisma (SQLite)**, and **React + JavaScript (Vite)**.

## Tech Stack

- **Backend**: NestJS + TypeScript + Prisma ORM + SQLite
- **Frontend**: React + JavaScript + Vite + Axios
- **Validation**: `class-validator` with strict DTO rules
- **Testing**: Vitest unit tests

## Project Structure

```
assesment/
├── backend/
│   ├── src/
│   │   ├── jobs/
│   │   │   ├── dto/
│   │   │   │   ├── create-job.dto.ts
│   │   │   │   └── update-job-status.dto.ts
│   │   │   ├── job-status.ts
│   │   │   ├── jobs.controller.ts
│   │   │   ├── jobs.module.ts
│   │   │   └── jobs.service.ts
│   │   ├── prisma/
│   │   │   ├── prisma.module.ts
│   │   │   └── prisma.service.ts
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── scripts/
│   │   └── benchmark-concurrency.ts
│   ├── prisma/
│   │   └── schema.prisma
│   ├── .env
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── MetricsHeader.jsx
    │   │   ├── JobFilter.jsx
    │   │   ├── JobTable.jsx
    │   │   ├── CreateJobModal.jsx
    │   │   └── ConcurrencyModal.jsx
    │   ├── services/
    │   │   └── api.js
    │   ├── App.jsx
    │   ├── index.css
    │   └── main.jsx
    └── package.json
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/jobs` | Create a new job |
| `GET` | `/jobs` | List all jobs (with `?status=`, `?page=`, `?limit=`) |
| `GET` | `/jobs/:id` | Get single job |
| `PATCH` | `/jobs/:id/status` | Update job status |
| `DELETE` | `/jobs/:id` | Delete job |
| `POST` | `/jobs/:id/simulate-concurrency` | Run concurrent stress test |

## Job State Transitions

```
pending ──→ running ──→ completed  (terminal)
   └──────────┴────────→ failed    (terminal)
```

State transitions are enforced server-side. `completed` and `failed` are locked.

## Concurrency Handling

Uses **Optimistic Concurrency Control (OCC)** via a `version` field.

```sql
UPDATE jobs SET status = ?, version = version + 1
WHERE id = ? AND status = ? AND version = ?
```

If 1000 requests fire simultaneously, only 1 succeeds — the rest get a clean `409 Conflict`.

**Benchmark result (1000 concurrent users):**
```
✅ Succeeded : 1
🔒 Conflicts : 999
⏱ Duration  : 467ms
⚡ Throughput: 2141 req/sec
```

## Local Setup

### Backend
```bash
cd backend
npm install
npm run dev           # starts at http://localhost:3000
```

### Frontend
```bash
cd frontend
npm install
npm run dev           # starts at http://localhost:5173
```

### Run Concurrency Benchmark
```bash
cd backend
npm run benchmark
```

## Environment Variables

```env
DATABASE_URL="file:./dev.db"
PORT=3000
```
