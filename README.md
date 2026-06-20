# NayePankh Foundation — Volunteer Registration System

A production-oriented MERN scaffold for managing volunteer registration, approval, events,
attendance, certificates, and reporting for **NayePankh Foundation** — a UP Govt. registered,
80G & 12A certified, youth-led NGO ("Giving Wings to the Underprivileged").

This repo is a **runnable foundation**: the backend (auth, models, core APIs) is largely complete,
and the frontend has full routing, state, services, and key pages — including a working 6-step
registration form. Extend the stubbed admin/volunteer screens as needed.

---

## Tech Stack

**Backend** — Node.js, Express, MongoDB/Mongoose, JWT (access + rotating refresh), bcryptjs,
Nodemailer, Multer + Cloudinary, PDFKit, express-rate-limit, Winston.

**Frontend** — React 18 + Vite, Tailwind CSS, React Router v6, Zustand, React Hook Form + Zod,
Axios, Recharts, react-hot-toast.

---

## Project Structure

```
nayepankh-volunteer/
├── server/                 # Express API
│   ├── config/             # db + cloudinary
│   ├── models/             # User, Volunteer, Event, Attendance, Counter, Report, AuditLog
│   ├── controllers/        # auth, volunteer, event, admin, report
│   ├── routes/             # /api/auth /api/volunteers /api/events /api/admin /api/reports
│   ├── middleware/         # auth (JWT + roles), rateLimiter, upload, error
│   ├── utils/              # tokens, volunteerId, email templates, PDF/CSV/certificate, seed
│   └── server.js
└── client/                 # React + Vite SPA
    └── src/
        ├── pages/          # public / volunteer / admin
        ├── components/     # common / volunteer / admin
        ├── services/       # axios api + service modules
        ├── store/          # zustand auth store
        ├── hooks/          # useAuth bootstrap
        ├── constants/      # cause areas, skills, cities, etc.
        └── utils/          # zod validators
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- A MongoDB connection string (MongoDB Atlas works well)
- (Optional) Cloudinary account for uploads, and an SMTP/Gmail app password for email

### 1. Backend

```bash
cd server
cp .env.example .env          # then fill in the values
npm install
npm run seed                  # creates the super admin from SUPER_ADMIN_* env vars
npm run dev                   # starts API on http://localhost:5000
```

Health check: `GET http://localhost:5000/api/health`

### 2. Frontend

```bash
cd client
cp .env.example .env          # VITE_API_URL=http://localhost:5000/api
npm install
npm run dev                   # starts app on http://localhost:5173
```

The Vite dev server also proxies `/api` to port 5000, so the default works out of the box.

---

## Key Implementation Notes

- **Auth security** — access token is kept in memory (Zustand), never localStorage; the refresh
  token is an HTTP-only cookie. Refresh tokens are hashed before storage and rotated on every use.
- **Volunteer IDs** — generated on first approval in the format `NP-YYYY-XXXX` via a per-year
  atomic counter (`Counter` model).
- **Certificate eligibility** — ≥ 20 logged hours **and** ≥ 3 events attended (configurable via env).
  Certificates render as A4-landscape PDFs with an orange double-frame and a verification QR code.
- **Roles** — `volunteer`, `city_coordinator` (scoped to their city), `admin`, `super_admin`.
- **Soft deletes** — records carry an `isDeleted` flag rather than being removed.
- **Validation** — Indian mobile `^[6-9]\d{9}$`, pincode `^\d{6}$`, minimum age 14.
- **Privacy** — only the last 4 digits of an ID proof are stored; the document itself lives in
  Cloudinary by URL. Internal `adminNotes` are never exposed to volunteers.
- **Email** — sending fails gracefully (logged, never crashes a request) so you can develop without SMTP.

### Replace the placeholder logo
`client/public/logo.svg` is a simple placeholder. Drop in the real NayePankh logo (and update the
`<link rel="icon">` in `client/index.html` if you change the filename).

---

## API Surface (summary)

| Area | Routes |
|------|--------|
| Auth | `POST /auth/register`, `/login`, `/logout`, `/refresh`, `GET /auth/me`, `/verify-email/:token`, `POST /forgot-password`, `/reset-password/:token`, `PUT /change-password` |
| Volunteers | `GET /volunteers`, `GET/PUT /volunteers/:id`, `PUT /:id/status`, `/:id/notes`, `/:id/photo`, `GET /:id/activity`, `POST /:id/generate-certificate`, `POST /bulk-approve`, `DELETE /:id` |
| Events | `GET/POST /events`, `GET/PUT/DELETE /events/:id`, `POST/DELETE /:id/register`, `GET /:id/volunteers`, `PUT /:id/attendance`, `POST /:id/remind` |
| Admin | `GET /admin/stats`, `/pending`, `/registrations-trend`, `POST /send-email`, `GET /logs` |
| Reports | `GET /reports/volunteers[/csv|/pdf]`, `/city-summary`, `/cause-impact`, `/saved`, `POST /save` |

---

## Next Steps / TODO

- Wire document uploads on the volunteer dashboard (endpoints + Cloudinary middleware already exist).
- Build out attendance-marking UI on the event detail screen.
- Add a coordinator management screen for super admins.
- Add tests and CI.

Built as a starting point — adapt freely for NayePankh Foundation.
