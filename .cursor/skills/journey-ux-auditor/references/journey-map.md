# Journey & zone map — ShopTheBarber

Single source of truth for UX/journey audits. Routes are defined in `App.jsx` as `/${pageKey}` (e.g. `/Home`, `/SignIn`). Zones from `src/components/navigationConfig.jsx` (`APP_ZONES`).

## Zones

| Zone     | Purpose                          | Role / context              |
|----------|----------------------------------|-----------------------------|
| PUBLIC   | Pre-auth, landing, explore       | Guest                       |
| AUTH     | Sign in / sign up                | Guest → authenticated       |
| CLIENT   | Logged-in customer               | client                      |
| PROVIDER | Barber / shop operator           | provider, shop_owner        |
| ADMIN    | Platform management              | admin                       |

## Journey → pages (by zone)

### PUBLIC
- Home, Explore, SelectProviderType, TermsOfService, Privacy, ProviderTermsOfService  
- Paths: `/`, `/Home`, `/Explore`, `/SelectProviderType`, `/TermsOfService`, `/Privacy`, `/ProviderTermsOfService`

### AUTH
- SignIn  
- Paths: `/SignIn` (and `/SignUp` if present)

### CLIENT (user journey)
- Dashboard, BarberProfile, ShopProfile, BookingFlow, UserBookings, Favorites, Chat, Review, Loyalty, AccountSettings, DisputeDetail (client view), HelpCenter, LaunchChecklist  
- Paths: `/Dashboard`, `/BarberProfile`, `/ShopProfile`, `/BookingFlow`, `/UserBookings`, `/Favorites`, `/Chat`, `/Review`, `/Loyalty`, `/AccountSettings`, `/DisputeDetail`, `/HelpCenter`, `/LaunchChecklist`

### PROVIDER (barber / shop journey)
- ProviderDashboard, ProviderBookings, ProviderPayouts, ProviderSettings, ProviderTermsOfService, BarberProfile, ShopProfile  
- Paths: `/ProviderDashboard`, `/ProviderBookings`, `/ProviderPayouts`, `/ProviderSettings`, `/ProviderTermsOfService`, `/BarberProfile`, `/ShopProfile`

### ADMIN (admin journey)
- AdminBackups, AdminDisputes, AdminUserModeration, GlobalFinancials, UserModerationDetail  
- Paths: `/AdminBackups`, `/AdminDisputes`, `/AdminUserModeration`, `/GlobalFinancials`, `/UserModerationDetail`

## Critical files for journey/UX

- **Routing**: `src/App.jsx`, `src/pages.config.js`
- **Zone / nav**: `src/components/navigationConfig.jsx`, `src/components/navigation/navigationVisibility.js`
- **Guards**: `src/components/routing/RouteGuard.jsx` (role + booking flow)
- **Layout**: `src/Layout.jsx`, `src/components/layout/` (AppLayout, Navbar, PublicLayout, SidebarNav)
- **Auth**: `src/lib/AuthContext.jsx`

## Route path format

Routes are registered as `path={/${pageKey}}` in App.jsx. Pathname may be normalized to lowercase in nav visibility (`pathname.toLowerCase()`). Check both PascalCase key and lowercase path when auditing links and redirects.
