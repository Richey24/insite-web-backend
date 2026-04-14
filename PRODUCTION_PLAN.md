# InSite Health System — Full-Stack Production Plan

## Overview

Two separate repos:

| Repo | Stack | Purpose |
|------|-------|---------|
| `insite-health` | Vite + React 19 + Tailwind | Frontend SPA |
| `insite-web-backend` | Node.js + Express + MongoDB | REST API backend |

---

## Repository Structure

```
insite-web-backend/
├── PRODUCTION_PLAN.md
├── .env                          ← NOT committed (fill from .env.example)
├── .env.example                  ← Committed template
├── .gitignore
├── package.json
└── src/
    ├── server.js                 ← Express app, middleware, route mounting
    ├── seed.js                   ← One-time admin user seed script
    ├── config/
    │   ├── db.js                 ← Mongoose connect with retry
    │   └── adminEmails.js        ← Edit to add/remove notification recipients
    ├── models/
    │   ├── Appointment.js
    │   ├── Contact.js
    │   ├── Newsletter.js
    │   ├── BlogPost.js
    │   └── User.js
    ├── routes/
    │   ├── appointments.js
    │   ├── contact.js
    │   ├── newsletter.js
    │   ├── blog.js
    │   └── auth.js
    ├── controllers/
    │   ├── appointmentController.js
    │   ├── contactController.js
    │   ├── newsletterController.js
    │   ├── blogController.js
    │   └── authController.js
    ├── middleware/
    │   ├── authMiddleware.js     ← JWT verify + role check
    │   ├── validate.js           ← Joi request body validator
    │   └── errorHandler.js       ← Global async error handler
    └── utils/
        └── email.js              ← Nodemailer templates
```

---

## API Endpoints

### Public

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/appointments | Book appointment |
| POST | /api/contact | Contact form submission |
| POST | /api/newsletter/subscribe | Subscribe to newsletter |
| DELETE | /api/newsletter/unsubscribe | Unsubscribe by token |
| GET | /api/blog/posts | List published posts (paginated, filterable) |
| GET | /api/blog/posts/:slug | Single post by slug |

### Protected (JWT required)

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | /api/auth/login | — | Returns JWT + user |
| GET | /api/auth/me | any | Current user |
| POST | /api/auth/logout | any | Invalidate token |
| POST | /api/blog/posts | author+ | Create post |
| PUT | /api/blog/posts/:id | author+ | Update post |
| DELETE | /api/blog/posts/:id | admin | Delete post |
| GET | /api/admin/appointments | admin | List all appointments |
| GET | /api/admin/contacts | admin | List all contacts |
| GET | /api/admin/newsletter | admin | List all subscribers |

---

## MongoDB Models

### Appointment
```
name, email, phone, organization, appointmentType,
preferredDate, preferredTime, patientType, gender,
department, message, status (pending|confirmed|cancelled),
createdAt
```

### Contact
```
name, email, subject, message,
status (new|read|replied), createdAt
```

### Newsletter
```
email (unique), active, unsubscribeToken (unique),
subscribedAt, unsubscribedAt
```

### User
```
name, email (unique), passwordHash (bcrypt),
role (admin|editor|author), avatar, bio, slug (unique),
lastLogin, createdAt
```

### BlogPost
```
slug (unique), status (draft|published|archived),
author (ref: User), categories[], featuredImage,
publishedAt, createdAt, updatedAt,
content: {
  en: { title, excerpt, body, tags[], seo: { metaTitle, metaDescription, focusKeyword } },
  ar: { ... },
  fr: { ... }
}
```

---

## Authentication Flow

1. Admin hits `/admin/dashboard/login` (secret route, not in public nav)
2. `POST /api/auth/login` → bcrypt verify password → return signed JWT (24h)
3. Frontend stores JWT in `localStorage` via `AuthContext`
4. Protected API calls send `Authorization: Bearer <token>` header
5. `authMiddleware.js` verifies JWT on every protected route
6. Role hierarchy: `author (1) < editor (2) < admin (3)`

---

## Email Notifications (Nodemailer)

All emails in `src/config/adminEmails.js` receive:
- New appointment booking alert
- New contact form submission alert

Users receive:
- Appointment confirmation email
- Contact form auto-reply

---

## Environment Variables

See `.env.example` for all required keys:
- `PORT` — server port (default 4000)
- `MONGODB_URI` — MongoDB Atlas connection string
- `JWT_SECRET` — 64-char random string
- `JWT_EXPIRES_IN` — token expiry (default 24h)
- `EMAIL_HOST` / `EMAIL_PORT` / `EMAIL_USER` / `EMAIL_PASS` / `EMAIL_FROM` — SMTP config
- `CORS_ORIGIN` — frontend URL (localhost:5173 in dev)

---

## Frontend Changes (insite-health repo)

| File | Change | Status |
|------|--------|--------|
| `src/App.jsx` | Route order fix (category/tag above :slug) | Done |
| `src/components/Footer.jsx` | Internal links as `<Link>` | Done |
| `src/utils/formValidation.js` | Field names aligned with ContactPage.jsx | Done |
| `src/utils/api.js` | Point VITE_API_BASE_URL at Express server | Pending (set env var) |
| `src/contexts/AuthContext.jsx` | Real JWT login via API | Pending |
| `src/pages/BlogManagement.jsx` | Fetch posts from API | Pending |
| `src/pages/BlogEditor.jsx` | Save posts via API | Pending |
| `src/pages/BlogPage.jsx` | Fetch posts from API | Pending |
| `src/pages/BlogSingle.jsx` | Fetch post by slug from API | Pending |
| `src/pages/BlogCategory.jsx` | Fetch filtered posts from API | Pending |
| `src/pages/BlogTag.jsx` | Fetch filtered posts from API | Pending |

---

## Build & Integration Order

```
Phase 1  DONE  — Service pages, blog pages, nav, forms wired
Phase 2  DONE  — App.jsx route order, Footer links, formValidation fields
Phase 3  DONE  — Express API scaffold (this repo)
Phase 4  NEXT  — You provide MongoDB URI → wire db.js → test endpoints → seed admin
Phase 5  NEXT  — Wire frontend auth + blog admin to real API
Phase 6  LATER — Production deploy (Render/Railway for API, Vercel for frontend)
```

---

## Phase 4 Checklist (when MongoDB URI is ready)

```
[ ] Copy .env.example to .env
[ ] Fill in MONGODB_URI
[ ] Fill in JWT_SECRET
[ ] npm install
[ ] npm run dev  →  server starts on port 4000
[ ] npm run seed  →  creates first admin user
[ ] Test endpoints with Postman / Thunder Client
[ ] Fill in EMAIL_* vars when SMTP credentials are ready
```
