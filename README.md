# Mini Job Queue Dashboard

A small job queue dashboard built for the React + NestJS internship assignment.

It lets you create jobs, view them, filter by status, update their status and delete them.

## Tech Stack

* **Frontend:** React, JavaScript, Vite, Axios
* **Backend:** NestJS, TypeScript
* **Database:** SQLite with Prisma
* **Validation:** class-validator
* **Tests:** Vitest

## Project Structure

```text
assesment/
├── backend/
│   ├── src/
│   │   ├── jobs/
│   │   │   ├── dto/
│   │   │   ├── job-status.ts
│   │   │   ├── jobs.controller.ts
│   │   │   ├── jobs.service.ts
│   │   │   └── jobs.module.ts
│   │   ├── prisma/
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── prisma/
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   ├── services/
    │   ├── App.jsx
    │   └── main.jsx
    └── package.json
```

## API

| Method | Endpoint           | Purpose           |
| ------ | ------------------ | ----------------- |
| POST   | `/jobs`            | Create a job      |
| GET    | `/jobs`            | Get all jobs      |
| PATCH  | `/jobs/:id/status` | Change job status |
| DELETE | `/jobs/:id`        | Delete a job      |

## Status Flow

```text
pending → running → completed
   ↓
 failed
```

Status changes are checked on the backend.
`completed` and `failed` are final states.

## Concurrency

The status transition rule is enforced by the backend, not just the UI.

A `version` field is used for optimistic concurrency control. When two requests try to change the same pending job at the same time, only one update can succeed. The other request gets a `409 Conflict`.

This also prevents someone from bypassing the frontend and calling the API directly with an invalid state change.

## Validation & Errors

* Required fields are validated before creating a job.
* Invalid status values are rejected.
* Invalid state transitions are rejected.
* Missing jobs return an appropriate error.
* API errors are shown on the frontend.

## Run Locally

### Backend

```bash
cd backend
npm install
npm run dev
```

Runs on `http://localhost:3000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs on `http://localhost:5173`.

### Environment

```env
DATABASE_URL="file:./dev.db"
PORT=3000
```

## Assumptions

* SQLite is used to keep the setup simple for this assignment.
* Jobs are stored permanently in the database.
* No authentication is added because it was not required.

## Possible Improvements

For a larger system, I would consider PostgreSQL, authentication, pagination and a real background worker for processing jobs.
