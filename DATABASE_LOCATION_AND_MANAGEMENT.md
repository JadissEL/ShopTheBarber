# 🗄️ Database Location and Management

## Where Is Your Database Stored?

Your database location depends on the environment:

---

## 📍 Database Locations by Environment

### 1. **Local Development** (Your Machine / Cloud Agent)

**Location:** `/workspace/server/sovereign.sqlite`

**Size:** 448 KB (as of now)

**Type:** SQLite file-based database

**Access:**
```bash
cd /workspace/server
ls -lh sovereign.sqlite
# -rw-r--r-- 1 ubuntu ubuntu 448K Mar 5 07:00 sovereign.sqlite
```

**Managed by:**
- Drizzle ORM (Node.js)
- Better-sqlite3 driver
- Local file system

---

### 2. **Production - Render Backend** (Current Setup)

**Location:** On Render's server at:
- Path: `/workspace/server/sovereign.sqlite` (inside the Render container)
- Storage: **Render's ephemeral disk** (free tier)

**⚠️ IMPORTANT - Data Persistence Issue:**

On **Render's free tier**, the database is **EPHEMERAL**:
- ❌ Data is **lost** on every redeploy
- ❌ Data is **lost** when service spins down after inactivity
- ❌ Data is **lost** on service restarts
- ✅ Data persists during normal operation

**Why:** Render free tier uses temporary container storage that resets on each deployment.

**What happens:**
1. Service starts → Empty database
2. Auto-seed runs → Creates sample data (barbers, shops, services)
3. Users create bookings, accounts, etc.
4. You redeploy → **ALL DATA LOST** ⚠️
5. Service restarts → **ALL DATA LOST** ⚠️

---

### 3. **Production - Vercel Frontend** (Current Setup)

**No database!** 

The frontend is static (React SPA) and doesn't store any data. All data calls go to your Render backend API.

---

## 🔧 How Is It Managed?

### Schema Management (Drizzle ORM)

**Schema Definition:**
- Location: `server/src/db/schema.ts`
- Defines all tables: users, barbers, shops, bookings, services, etc.
- Total entities: 20+ tables

**Migration System:**

```bash
# 1. Make changes to schema.ts
# 2. Generate migration
cd server
npm run generate

# 3. Apply migration to database
npm run push
```

**Migration Files:** (Already created)
```
server/drizzle/
├── 0000_tranquil_thaddeus_ross.sql      # Initial schema
├── 0001_happy_captain_marvel.sql        # Auth tables
├── 0002_salty_redwing.sql               # Booking enhancements
├── 0003_products_marketplace.sql        # Marketplace
├── 0004_elite_brands.sql                # Brands
├── 0005_cart_orders.sql                 # Shopping cart
├── 0006_order_tracking.sql              # Order fulfillment
└── 0007_jobs_ecosystem.sql              # Employment/Jobs
```

---

### Data Seeding

**Seed Script:** `server/src/db/seed.ts`

**What it creates:**
- ✅ 2 sample barbers (Sarah Johnson, Mike Rodriguez)
- ✅ 2 barbershops
- ✅ Services (Haircut, Beard Trim, Hot Towel Shave, etc.)
- ✅ Shifts (operating hours)
- ✅ 3 companies (Murdock London, Aesop, Royal Barber Co)
- ✅ Sample job postings
- ✅ Products for marketplace

**Run seed:**
```bash
cd server
npm run seed
```

**Auto-seed in production:**
- Render backend automatically runs seed if database is empty
- Happens on first start or after data loss

---

## ⚠️ CRITICAL PROBLEM: Data Loss on Render Free Tier

### Current Risk Level: 🔴 HIGH

**Every time you redeploy on Render:**
- ❌ All user accounts are deleted
- ❌ All bookings are lost
- ❌ All orders are lost
- ❌ All customer data disappears
- ❌ Shopping carts are cleared

**This is NOT acceptable for production!**

---

## ✅ SOLUTION: Persistent Database

You **MUST** migrate to a persistent database before launching to real users. Here are your options:

---

## 🎯 Option 1: PostgreSQL on Render (RECOMMENDED)

**Best for:** Production-ready persistence, same hosting provider

### Steps:

1. **Create Render Postgres Database:**
   - Go to Render Dashboard → **New** → **PostgreSQL**
   - Name: `shopthebarber-db`
   - Plan: **Free** (1 GB storage, enough to start)
   - Click **Create Database**

