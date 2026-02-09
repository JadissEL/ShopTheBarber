/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import About from './pages/About';
import AccountSettings from './pages/AccountSettings';
import AdminBackups from './pages/AdminBackups';
import Auth from './pages/Auth';
import AdminDisputes from './pages/AdminDisputes';
import AdminOrders from './pages/AdminOrders';
import AdminUserModeration from './pages/AdminUserModeration';
import BarberProfile from './pages/BarberProfile';
import BrandProfile from './pages/BrandProfile';
import BookingFlow from './pages/BookingFlow';
import CareerHub from './pages/CareerHub';
import JobDetail from './pages/JobDetail';
import ApplyToJob from './pages/ApplyToJob';
import ProfessionalPortfolio from './pages/ProfessionalPortfolio';
import PortfolioCredentials from './pages/PortfolioCredentials';
import CreateJob from './pages/CreateJob';
import MyJobs from './pages/MyJobs';
import ApplicantReview from './pages/ApplicantReview';
import ScheduleInterview from './pages/ScheduleInterview';
import Chat from './pages/Chat';
import ClientList from './pages/ClientList';
import ConfirmBooking from './pages/ConfirmBooking';
import Dashboard from './pages/Dashboard';
import DisputeDetail from './pages/DisputeDetail';
import Explore from './pages/Explore';
import Favorites from './pages/Favorites';
import GlobalFinancials from './pages/GlobalFinancials';
import HelpCenter from './pages/HelpCenter';
import Home from './pages/Home';
import LaunchChecklist from './pages/LaunchChecklist';
import Loyalty from './pages/Loyalty';
import Marketplace from './pages/Marketplace';
import ProductDetail from './pages/ProductDetail';
import NotificationSettings from './pages/NotificationSettings';
import Privacy from './pages/Privacy';
import ProviderMessages from './pages/ProviderMessages';
import ProviderBookings from './pages/ProviderBookings';
import ProviderDashboard from './pages/ProviderDashboard';
import ProviderPayouts from './pages/ProviderPayouts';
import ProviderSettings from './pages/ProviderSettings';
import ProviderTermsOfService from './pages/ProviderTermsOfService';
import Review from './pages/Review';
import SelectProviderType from './pages/SelectProviderType';
import SelectTime from './pages/SelectTime';
import ServicesPricing from './pages/ServicesPricing';
import ShopProfile from './pages/ShopProfile';
import ShoppingBag from './pages/ShoppingBag';
import Checkout from './pages/Checkout';
import OrderTracking from './pages/OrderTracking';
import MyOrders from './pages/MyOrders';
import GroomingVault from './pages/GroomingVault';
import SignIn from './pages/SignIn';
import TermsOfService from './pages/TermsOfService';
import UserBookings from './pages/UserBookings';
import UserModerationDetail from './pages/UserModerationDetail';
import __Layout from './Layout.jsx';


export const PAGES = {
    "About": About,
    "AccountSettings": AccountSettings,
    "AdminBackups": AdminBackups,
    "AdminDisputes": AdminDisputes,
    "AdminOrders": AdminOrders,
    "Auth": Auth,
    "AdminUserModeration": AdminUserModeration,
    "BarberProfile": BarberProfile,
    "BrandProfile": BrandProfile,
    "BookingFlow": BookingFlow,
    "CareerHub": CareerHub,
    "JobDetail": JobDetail,
    "ApplyToJob": ApplyToJob,
    "ProfessionalPortfolio": ProfessionalPortfolio,
    "PortfolioCredentials": PortfolioCredentials,
    "CreateJob": CreateJob,
    "MyJobs": MyJobs,
    "ApplicantReview": ApplicantReview,
    "ScheduleInterview": ScheduleInterview,
    "Chat": Chat,
    "ClientList": ClientList,
    "ConfirmBooking": ConfirmBooking,
    "Dashboard": Dashboard,
    "DisputeDetail": DisputeDetail,
    "Explore": Explore,
    "Favorites": Favorites,
    "GlobalFinancials": GlobalFinancials,
    "HelpCenter": HelpCenter,
    "Home": Home,
    "LaunchChecklist": LaunchChecklist,
    "Loyalty": Loyalty,
    "Marketplace": Marketplace,
    "ProductDetail": ProductDetail,
    "NotificationSettings": NotificationSettings,
    "Privacy": Privacy,
    "ProviderBookings": ProviderBookings,
    "ProviderMessages": ProviderMessages,
    "ProviderDashboard": ProviderDashboard,
    "ProviderPayouts": ProviderPayouts,
    "ProviderSettings": ProviderSettings,
    "ProviderTermsOfService": ProviderTermsOfService,
    "Review": Review,
    "SelectProviderType": SelectProviderType,
    "SelectTime": SelectTime,
    "ServicesPricing": ServicesPricing,
    "ShopProfile": ShopProfile,
    "ShoppingBag": ShoppingBag,
    "Checkout": Checkout,
    "OrderTracking": OrderTracking,
    "MyOrders": MyOrders,
    "GroomingVault": GroomingVault,
    "SignIn": SignIn,
    "TermsOfService": TermsOfService,
    "UserBookings": UserBookings,
    "UserModerationDetail": UserModerationDetail,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};