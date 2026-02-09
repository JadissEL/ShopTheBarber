# 💈 ShopTheBarber - Premium Barbershop Booking Platform

**Status**: ✅ Production-Ready | **Architecture**: 100% Sovereign | **Base44**: Fully Eradicated

A modern, elegant booking platform for barbershops and grooming professionals built with React, Fastify, and SQLite.

**UX**: Desktop-first web platform (SaaS/marketplace/dashboard). Desktop (≥1024px) is the primary experience; mobile and tablet are responsive adaptations. See [docs/ARCHITECTURE_DESKTOP_FIRST.md](docs/ARCHITECTURE_DESKTOP_FIRST.md) and [docs/RESPONSIVE_LAYOUT.md](docs/RESPONSIVE_LAYOUT.md).

**Features**: Full-stack, unified development only. Every feature must include frontend, UX, backend, database, and system uniformity—no isolated layers. See [docs/ARCHITECTURE_FULL_STACK_UNIFIED.md](docs/ARCHITECTURE_FULL_STACK_UNIFIED.md).

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+ 
- npm or yarn

### Installation

```bash
# Clone the repository
cd shop-the-barber

# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### Running Locally

**Terminal 1 - Backend Server**:
```bash
cd server
npm run dev
# Server runs on http://localhost:3001
```

**Terminal 2 - Frontend**:
```bash
npm run dev
# App runs on http://localhost:3000
```

### Environment variables (no secrets in repo)

**Do not commit `.env`** — it may contain secrets. Use env vars for all sensitive config.

- **Backend**: Copy `server/.env.example` to `server/.env` and set:
  - `JWT_SECRET` — required; use a long random string in production
  - `STRIPE_API_KEY`, `STRIPE_WEBHOOK_SECRET` — for payments
  - `RESEND_API_KEY`, `EMAIL_FROM` — for transactional email
  - `FRONTEND_URL` — for redirects and links in emails (e.g. `http://localhost:3000` in dev)
- See **server/.env.example** for the full list and comments.
- In production, set every required variable; do not rely on fallback defaults for secrets.
- **Stripe**: [docs/STRIPE_SETUP.md](docs/STRIPE_SETUP.md) — API key, webhook URL, events; **Quick fix** at top for "Stripe is not configured" (set `STRIPE_API_KEY` in `server/.env`, restart server). [docs/STRIPE_MCP_SETUP.md](docs/STRIPE_MCP_SETUP.md) — set keys via MCP or `server/.stripe-keys.json`.
- **Resend**: [docs/RESEND_SETUP.md](docs/RESEND_SETUP.md) — API key, domain verification, sender address.

---

## 📁 Project Structure

```
shop-the-barber/
├── src/                    # Frontend React application
│   ├── components/         # React components
│   ├── pages/             # Page components
│   ├── api/               # API client (sovereign)
│   ├── lib/               # Utilities & contexts
│   └── assets/            # Static assets
│
├── server/                # Backend Fastify server
│   ├── src/
│   │   ├── db/           # Database & schema
│   │   ├── logic/        # Business logic
│   │   └── index.ts      # Main server file
│   ├── sovereign.sqlite   # SQLite database
│   └── package.json
│
├── public/               # Public assets
├── functions/            # Legacy reference (not used)
└── PROJECT_TRACKER.md    # Development history
```

---

## 🏗️ Technology Stack

### Frontend
- **Framework**: React 18.2 + Vite 6.1
- **Styling**: TailwindCSS 3.4
- **UI Components**: Radix UI + shadcn/ui
- **State**: TanStack React Query
- **Router**: React Router 6.26

### Backend
- **Framework**: Fastify 5.7 (High-performance Node.js)
- **Database**: SQLite (via better-sqlite3)
- **ORM**: Drizzle ORM 0.45 (Type-safe, migration-friendly)
- **Auth**: JWT (Fastify JWT)
- **Validation**: Zod

