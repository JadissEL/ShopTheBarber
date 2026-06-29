import {
  Calendar,
  CreditCard,
  User,
  Scissors,
  Tag,
  Wrench,
  Shield,
  Headphones,
  Mail,
  AlertCircle,
} from 'lucide-react';

export const HELP_CATEGORIES = [
  {
    id: 'bookings',
    title: 'Bookings',
    description: 'How to book, cancel, reschedule, and manage appointments.',
    icon: Calendar,
    href: 'UserBookings',
    keywords: ['book', 'appointment', 'cancel', 'reschedule', 'slot', 'time'],
  },
  {
    id: 'payments',
    title: 'Payments',
    description: 'Charges, refunds, receipts, and payment methods.',
    icon: CreditCard,
    href: 'UserBookings',
    keywords: ['payment', 'refund', 'charge', 'receipt', 'stripe', 'card', 'invoice'],
  },
  {
    id: 'account',
    title: 'Your account',
    description: 'Login, profile, notifications, and security settings.',
    icon: User,
    href: 'AccountSettings',
    keywords: ['account', 'profile', 'login', 'password', 'settings', 'email'],
  },
  {
    id: 'barbers',
    title: 'For barbers',
    description: 'Join the platform, manage your profile, and grow your business.',
    icon: Scissors,
    href: '/for-barbers',
    externalPath: true,
    keywords: ['barber', 'provider', 'shop', 'payout', 'calendar', 'services'],
  },
  {
    id: 'promotions',
    title: 'Promotions',
    description: 'Deals, discounts, referrals, and loyalty rewards.',
    icon: Tag,
    href: 'Referral',
    keywords: ['deal', 'discount', 'promo', 'referral', 'reward', 'loyalty', 'tombola'],
  },
  {
    id: 'technical',
    title: 'Technical issues',
    description: 'App errors, loading problems, and bug reports.',
    icon: Wrench,
    href: 'StatusPage',
    keywords: ['bug', 'error', 'loading', 'crash', 'technical', 'not working'],
  },
  {
    id: 'policies',
    title: 'Policies',
    description: 'Terms of service, privacy, and marketplace rules.',
    icon: Shield,
    href: 'Privacy',
    keywords: ['terms', 'privacy', 'policy', 'legal', 'gdpr', 'safety'],
  },
  {
    id: 'contact',
    title: 'Contact support',
    description: 'Live chat, email, and system status.',
    icon: Headphones,
    href: 'SupportChat',
    hrefQuery: 'new=1',
    keywords: ['contact', 'support', 'help', 'chat', 'email', 'status'],
  },
];

export const HELP_QUICK_ACTIONS = [
  {
    id: 'status',
    label: 'System status',
    href: 'StatusPage',
    icon: Wrench,
  },
  {
    id: 'chat',
    label: 'Live chat',
    href: 'SupportChat',
    hrefQuery: 'new=1',
    icon: Headphones,
  },
  {
    id: 'email',
    label: 'Email support',
    href: 'mailto:support@shopthebarber.com',
    external: true,
    icon: Mail,
  },
  {
    id: 'report',
    label: 'Report an issue',
    href: 'SupportChat',
    hrefQuery: 'new=1',
    icon: AlertCircle,
  },
];

export const HELP_FAQ_ITEMS = [
  {
    id: 'book-appointment',
    question: 'How do I book an appointment?',
    answer:
      'Browse barbers on Explore, open a profile, choose a service and time, then confirm payment. You will receive a confirmation in your bookings.',
    keywords: ['book', 'appointment', 'how'],
    categoryId: 'bookings',
  },
  {
    id: 'cancel-booking',
    question: 'Can I cancel or reschedule a booking?',
    answer:
      'Yes. Open My Bookings, select the appointment, and choose reschedule or cancel. Cancellation policies may vary by barber or shop.',
    keywords: ['cancel', 'reschedule', 'change'],
    categoryId: 'bookings',
  },
  {
    id: 'payment-charged',
    question: 'When am I charged for a booking?',
    answer:
      'Payment is typically captured at checkout when you confirm your appointment. Refunds depend on the barber or shop cancellation policy.',
    keywords: ['charged', 'payment', 'when', 'pay'],
    categoryId: 'payments',
  },
  {
    id: 'refund',
    question: 'How do refunds work?',
    answer:
      'Eligible refunds are returned to your original payment method within 5–10 business days. Contact support if a refund is missing after that window.',
    keywords: ['refund', 'money back'],
    categoryId: 'payments',
  },
  {
    id: 'mobile-barber',
    question: 'How do at-home (mobile) barber visits work?',
    answer:
      'Filter for mobile barbers on Explore, book as usual, and provide your address at checkout. The barber travels to your location at the scheduled time.',
    keywords: ['mobile', 'home', 'at-home', 'visit'],
    categoryId: 'bookings',
  },
  {
    id: 'become-barber',
    question: 'How do I join as a barber or shop?',
    answer:
      'Visit For Barbers to see plans and onboarding steps. You can set up services, availability, and payouts after creating a provider account.',
    keywords: ['join', 'barber', 'register', 'provider'],
    categoryId: 'barbers',
  },
  {
    id: 'deals',
    question: 'Where can I find deals and promotions?',
    answer:
      'Check the Deals section on Explore or your Refer & Earn page for referral rewards. Promotions may also appear on individual barber profiles.',
    keywords: ['deal', 'promo', 'discount'],
    categoryId: 'promotions',
  },
  {
    id: 'app-issue',
    question: 'The app or site is not loading — what should I do?',
    answer:
      'Check our System Status page first. Try a hard refresh, clear cache, or switch networks. If the issue persists, start a support chat with details and screenshots.',
    keywords: ['loading', 'broken', 'error', 'bug'],
    categoryId: 'technical',
  },
];

export function filterHelpContent(query, categories = HELP_CATEGORIES, faqs = HELP_FAQ_ITEMS) {
  const q = query.trim().toLowerCase();
  if (!q) return { categories, faqs };

  const match = (text) => text.toLowerCase().includes(q);

  return {
    categories: categories.filter(
      (c) =>
        match(c.title) ||
        match(c.description) ||
        c.keywords.some((k) => match(k))
    ),
    faqs: faqs.filter(
      (f) =>
        match(f.question) ||
        match(f.answer) ||
        f.keywords.some((k) => match(k))
    ),
  };
}
