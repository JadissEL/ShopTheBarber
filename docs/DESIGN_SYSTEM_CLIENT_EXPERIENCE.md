# ShopTheBarber — Unified Design System & Client Experience

**Purpose**: One coherent visual language and UX for the entire client journey (landing → discovery → dashboard). Light mode only. Desktop-first.

---

## 1. Design tokens (CSS variables)

Defined in `src/index.css`. All client-facing UI must use these.

| Token | HSL | Usage |
|-------|-----|--------|
| `--background` | 240 9% 97% | Page backgrounds |
| `--foreground` | 220 26% 14% | Primary text |
| `--primary` | 162 100% 38% | Brand accent (teal): CTAs, links, key actions |
| `--primary-foreground` | 0 0% 100% | Text on primary buttons |
| `--muted` | 240 6% 94% | Subtle surfaces |
| `--muted-foreground` | 220 9% 46% | Secondary text |
| `--border` | 220 13% 91% | Borders, dividers |
| `--card` | 0 0% 100% | Cards, panels |
| `--radius` | 0.75rem | Border radius (buttons, cards, inputs) |

**Usage in Tailwind**: `bg-background`, `text-foreground`, `bg-primary`, `text-primary`, `border-border`, `bg-card`, `rounded-lg` (uses --radius).

**Light only**: `.dark` is forced to the same values so the platform never switches to a dark theme.

---

## 2. Client journey (unified)

### 2.1 Landing (first contact)
- **Route**: `/` (Home)
- **Layout**: PublicLayout (Navbar + main + Footer)
- **Content**: Hero (value + primary CTA), Features, Featured Barbers, Services, Testimonials, CTA, About
- **Rules**: One primary CTA (e.g. “Book appointment”), secondary (“Marketplace”). No purple/blue gradients; use `primary` and slate only.

### 2.2 Discovery & exploration
- **Routes**: Explore, Marketplace, CareerHub, About, HelpCenter (public paths)
- **Layout**: Same PublicLayout (Navbar + Footer) so discovery feels like one site
- **Nav links**: Home, Find a Barber, Marketplace, Careers, About, Help
- **Rules**: Same Navbar/Footer, same tokens. No section should look like a different product.

### 2.3 Client dashboard (post-auth)
- **Routes**: Dashboard, UserBookings, Marketplace (when in client zone), ShoppingBag, GroomingVault, MyOrders, CareerHub (when in client zone), Chat, AccountSettings, etc.
- **Layout**: AppLayout + ClientLayout (sidebar + main). Mobile: per-page bottom nav (ClientBottomNav) where applicable.
- **Sidebar**: Logo (primary), nav items, “Book appointment” (primary button). Active state: slate-900 bg or primary as defined.
- **Rules**: Same tokens. Wide layouts on desktop (≥1024px). Sidebar or structured top nav only (no bottom tab nav on desktop).

---

## 3. Component uniformity

- **Buttons**: Primary = `bg-primary text-primary-foreground`. Outline = `border-border bg-card`. Use `rounded-xl` or `rounded-lg` consistently.
- **Cards**: `bg-card border border-border rounded-xl` (or `rounded-2xl` where appropriate). Hover: `hover:border-primary/30` or `hover:shadow-lg`.
- **Inputs**: Use shadcn/Radix components; they consume `--input`, `--ring`, `--radius`.
- **Empty states**: Same pattern across pages (icon, title, short copy, CTA).
- **Loading**: Centered spinner: `w-8 h-8 border-2 border-slate-200 border-t-slate-700 rounded-full animate-spin`.

---

## 4. Navigation

- **Public**: Navbar (sticky), Footer. Logo = primary. Active link = primary underline or bold.
- **Client (desktop)**: ClientDesktopSidebar. Logo + “Book appointment” = primary.
- **Client (mobile)**: ClientBottomNav on relevant pages; Career Hub uses its own tab bar on `/careerhub` (main bottom nav hidden there).
- **GlobalNavigation**: Shown when not in client desktop (e.g. auth, mobile client). Logo = primary; header can stay dark (slate-9) for contrast.

---

## 5. File reference

| Area | Files |
|------|--------|
| Tokens | `src/index.css` |
| Public layout | `src/components/layout/PublicLayout.jsx`, `Navbar.jsx`, `Footer.jsx` |
| Client layout | `src/components/layout/ClientLayout.jsx`, `ClientDesktopSidebar.jsx` |
| Landing | `src/pages/Home.jsx`, `src/components/home/*.jsx` |
| Zones | `src/components/navigationConfig.jsx` (public vs client paths) |

---

## 6. Unified scope (client-facing)

Pages and components using `bg-background` and `primary` consistently:

- **Landing & public**: Home, About, SelectProviderType, Explore (public), Marketplace (public), CareerHub (public), HelpCenter.
- **Auth**: SignIn (primary for branding, role tabs, focus, submit, links).
- **Client dashboard**: Dashboard, UserBookings (light), BookingFlow, Marketplace, ShoppingBag, Checkout, MyOrders, OrderTracking, GroomingVault, ProductDetail, Favorites, Chat, AccountSettings, ConfirmBooking, NotificationSettings, Review (light).
- **Careers**: CareerHub, JobDetail, ApplyToJob, ProfessionalPortfolio, PortfolioCredentials, CreateJob, MyJobs, ApplicantReview, ScheduleInterview.
- **Discovery**: BarberProfile, ShopProfile, BrandProfile.
- **Components**: Navbar, Footer, Hero, Features, CTA, Services, FeaturedBarbers, Testimonials, ClientDesktopSidebar, GlobalNavigation, service-card, QuickActions, MonthlySpendingCard, GroomingVault status.

---

## 7. Self-check (before release)

- [ ] Does the whole site feel like **one product**?
- [ ] Is the journey clear from first visit to daily use?
- [ ] Is the experience **calm, predictable, and unified** (no random purple/blue on one page)?
- [ ] Would a non-technical client feel **confident** navigating and acting?

If not → adjust tokens and components until yes.