### Auth & session (current behavior)
- **Token storage**: JWT is stored in `localStorage` under the key `sovereign_token` after login or signup.
- **Persistence**: The session lasts until the token expires or the user logs out; there is no automatic token refresh.
- **Logout**: Clearing the token (e.g. via Sign out) removes the session; the client also calls `/api/auth/logout` for consistency.

---

## 📊 Features

### For Clients
- 🔍 Browse barbers by location, specialty, or availability
- 📅 Real-time booking calendar
- 💳 Secure payments (Stripe integration planned)
- ⭐ Review & rating system
- 🎁 Loyalty rewards program
- 📱 Mobile-responsive design

### For Barbers & Shops
- 📊 Professional dashboard
- ⏰ Shift & availability management
- 💰 Earnings & payout tracking
- 🔔 Real-time booking notifications
- 📈 Analytics & insights
- 👥 Multi-barber shop support

### Platform Features
- 🛡️ PII protection & GDPR compliance
- 📝 Comprehensive audit logging
- 💸 Greek tax compliance (VAT, withholding, social security)
- 🚨 Dispute resolution system
- 🔒 Rate limiting & security
- 📧 Email notifications (configurable)

---

## 🗄️ Database Schema

Core entities (16 tables total):
- `users` - User accounts & authentication
- `barbers` - Professional profiles
- `shops` - Barbershop configurations
- `bookings` - Appointment records
- `services` - Service catalog
- `shifts` - Operating hours
- `time_blocks` - Vacations, breaks
- `loyalty_profiles` - Customer rewards
- `loyalty_transactions` - Points history
- `messages` - Client-provider chat
- `notifications` - System alerts
- `disputes` - Payment disputes
- `audit_logs` - Compliance tracking
- Plus: shop_members, pricing_rules, reviews, payouts, etc.

**Database is engine-agnostic**: Easy migration from SQLite → PostgreSQL when needed.

---

## 🚀 Deployment (always running)

To have the app **always running** and **auto-deploy on push**: deploy the frontend to **Vercel** and the backend to **Render**, with the repo on **GitHub**. Step-by-step: **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)**. To do it **via MCP** (AI creates and manages services from Cursor): **[docs/DEPLOYMENT_MCP.md](docs/DEPLOYMENT_MCP.md)**.

- **Frontend (Vercel)**: Connect the repo, set `VITE_API_URL` to your backend URL, deploy. Each push to `main` redeploys.
- **Backend (Render)**: New Web Service, root `server`, start `npm run start`, set `JWT_SECRET`, `FRONTEND_URL`, Stripe keys. Optional: use the repo’s `render.yaml` Blueprint.
- **Database**: Default is SQLite (on Render free tier the disk is ephemeral). For persistent data, add a hosted DB later (e.g. Render Postgres).
- **Environment**: On the server machine, copy `server/.env.example` to `server/.env` and set **JWT_SECRET**, **STRIPE_***, **RESEND_***, **FRONTEND_URL** (and optionally **DATABASE_PATH**). Never commit `.env`.
- **Database**: Default is SQLite (`sovereign.sqlite` in `server/`). For production you can keep SQLite or migrate to PostgreSQL; run migrations with `npm run push` (or your migration command) after setting DB URL/path.
- **CORS**: Backend has CORS enabled; set the frontend origin in production so only your app can call the API.

---

## 🔧 Development

- **Architecture & schema**: See **PROJECT_SCHEMA.md** for high-level architecture and **PROJECT_TRACKER.md** for DB schema status, completed actions, and roadmap.
- **Running locally**: Backend on port 3001, frontend on 3000; frontend proxies `/api` to the backend (see Quick Start). **Seed the database** so Find a Barber, bookings, and Marketplace have data: in `server/` run `npm run push` (if needed) then `npm run seed`. For Marketplace products, run `npm run create-products-table` if migrations don’t create the products table. See [docs/BOOKING_FLOWS.md](docs/BOOKING_FLOWS.md) for barber-first vs service-first booking flows and data requirements.

### Frontend
```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run lint:fix     # Auto-fix linting issues
```

