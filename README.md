# AutoQRPass — Vehicle Entry Permit System

A full-stack permit management system for foreign vehicles entering Singapore. These drivers apply for entry permits, upload supporting documents and receive a scannable QR code. LTA officers review applications and scan QR codes at checkpoints (i.e. Woodlands, Tuas).

---

## System Overview

```
┌─────────────────────┐        ┌──────────────────────┐
│   React Frontend    │◄─────►│   Flask REST API      │
│   (Vite + Tailwind) │  JWT  │   /api/v1/...         │
└─────────────────────┘        └──────────┬───────────┘
                                           │ SQLAlchemy ORM
                                           ▼
                                ┌──────────────────────┐
                                │     PostgreSQL DB     │
                                │  (Docker container)   │
                                └──────────────────────┘
```

### User Roles

| Role | Description |
|------|-------------|
| **Driver** | Driver with foreign vehicle — submits permit applications, uploads documents, generates QR codes |
| **Officer** | LTA officer — reviews applications, approves/rejects, scans QR codes at checkpoints |

---

## Features

**Driver Portal**
- ✅ Multi-step application wizard (Vehicle Info → Documents → Payment & Review)
- ✅ Document uploads: vehicle photos, IC/passport, employment pass, registration cert, road tax, insurance cert
- ✅ Real-time application status dashboard
- ✅ QR code generation for approved permits
- ✅ Permit expiry tracking and notifications

**Officer Portal**
- ✅ Application review queue
- ✅ Approve / reject with decision reason
- ✅ QR code scanning at checkpoints
- ✅ Crossing log with location, device, and timestamp

**Auth & Security**
- ✅ Role-based access control (Driver / Officer)
- ✅ JWT access tokens (1 hour expiry)
- ✅ Refresh tokens in HTTP-only cookies (7 days)
- ✅ bcrypt password hashing (12 rounds)
- ✅ QR token hashing — raw tokens never stored
- ✅ Full QR issuance and scan audit trail

---

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (required)
- No local Python or PostgreSQL installation needed — Docker handles everything

---

## Quick Start

### 1. Clone the repository

```bash
git clone <repo-url>
cd AGILE-VEP-BACKEND
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```env
# Flask
FLASK_APP=app
FLASK_ENV=development
SECRET_KEY=your-random-secret-key-change-in-production

# Database — matches docker-compose.yml service name
DATABASE_URL=postgresql://vep_user:vep_password@db:5432/vep_db

# JWT
JWT_SECRET_KEY=your-jwt-secret-key-change-in-production
JWT_ACCESS_TOKEN_EXPIRES=3600

# CORS — add your frontend origin
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

> **Note:** `db` in the `DATABASE_URL` refers to the PostgreSQL Docker service name defined in `docker-compose.yml`. Do not use `localhost` here.

### 3. Build and start all containers

```bash
docker compose up --build
```

This starts three containers:
- `db` — PostgreSQL 15
- `backend` — Flask API on port `5000`
- `frontend` — Vite dev server on port `5173`

> On first run, Docker will pull base images and install dependencies. This takes 2–3 minutes.

### 4. Seed the database

In a separate terminal, while the containers are running:

```bash
docker compose exec backend python seed.py
```

This creates all tables and populates demo users, vehicles, applications, and notifications.

**Demo credentials:**

| Role | Email | Password |
|------|-------|----------|
| Driver | `mdriver1@gmail.com` | `password 1` |
| Driver | `mdriver2@gmail.com` | `password 2` |
| Driver | `mdriver3@gmail.com` | `password 3` |
| Officer | `officer1@lta.gov.sg` | `password 1` |
| Officer | `officer2@lta.gov.sg` | `password 2` |
| Officer | `officer3@lta.gov.sg` | `password 3` |

Driver 1 (`mdriver1`) has 5 seeded vehicles covering all status states: **Active**, **Expired insurance**, **Pending Review**, **Rejected**, and **Expiring Soon**.

### 5. Open the app

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:5000 |
| Swagger UI (dev only) | http://localhost:5000/api/docs |

