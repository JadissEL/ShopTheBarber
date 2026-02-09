import { MetaTags } from '@/components/seo/MetaTags';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background">
      <MetaTags
        title="Terms of Service"
        description="Terms of Service for ShopTheBarber customers"
      />

      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link to={createPageUrl('Dashboard')} className="inline-flex items-center gap-2 text-primary hover:text-primary/80 mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2">Terms of Service</h1>
          <p className="text-muted-foreground">Customer Edition • Effective January 28, 2026</p>
        </div>

        <Card className="prose prose-sm max-w-none">
          <CardContent className="prose prose-sm prose-headings:font-bold prose-headings:mt-6 prose-headings:mb-3 pt-6 space-y-4">

            <section>
              <h2>1. Acceptance of Terms</h2>
              <p>
                By accessing or using ShopTheBarber ("Service"), you agree to be bound by these Terms of Service. If you do not agree to any part of these terms, you may not use our Service.
              </p>
              <p>
                These Terms apply to customers booking services through our platform. If you are a service provider (barber, shop owner), please refer to the separate Provider Terms of Service.
              </p>
            </section>

            <section>
              <h2>2. Description of Service</h2>
              <p>
                ShopTheBarber is a digital marketplace that connects customers with professional barbers and barbershops. The Service allows you to:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Browse and discover barbers and shops</li>
                <li>View available services and pricing</li>
                <li>Book appointments</li>
                <li>Make payments</li>
                <li>Leave reviews and ratings</li>
                <li>Manage your booking history</li>
                <li>Earn and redeem loyalty rewards</li>
              </ul>
            </section>

            <section>
              <h2>3. User Accounts</h2>
              <p>
                <strong>Account Creation</strong>: You must provide accurate, complete, and current information when creating an account. You are responsible for maintaining the confidentiality of your login credentials.
              </p>
              <p>
                <strong>Your Responsibility</strong>: You are fully responsible for all activities that occur under your account. You agree to notify us immediately of any unauthorized access.
              </p>
              <p>
                <strong>Account Termination</strong>: We reserve the right to suspend or terminate accounts that violate these Terms.
              </p>
            </section>

            <section>
              <h2>4. Booking & Reservations</h2>
              <p>
                <strong>Booking Process</strong>: When you submit a booking request, you are making an offer to purchase the service at the stated price. The barber/shop may accept or decline your booking.
              </p>
              <p>
                <strong>Booking Confirmation</strong>: A booking is only confirmed when you receive a confirmation notification from the barber/shop.
              </p>
              <p>
                <strong>No-Show Policy</strong>: If you do not arrive for your appointment within 15 minutes of the scheduled time without canceling, it will be marked as a no-show. Repeated no-shows may result in service restrictions.
              </p>
              <p>
                <strong>Cancellations</strong>: You may cancel bookings up to 4 hours before the appointment. Cancellations within 4 hours will result in a forfeit of 50% of the service price.
              </p>
            </section>

            <section>
              <h2>5. Payments & Fees</h2>
              <p>
                <strong>Payment Terms</strong>: Payment is due at the time of booking. We accept credit cards, debit cards, digital wallets, and gift cards.
              </p>
              <p>
                <strong>Pricing</strong>: All prices are displayed in USD (or local currency). Prices may change at any time, but changes will not affect bookings already confirmed.
              </p>
              <p>
                <strong>Platform Fee</strong>: ShopTheBarber charges a platform fee (typically 5%) on all bookings to cover payment processing, support, and platform maintenance.
              </p>
              <p>
                <strong>Tax</strong>: Sales tax may apply depending on your location and is calculated at checkout.
              </p>
              <p>
                <strong>Refunds</strong>: Refunds are issued per our Refund Policy. If you cancel a booking, your refund will be processed within 5-7 business days.
              </p>
            </section>

            <section>
              <h2>6. Refunds & Cancellations</h2>
              <p>
                <strong>Refund Eligibility</strong>:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Full Refund</strong>: If you cancel 4+ hours before appointment</li>
                <li><strong>50% Refund</strong>: If you cancel within 4 hours</li>
                <li><strong>No Refund</strong>: No-show or late cancellation after service begins</li>
                <li><strong>Special Cases</strong>: Refunds approved by customer support for legitimate issues</li>
              </ul>
              <p className="mt-4">
                <strong>Dispute Resolution</strong>: If you dispute a charge or refund, contact our support team within 30 days. We will investigate and respond within 5 business days.
              </p>
            </section>

            <section>
              <h2>7. Reviews & Ratings</h2>
              <p>
                <strong>Honest Feedback</strong>: You may leave reviews and ratings after completing a service. Reviews must be honest, factual, and non-defamatory.
              </p>
              <p>
                <strong>Prohibited Content</strong>: Do not post:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Personal or private information</li>
                <li>Offensive, harassing, or abusive language</li>
                <li>False or misleading statements</li>
                <li>Promotional or commercial content</li>
              </ul>
              <p className="mt-4">
                <strong>Review Moderation</strong>: We may remove reviews that violate these guidelines. Repeated violations may result in review posting restrictions.
              </p>
            </section>

            <section>
              <h2>8. Loyalty Program</h2>
              <p>
                <strong>Earning Points</strong>: You earn 1 loyalty point per dollar spent on bookings. Points are credited after a service is completed.
              </p>
              <p>
                <strong>Redeeming Points</strong>: Points can be redeemed for discounts, free services, or exclusive rewards.
              </p>
              <p>
                <strong>Point Expiration</strong>: Points that are not redeemed within 12 months of earning will expire. Expired points cannot be recovered.
              </p>
              <p>
                <strong>Account Termination</strong>: If your account is terminated, all remaining points will be forfeited.
              </p>
            </section>

            <section>
              <h2>9. User Conduct</h2>
              <p>
                You agree not to:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Violate any laws or regulations</li>
                <li>Harass, threaten, or abuse barbers or other users</li>
                <li>Attempt to manipulate pricing or availability</li>
                <li>Engage in fraudulent activity</li>
                <li>Disrupt the Service or attempt unauthorized access</li>
                <li>Use the Service for commercial purposes without authorization</li>
                <li>Share your account credentials with others</li>
              </ul>
            </section>

            <section>
              <h2>10. Privacy & Data Protection</h2>
              <p>
                Your use of ShopTheBarber is also governed by our Privacy Policy. Please review it to understand our data collection, use, and protection practices.
              </p>
              <p>
                We protect your personal information using industry-standard security measures, including encryption and secure payment processing.
              </p>
            </section>

            <section>
              <h2>11. Liability & Disclaimers</h2>
              <p>
                <strong>Service Provided "As-Is"</strong>: ShopTheBarber is provided on an "as-is" basis. We make no warranties regarding the quality, timeliness, or safety of services provided by barbers/shops.
              </p>
              <p>
                <strong>Independent Contractors</strong>: Barbers and shops are independent contractors, not ShopTheBarber employees. We do not control their work quality or conduct.
              </p>
              <p>
                <strong>Limitation of Liability</strong>: ShopTheBarber's liability is limited to the amount you paid for the service. We are not liable for indirect, incidental, or consequential damages.
              </p>
              <p>
                <strong>Health & Safety</strong>: Customers assume all responsibility for health and safety risks. If you have health concerns, consult a medical professional before booking.
              </p>
            </section>

            <section>
              <h2>12. Intellectual Property</h2>
              <p>
                All content on ShopTheBarber, including text, images, logos, and software, is our property or licensed to us. You may not reproduce, modify, or distribute this content without permission.
              </p>
            </section>

            <section>
              <h2>13. Changes to Terms</h2>
              <p>
                We may update these Terms at any time. Changes will be effective 30 days after posting. Your continued use of the Service constitutes acceptance of updated Terms.
              </p>
            </section>

            <section>
              <h2>14. Dispute Resolution</h2>
              <p>
                <strong>Informal Resolution</strong>: For any disputes, first contact our support team at support@shopthebarber.com.
              </p>
              <p>
                <strong>Binding Arbitration</strong>: If informal resolution fails, disputes will be resolved by binding arbitration rather than court proceedings. Each party bears its own legal costs.
              </p>
              <p>
                <strong>Class Action Waiver</strong>: You agree not to participate in class actions against ShopTheBarber.
              </p>
            </section>

            <section>
              <h2>15. Termination</h2>
              <p>
                We may terminate your account immediately if you violate these Terms. Upon termination:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Your access to the Service is revoked</li>
                <li>Any remaining loyalty points are forfeited</li>
                <li>You remain responsible for any outstanding charges</li>
              </ul>
            </section>

            <section>
              <h2>16. Contact Us</h2>
              <p>
                For questions or concerns regarding these Terms, please contact:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg mt-3">
                <p><strong>Email</strong>: legal@shopthebarber.com</p>
                <p><strong>Mailing Address</strong>: ShopTheBarber, Legal Team, [Address]</p>
                <p><strong>Support</strong>: support@shopthebarber.com</p>
              </div>
            </section>

            <section className="border-t pt-6 mt-8">
              <p className="text-sm text-muted-foreground">
                Last Updated: January 28, 2026<br />
                Version: 1.0 (Customer Edition)
              </p>
            </section>

          </CardContent>
        </Card>

        <div className="mt-8 space-y-2">
          <p className="text-sm text-muted-foreground">
            Are you a service provider? <Link to={createPageUrl('ProviderTermsOfService')} className="text-primary hover:underline">View Provider Terms of Service</Link>
          </p>
          <p className="text-sm text-muted-foreground">
            <Link to={createPageUrl('Dashboard')} className="text-primary hover:underline">Return to Dashboard</Link>
          </p>
        </div>
      </div>
    </div>
  );
}