### Backend
```bash
cd server
npm run dev          # Start dev server (watch mode)
npm run generate     # Generate Drizzle migrations
npm run push         # Push schema to database
npm run seed         # Seed database with sample data
npm run studio       # Open Drizzle Studio (DB GUI)
npm run test         # Run server tests (Vitest)
```

---

## 🌐 API Endpoints

Base URL: `http://localhost:3001`

### Authentication (MVP - Mock)
- `GET /api/auth/me` - Get current user

### Functions (Business Logic)
- `POST /api/functions/validate-availability` - Check booking slot
- `POST /api/functions/calculate-taxes` - Calculate Greek taxes
- `POST /api/functions/calculate-fees` - Commission & fee breakdown
- `POST /api/functions/send-booking-email` - Send notifications

### Entities (CRUD)
- `GET /api/barbers` - List barbers
- `GET /api/shops` - List shops  
- `GET /api/services` - List services
- `GET /api/bookings` - List bookings
- `POST /api/bookings` - Create booking (custom logic)
- `PATCH /api/{entity}/:id` - Update any entity
- _Plus 10+ more entity endpoints_

See `server/src/index.ts` for complete API documentation.

---

## 📈 Roadmap

### ✅ Phase 1: Base44 Eradication (COMPLETE)
- Removed all Base44 dependencies
- Built sovereign backend
- Migrated core functions
- 100% independent architecture

### 🏗️ Phase 2: Production Hardening (IN PROGRESS)
- [ ] Full JWT authentication
- [x] Stripe payment integration (Checkout, webhooks, confirmation email; see `docs/STRIPE_SETUP.md`)
- [x] Real email system (Resend: welcome, booking confirmation/cancellation; see `docs/RESEND_SETUP.md`)
- [x] Comprehensive testing (Vitest: frontend critical-path + server auth/password)
- [x] Security audit (see `docs/SECURITY_AUDIT.md`)

### 📅 Phase 3: Launch Preparation
- [ ] PostgreSQL migration (optional)
- [ ] Cloud deployment
- [x] CI/CD pipeline (`.github/workflows/ci.yml`: lint, test, build)
- [ ] Monitoring & logging
- [ ] Performance optimization

### 🚀 Phase 4: Feature Expansion
- [ ] Mobile app (React Native)
- [ ] Advanced analytics
- [ ] Marketing automation
- [ ] Multi-language support
- [ ] Marketplace expansion

See `BASE44_ERADICATION_COMPLETE.md` for detailed roadmap.

---

## 🔒 Security

- JWT-based authentication
- Input validation with Zod schemas
- SQL injection protection (Drizzle ORM)
- Rate limiting on sensitive endpoints
- PII encryption for sensitive fields
- CORS configuration
- Audit logging for compliance

---

## 📄 License

Proprietary - All Rights Reserved

---

## 👨‍💻 Author

**Jadiss**  
Shop The Barber Platform

---

## 📚 Documentation

- **Project Schema**: `PROJECT_SCHEMA.md` - Architecture and structure
- **Project Tracker**: `PROJECT_TRACKER.md` - Complete development history & DB schema status
- **Booking flows**: `docs/BOOKING_FLOWS.md` - Barber-first and service-first flows, error/empty states, seed requirement
- **Eradication Report**: `BASE44_ERADICATION_COMPLETE.md` - Migration summary
- **Function Migration**: `FUNCTION_MIGRATION_PROGRESS.md` - API migration details
- **Migration Summary**: `MIGRATION_SUMMARY.md` - Architecture decisions

---

## ✨ Highlights

This project represents a **complete architectural sovereignty migration** from a proprietary platform (Base44) to a fully independent, production-grade system built on open-source technologies.

**Key Achievements**:
- ✅ Zero vendor lock-in
- ✅ Full code ownership
- ✅ Production-grade architecture
- ✅ Type-safe database with ORM
- ✅ Comprehensive business logic
- ✅ Tax & compliance ready (Greece)
- ✅ Scalable to enterprise needs

---

**Built with precision by Antigravity AI** 🚀