---

## Stopping and restarting

```bash
# Stop containers (preserves data)
docker compose down

# Stop and wipe the database volume (full reset)
docker compose down -v

# Restart without rebuilding
docker compose up
```

---

## Database

### Inspect tables (while containers are running)

```bash
# Connect to the PostgreSQL container
docker compose exec db psql -U vep_user -d vep_db

# Inside psql:
\dt                      -- list all tables
\d applications          -- describe a specific table
\d users
\d vehicles
\q                       -- exit
```

### Schema overview

| Table | Description |
|-------|-------------|
| `users` | Drivers and officers with role, contact info, NRIC/passport |
| `vehicles` | Malaysian vehicles linked to a driver |
| `applications` | Permit applications with status lifecycle |
| `payments` | Payment records linked to applications |
| `notifications` | In-app notifications per user |
| `qr_codes` | Issued QR credentials (hashed token, status, expiry) |
| `qr_issue_audits` | Audit log of every QR generation event |
| `qr_scan_logs` | Checkpoint scan log with officer, device, location, and result |

### Application status lifecycle

```
DRAFT → SUBMITTED → PENDING_REVIEW → APPROVED
                                   → REJECTED
```

### QR code status lifecycle

```
active → used      (consumed at checkpoint)
       → expired   (past expiry timestamp)
       → revoked   (manually invalidated)
```

---

## API Reference

All endpoints are prefixed with `/api/v1`.

### Auth — `/api/v1/auth`

| Method | Endpoint | Description | Auth required |
|--------|----------|-------------|---------------|
| POST | `/register` | Register new user | No |
| POST | `/login` | Login, returns JWT + sets refresh cookie | No |
| POST | `/refresh-token` | Rotate access token using refresh cookie | Cookie |
| GET | `/me` | Get current user profile | Bearer token |
| POST | `/logout` | Revoke all refresh tokens | Bearer token |

### Applications — `/api/v1/applications`

| Method | Endpoint | Description | Auth required |
|--------|----------|-------------|---------------|
| GET | `/` | List applications (filtered by role) | Bearer token |
| POST | `/` | Create application + vehicle in one call | Bearer token |
| POST | `/:id/submit` | Submit a draft application | Bearer token |
| PATCH | `/:id/review` | Approve or reject (officer only) | Bearer token |

### Register example

```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "driver@example.com",
    "password": "securepass123",
    "full_name": "Ahmad Ismail",
    "phone_number": "+60123456789",
    "nric_passport": "XXXXXX-XX-5432"
  }'
```

### Login example

```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "mdriver1@gmail.com", "password": "password 1"}'
```

---

## Project Structure

```
AGILE-VEP-BACKEND/
├── frontend/                        # React + Vite frontend
│   ├── api/                         # API service layer
│   ├── Auth/                        # Auth context and hooks
│   ├── components/                  # Shared UI components
│   ├── context/                     # React context providers
│   ├── pages/                       # Page components
│   │   ├── Dashboard.tsx            # Driver dashboard with permit status table
│   │   └── ApplicationWizard.tsx    # 3-step application form
│   ├── services/                    # Frontend service utilities
│   ├── public/
│   │   └── favicon.svg              # Car favicon
│   ├── App.tsx
│   ├── index.html
│   ├── index.tsx
│   ├── types.ts
│   └── vite.config.ts
├── app/                             # Flask application
│   ├── __init__.py                  # App factory
│   ├── config.py                    # Dev / prod configuration
│   ├── extensions.py                # DB, JWT, bcrypt extensions
│   ├── models/
│   │   ├── user.py                  # User model (Driver / Officer roles)
│   │   ├── vehicle.py               # Vehicle model
│   │   ├── application.py           # Application + status lifecycle
│   │   ├── payment.py               # Payment records
│   │   └── notification.py          # Notifications
│   └── api/v1/
│       ├── auth.py                  # Auth endpoints
│       └── applications.py          # Application endpoints
├── migrations/                      # Flask-Migrate scripts
├── services/                        # Backend service layer
├── seed.py                          # Database seeder
├── run.py                           # Flask entrypoint
├── docker-compose.yml
├── Dockerfile
├── entrypoint.sh
├── requirements.txt
├── .env                             # Local env vars (not in git)
├── .env.example
└── README.md
```

