# Booking Flows — ShopTheBarber

This doc describes the two production-ready booking entry flows and how they behave when data or the backend is missing.

---

## 1. Barber-first flow (start from who)

**Path:** Find a Barber → pick a professional → Book → Services → Date & Time → Confirmation.

1. User goes to **Find a Barber** (Explore).
2. Barbers and shops are loaded from the API (`GET /api/barbers`, `GET /api/shops`). If the request fails, the page shows an error message and a **Try again** button.
3. User clicks a barber card → **Barber Profile** (e.g. `BarberProfile?id=gb6`).
4. On the profile, user clicks **Book appointment** (or **Continue to Date** if services are pre-selected).
5. App navigates to **BookingFlow** with `barberId` (and optional `shopId` / `context`).
6. User completes: **Services** → **Date & Time** → **Confirmation** (and pay if Stripe is configured).

**Resilience:**

- If the barber fails to load on the profile: “Couldn’t load this professional” with **Try again** and **Find a Barber**.
- If BookingFlow has a `barberId` but that barber doesn’t load: “Professional not found” with a link to Find a Barber.

---

## 2. Service-first flow (start from what)

**Path:** Choose a service → see barbers who offer it → pick a barber → same booking flow as above.

1. User starts from **Home** and clicks a service in **Curated Services** (e.g. Haircut, Beard Trim), or goes to **Find a Barber** and uses the service filter tags.
2. Explore opens with the service filter applied (e.g. `Explore?filter=Haircut`). Barbers are filtered by **shop**: only barbers whose shop offers that service (from `GET /api/services`) are shown.
3. User picks a barber → Barber Profile → **Book** → same flow as barber-first (Services → Date & Time → Confirmation).

**Resilience:**

- Service filter uses shop-level services. If services fail to load, the filter falls back to “All” behavior (all barbers shown).
- Same error and empty states as barber-first once on Explore or Barber Profile.

---

## Data requirements

- **Backend** must be running (`npm run dev` in the `server` folder).
- **Database** should be seeded so barbers, shops, services, and shifts exist:
  ```bash
  cd server && npm run seed
  ```
- If barbers/shops lists are empty after a successful load, the UI shows a hint to run `npm run seed`.

---

## Key files

| Flow / behavior        | Frontend                         | Backend / data                    |
|-------------------------|----------------------------------|-----------------------------------|
| Find a Barber list      | `src/pages/Explore.jsx`          | `GET /api/barbers`, `/api/shops`  |
| Service filter          | `src/pages/Explore.jsx`          | `GET /api/services`               |
| Barber profile          | `src/pages/BarberProfile.jsx`    | `GET /api/barbers/:id`            |
| Booking (steps)         | `src/pages/BookingFlow.jsx`      | `POST /api/bookings`, shifts, etc.|
| Home → service          | `src/components/home/Services.jsx` | Links to `Explore?filter=...`   |

---

## Error and empty states (summary)

- **Explore (Professionals / Shops):** Loading, “Couldn’t load…” + retry, “No … found” (filter empty), “No … in the database” + seed hint.
- **Barber Profile:** “No professional selected”, “Couldn’t load this professional” + retry / Find a Barber.
- **BookingFlow:** “Professional not found” + link to Find a Barber when the barber ID is invalid or missing.

These keep the app from failing silently when the database is empty or the backend is down.

---

## Run & test checklist

Use this to verify both flows after pulling or after running seed.

1. **Backend**
   - `cd server && npm run dev` → server on http://localhost:3001
   - If schema changed: `npm run push` then `npm run seed`

2. **Frontend**
   - From repo root: `npm run dev` → app on http://localhost:3000

3. **Barber-first**
   - Open **Find a Barber** → barbers (or shops tab) load
   - Click a barber → **Barber Profile** loads
   - Click **Book appointment** → **BookingFlow**: Services → Date & Time → Confirm
   - Complete or cancel; no silent failures

4. **Service-first**
   - From **Home**, click a service (e.g. Haircut) → **Explore** with filter
   - Barbers listed offer that service; pick one → same booking flow as above

5. **Edge cases**
   - Stop backend → Explore shows error + **Try again**
   - Empty DB (no seed) → “No professionals in the database” + hint to run `npm run seed`