2. **Get Connection String:**
   - After creation, copy the **Internal Database URL**
   - Format: `postgresql://user:password@host:5432/database`

3. **Update Backend to Use PostgreSQL:**

**Install PostgreSQL driver:**
```bash
cd server
npm install pg
npm uninstall better-sqlite3
```

**Update `server/src/db/index.ts`:**
```typescript
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });
```

**Update `server/drizzle.config.ts`:**
```typescript
export default {
    schema: "./src/db/schema.ts",
    out: "./drizzle",
    dialect: "postgresql", // Changed from "sqlite"
    dbCredentials: {
        url: process.env.DATABASE_URL,
    },
} satisfies Config;
```

4. **Add Environment Variable to Render:**
   - Go to your backend service → **Environment**
   - Add: `DATABASE_URL` = (paste the Internal Database URL from Postgres)
   - Click **Save** (triggers redeploy)

5. **Run Migrations:**
   - After deploy, go to Render → Your service → **Shell**
   - Run: `npm run push` (applies schema to PostgreSQL)
   - Run: `npm run seed` (optional - populate sample data)

**Cost:** FREE (1 GB storage, more than enough for thousands of users)

**Benefits:**
- ✅ Data persists forever
- ✅ Survives redeployments
- ✅ Automatic backups (paid plans)
- ✅ Scalable (upgrade to paid plan for more storage)

---

## 🎯 Option 2: Neon PostgreSQL (Also FREE)

**Best for:** More generous free tier, better performance