---

## Environment Configuration

### JWT settings

```python
JWT_ACCESS_TOKEN_EXPIRES  = 3600      # 1 hour
JWT_REFRESH_TOKEN_EXPIRES = 604800    # 7 days
JWT_TOKEN_LOCATION        = ['headers', 'cookies']
JWT_COOKIE_SECURE         = True      # HTTPS only (set False in dev)
JWT_COOKIE_HTTPONLY       = True      # Not accessible via JavaScript
JWT_COOKIE_SAMESITE       = 'Strict'  # CSRF protection
```

### Config hierarchy

1. **Base Config** — JWT settings, CORS, common values
2. **DevelopmentConfig** — `DEBUG=True`, SQL logging, Swagger UI enabled
3. **ProductionConfig** — `DEBUG=False`, Swagger disabled, requires `DATABASE_URL`

---

## Common Issues

### Containers fail to start — port already in use

```bash
# Check what's using port 5000 or 5173
lsof -i :5000
lsof -i :5173

# Kill the process or change the port mapping in docker-compose.yml
```

### Database connection error inside the container

Ensure `DATABASE_URL` uses the Docker service name `db`, not `localhost`:

```env
# ✅ Correct
DATABASE_URL=postgresql://vep_user:vep_password@db:5432/vep_db

# ❌ Wrong — localhost doesn't resolve to the db container
DATABASE_URL=postgresql://vep_user:vep_password@localhost:5432/vep_db
```

### Changes not reflected after editing code

The frontend Vite dev server supports hot reload automatically. For backend changes:

```bash
docker compose restart backend
```

### Full reset (wipe all data and rebuild)

```bash
docker compose down -v --rmi local
docker compose up --build
docker compose exec backend python seed.py
```

### Swagger UI not loading

Swagger is only available in development mode. Ensure `.env` has:

```env
FLASK_ENV=development
```

---

## Security Notes

| Area | Implementation |
|------|----------------|
| Passwords | bcrypt, 12 rounds, never logged |
| Access tokens | JWT, signed, 1 hour TTL |
| Refresh tokens | Random string, stored in DB + HTTP-only cookie, revocable |
| QR tokens | SHA-256 hashed before storage — raw token never persisted |
| QR scanning | Full audit log per scan (officer, device, location, latency, result) |
| CORS | Restricted to origins in `ALLOWED_ORIGINS` |
| HTTPS | `JWT_COOKIE_SECURE=True` enforced in production |

---

## Production Checklist

- [ ] Rotate all secrets in `.env` (`SECRET_KEY`, `JWT_SECRET_KEY`)
- [ ] Set `FLASK_ENV=production`
- [ ] Set `JWT_COOKIE_SECURE=True`
- [ ] Configure `ALLOWED_ORIGINS` to frontend domain only
- [ ] Enable HTTPS / TLS termination
- [ ] Set up database backups
- [ ] Configure error logging and monitoring
- [ ] Enable rate limiting (Flask-Limiter)
- [ ] Disable Swagger UI

---

## Useful Links

- [Flask Documentation](https://flask.palletsprojects.com/)
- [Flask-JWT-Extended](https://flask-jwt-extended.readthedocs.io/)
- [SQLAlchemy ORM](https://docs.sqlalchemy.org/)
- [Vite](https://vitejs.dev/)
- [Docker Compose](https://docs.docker.com/compose/)

---

## Version History

| Version | Date | Notes |
|---------|------|-------|
| v1.0.0 | 2024-01-15 | Initial release — auth API, JWT, PostgreSQL |
| v2.0.0 | 2026-03-14 | Full VEP system — driver portal, officer portal, document uploads, QR generation and scanning, Docker deployment |