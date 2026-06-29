/**
 * Page routing configuration.
 *
 * - **Core** paths (see lib/coreRoutes.js) are imported eagerly for TTI.
 * - **All other** pages/*.jsx are code-split via import.meta.glob + React.lazy.
 * - CityLanding / CitiesDirectory / InviteLanding use custom routes in App.jsx only.
 *
 * mainPage controls the landing route (/).
 */
import { lazy } from 'react';
import __Layout from './Layout.jsx';
import { CORE_EAGER_PAGE_NAMES, CUSTOM_APP_ROUTE_PAGES } from '@/lib/coreRoutes';

import Home from './pages/Home';
import Explore from './pages/Explore';
import Barbers from './pages/Barbers';
import BarberProfile from './pages/BarberProfile';
import ShopProfile from './pages/ShopProfile';
import BookingFlow from './pages/BookingFlow';
import GuestBooking from './pages/GuestBooking';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import UserBookings from './pages/UserBookings';
import ConfirmBooking from './pages/ConfirmBooking';
import Review from './pages/Review';
import About from './pages/About';
import Privacy from './pages/Privacy';
import TermsOfService from './pages/TermsOfService';
import HelpCenter from './pages/HelpCenter';
import StatusPage from './pages/StatusPage';
import Offline from './pages/Offline';

const eagerPages = {
  Home,
  Explore,
  Barbers,
  BarberProfile,
  ShopProfile,
  BookingFlow,
  GuestBooking,
  SignIn,
  SignUp,
  Auth,
  Dashboard,
  UserBookings,
  ConfirmBooking,
  Review,
  About,
  Privacy,
  TermsOfService,
  HelpCenter,
  StatusPage,
  Offline,
};

const lazyPageModules = import.meta.glob('./pages/*.jsx');

const lazyPages = {};
for (const [filePath, loadModule] of Object.entries(lazyPageModules)) {
  const name = filePath.replace('./pages/', '').replace(/\.jsx$/, '');
  if (CORE_EAGER_PAGE_NAMES.has(name) || CUSTOM_APP_ROUTE_PAGES.has(name)) {
    continue;
  }
  lazyPages[name] = lazy(loadModule);
}

export const PAGES = {
  ...eagerPages,
  ...lazyPages,
};

export const pagesConfig = {
  mainPage: 'Home',
  Pages: PAGES,
  Layout: __Layout,
};

export { CORE_EAGER_PAGE_NAMES };