1. Go to [neon.tech](https://neon.tech) and sign up
2. Create a new project: "ShopTheBarber"
3. Copy the connection string
4. Add `DATABASE_URL` to Render environment
5. Update backend code (same as Option 1)
6. Run migrations

**Free Tier:**
- ✅ 3 GB storage (3x more than Render)
- ✅ Unlimited compute hours
- ✅ Branching (database versions)
- ✅ Point-in-time recovery

---

## 🎯 Option 3: Supabase PostgreSQL

**Best for:** Postgres + extra features (auth, storage, realtime)

1. Go to [supabase.com](https://supabase.com) and sign up
2. Create project: "ShopTheBarber"
3. Get connection string (Settings → Database)
4. Add to Render environment
5. Update backend code (same as Option 1)

**Free Tier:**
- ✅ 500 MB storage
- ✅ Unlimited API requests
- ✅ Built-in auth (could replace Clerk if you want)
- ✅ Real-time subscriptions
- ✅ File storage

---

## 🎯 Option 4: Keep SQLite but Add Persistent Storage

**Best for:** Want to keep SQLite but need persistence

**Render Persistent Disks:**
- Available on **paid plans only** (starts at $7/month)
- Mounts a persistent volume at a path
- SQLite file survives redeployments

**Steps:**
1. Upgrade Render service to paid plan
2. Add a persistent disk (mount at `/data`)
3. Update `DATABASE_PATH` env var to `/data/sovereign.sqlite`
4. Database persists across deploys

**Not recommended:** PostgreSQL is better for production web apps (concurrent connections, better performance, scaling).

---

## 📊 Current Database Content

Your local database (`server/sovereign.sqlite`) currently contains:

**Size:** 448 KB

**Tables:**
- users
- barbers (2 sample)
- shops (2 sample)
- bookings
- services (5+ services)
- shifts
- time_blocks
- loyalty_profiles
- loyalty_transactions
- messages
- notifications
- disputes
- audit_logs
- products
- brands
- cart_items
- orders
- order_items
- companies (3 sample)
- jobs (sample job postings)
- applicant_profiles
- job_applications
- ...and more

**Total:** 20+ tables with sample data

---

## 🛠️ Database Management Commands

### Local Development

```bash
cd server

# View database schema
npm run studio
# Opens Drizzle Studio at http://localhost:4983
# Browse tables, view data, run queries

# Apply schema changes
npm run push

# Seed sample data
npm run seed

# Generate new migration
npm run generate
```

### Production (Render)

```bash
# Access Render Shell
# Render Dashboard → Your Service → Shell tab

# Apply migrations
npm run push

# Seed data (if empty)
npm run seed

# Check if database exists
ls -la sovereign.sqlite
```

---

## 🔍 Database Inspection Tools

### Option 1: Drizzle Studio (Built-in)

```bash
cd server
npm run studio
```

Opens at `http://localhost:4983` with:
- ✅ Visual table browser
- ✅ Data viewer and editor
- ✅ Query builder
- ✅ Relationship viewer

### Option 2: DB Browser for SQLite

Download from [sqlitebrowser.org](https://sqlitebrowser.org)

Open `server/sovereign.sqlite` directly.

### Option 3: VS Code Extension

Install **SQLite Viewer** extension in VS Code:
- Right-click `server/sovereign.sqlite`
- Select "Open with SQLite Viewer"

---

## 📈 Database Backup & Recovery

### Current Setup (SQLite + Render Free):

**Backup:** ❌ No automatic backups

**Manual Backup:**
```bash
# Download database from Render
# Render Shell → run:
cat sovereign.sqlite | base64

# Save output to local file, then:
base64 -d > backup.sqlite
```

Or use SCP if you have SSH access (not available on free tier).

### With PostgreSQL (Recommended):

**Render Postgres:**
- ✅ Automatic daily backups (paid plans)
- ✅ Point-in-time recovery
- ✅ Snapshot downloads

**Neon:**
- ✅ Automatic backups
- ✅ Branch database for testing
- ✅ Time-travel queries

**Supabase:**
- ✅ Daily backups (free tier)
- ✅ Point-in-time recovery (paid)

---

## 🚨 RECOMMENDATION: Migrate to PostgreSQL NOW

**Before launching to real users, you MUST migrate to PostgreSQL.**

### Why:

1. ❌ **Data Loss Risk**: Current setup loses all data on redeploy
2. ❌ **No Backups**: If Render service crashes, data is gone
3. ❌ **Poor Concurrency**: SQLite struggles with multiple simultaneous writes
4. ❌ **No Scaling**: Can't add read replicas or distribute load

### Migration is Easy:

1. Create free PostgreSQL database (Render/Neon/Supabase)
2. Update 3 files (db/index.ts, drizzle.config.ts, package.json)
3. Run migrations
4. Done! (30 minutes of work)

**I can do this for you if you want!** Just say the word.

---

## 📊 Summary

### Current State:

| Environment | Database | Location | Persistence | Risk |
|-------------|----------|----------|-------------|------|
| **Local Dev** | SQLite | `/workspace/server/sovereign.sqlite` | ✅ Persistent | ✅ Low |
| **Render (Production)** | SQLite | Container ephemeral disk | ❌ **LOST ON REDEPLOY** | 🔴 **HIGH** |
| **Vercel (Frontend)** | N/A | No database | N/A | ✅ Low |

### What You Need:

| What | Why | When |
|------|-----|------|
| **PostgreSQL** | Data persistence | **Before real users** |
| **Backups** | Disaster recovery | **Before real users** |
| **Monitoring** | Track DB health | After launch |

---

## 🎯 Next Steps (Choose One):

### A. **Keep SQLite (NOT RECOMMENDED FOR PRODUCTION)**
- ⚠️ Data loss risk
- ⚠️ Limited scalability
- ⚠️ No backups
- ⚠️ Users will lose data on redeploy

### B. **Migrate to PostgreSQL (RECOMMENDED)**
- ✅ Data persists forever
- ✅ Automatic backups
- ✅ Better performance
- ✅ Production-ready
- ✅ Free tier available (Render/Neon/Supabase)
- ⏱️ Takes 30 minutes to migrate

---

## 💡 Want Me To Migrate It?

I can migrate your database to PostgreSQL right now (completely automated):

**Just tell me:**
1. Which provider do you prefer? (Render Postgres / Neon / Supabase)
2. Or give me the connection string if you already created one

**I'll handle:**
- ✅ Install PostgreSQL drivers
- ✅ Update database connection code
- ✅ Update Drizzle config
- ✅ Run migrations
- ✅ Test everything works
- ✅ Document the setup
- ✅ Push to production

**No interference needed from you!** 🚀

---

## 📞 Current Database Stats

```bash
Database: /workspace/server/sovereign.sqlite
Size: 448 KB
Tables: 20+
Migrations: 8 applied
Sample Data: ✅ Seeded
ORM: Drizzle
Driver: better-sqlite3
```

---

**Want to migrate to PostgreSQL? Just say "yes" and I'll do everything!** 🎊
