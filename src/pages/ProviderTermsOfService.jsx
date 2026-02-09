import { MetaTags } from '@/components/seo/MetaTags';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

export default function ProviderTermsOfService() {
  return (
    <div className="min-h-screen bg-background">
      <MetaTags
        title="Provider Terms of Service"
        description="Terms of Service for ShopTheBarber service providers"
      />

      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link to={createPageUrl('ProviderDashboard')} className="inline-flex items-center gap-2 text-primary hover:text-primary/80 mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Provider Dashboard
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2">Terms of Service</h1>
          <p className="text-muted-foreground">Service Provider Edition • Effective January 28, 2026</p>
        </div>

        <Card className="prose prose-sm max-w-none">
          <CardContent className="prose prose-sm prose-headings:font-bold prose-headings:mt-6 prose-headings:mb-3 pt-6 space-y-4">

            <section>
              <h2>1. Acceptance of Terms</h2>
              <p>
                By listing your services on ShopTheBarber ("Platform"), you agree to be bound by these Terms of Service. These terms apply to barbers, barbershops, and any individual or business offering professional grooming services.
              </p>
              <p>
                If you are a customer looking to book services, please refer to the separate Customer Terms of Service.
              </p>
            </section>

            <section>
              <h2>2. Provider Account & Verification</h2>
              <p>
                <strong>Account Requirements</strong>: You must provide accurate business information, professional credentials, and contact details. You are responsible for maintaining account accuracy.
              </p>
              <p>
                <strong>Verification</strong>: To list services, you must pass ShopTheBarber verification, which may include:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Identity verification</li>
                <li>Business license validation</li>
                <li>Insurance/liability confirmation</li>
                <li>Professional credential review</li>
              </ul>
              <p className="mt-4">
                <strong>Rejection & Suspension</strong>: We may reject applications or suspend accounts that do not meet our quality and safety standards.
              </p>
            </section>

            <section>
              <h2>3. Services & Pricing</h2>
              <p>
                <strong>Service Listing</strong>: You control your service offerings, descriptions, and pricing. Descriptions must be accurate and not misleading.
              </p>
              <p>
                <strong>Price Changes</strong>: You may adjust prices, but changes apply only to future bookings, not confirmed appointments.
              </p>
              <p>
                <strong>Service Delivery</strong>: You must deliver services as described in your listing. If you cannot, you are responsible for notifying customers immediately.
              </p>
              <p>
                <strong>Service Duration</strong>: You are responsible for providing services within the stated time duration. Delays or early terminations may result in disputes.
              </p>
            </section>

            <section>
              <h2>4. Booking Management</h2>
              <p>
                <strong>Accepting Bookings</strong>: You may accept, decline, or request to reschedule bookings based on your availability. You must respond to booking requests within 4 hours.
              </p>
              <p>
                <strong>Availability Management</strong>: You are responsible for accurately setting and updating your schedule. Overbooking or availability mismatches will result in customer complaints and platform penalties.
              </p>
              <p>
                <strong>Cancellations by Provider</strong>: You may cancel bookings due to emergencies or illness. Cancellations must be submitted 24+ hours in advance. Late cancellations may result in penalties or customer compensation.
              </p>
              <p>
                <strong>No-Show Policy</strong>: If you miss a confirmed appointment without valid reason, customers may request refunds. Repeated no-shows will result in account suspension.
              </p>
            </section>

            <section>
              <h2>5. Commission & Payouts</h2>
              <p>
                <strong>Commission Structure</strong>: ShopTheBarber charges a commission on all completed bookings. Current rates are:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Independent Barbers: 15% commission</li>
                <li>Barbershop Chains: 10% commission</li>
                <li>Premium Partners: 8% commission</li>
              </ul>
              <p className="mt-4">
                <strong>Payment Processing</strong>: Customers pay ShopTheBarber, which deducts the commission and transfers your earnings.
              </p>
              <p>
                <strong>Payout Schedule</strong>: Earnings are paid out on a weekly basis (every Friday) via your connected bank account or payment method. Minimum payout threshold: $50.
              </p>
              <p>
                <strong>Payment Disputes</strong>: You have 30 days to dispute a payout. Contact our provider support team with documentation.
              </p>
            </section>

            <section>
              <h2>6. Reviews & Ratings</h2>
              <p>
                <strong>Customer Reviews</strong>: After each service, customers may leave ratings and reviews. You agree to accept honest feedback professionally.
              </p>
              <p>
                <strong>Responding to Reviews</strong>: You are encouraged to respond to reviews professionally. We provide tools to reply and address concerns.
              </p>
              <p>
                <strong>Fake Reviews</strong>: You agree not to post fake reviews, ask customers for positive reviews in exchange for discounts, or otherwise manipulate ratings. Violations result in account suspension.
              </p>
              <p>
                <strong>Review Removal</strong>: Flagged or false reviews may be removed upon investigation. You may report reviews you believe violate our guidelines.
              </p>
            </section>

            <section>
              <h2>7. Liability & Insurance</h2>
              <p>
                <strong>Professional Liability</strong>: You are solely responsible for the quality and safety of services provided. You must hold appropriate professional liability insurance.
              </p>
              <p>
                <strong>Injury or Damage</strong>: You are liable for any injuries, property damage, or harm caused during service delivery. Insurance requirements vary by location.
              </p>
              <p>
                <strong>Certification</strong>: You represent that you have all required licenses, certifications, and training for the services you offer.
              </p>
              <p>
                <strong>Disclaimer</strong>: ShopTheBarber is not responsible for injuries or outcomes resulting from services provided by independent providers.
              </p>
            </section>

            <section>
              <h2>8. Data & Privacy</h2>
              <p>
                <strong>Customer Information</strong>: You have access to customer contact information to manage bookings. You may not sell, share, or use this data for unauthorized purposes.
              </p>
              <p>
                <strong>Confidentiality</strong>: Customer data is confidential. You agree to protect it and comply with privacy laws (GDPR, CCPA, etc.).
              </p>
              <p>
                <strong>No Direct Transactions</strong>: You agree not to circumvent ShopTheBarber by arranging direct payments or off-platform transactions. This violates these Terms and may result in account termination.
              </p>
            </section>

            <section>
              <h2>9. Restrictions on Conduct</h2>
              <p>
                You agree not to:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Discriminate based on race, gender, religion, disability, or other protected classes</li>
                <li>Engage in harassment or abusive behavior toward customers</li>
                <li>Solicit customers to leave platform or make direct payments</li>
                <li>Post misleading service descriptions or photos</li>
                <li>Offer services not disclosed in your profile</li>
                <li>Violate health, safety, or professional regulations</li>
                <li>Engage in fraud, theft, or illegal activity</li>
                <li>Share login credentials or allow others to operate your account</li>
              </ul>
            </section>

            <section>
              <h2>10. Dispute Resolution</h2>
              <p>
                <strong>Customer Disputes</strong>: If a customer files a dispute (e.g., refund request, complaint), we will investigate and render a decision based on evidence.
              </p>
              <p>
                <strong>Resolution Process</strong>:
              </p>
              <ol className="list-decimal pl-5 space-y-2">
                <li>Customer files dispute within 7 days of service</li>
                <li>You are notified and given 3 days to respond</li>
                <li>ShopTheBarber reviews evidence from both sides</li>
                <li>Decision issued within 5 business days</li>
                <li>If refund is issued, you may appeal within 7 days</li>
              </ol>
              <p className="mt-4">
                <strong>Arbitration</strong>: For disputes, you agree to binding arbitration rather than court proceedings.
              </p>
            </section>

            <section>
              <h2>11. Quality & Performance Standards</h2>
              <p>
                <strong>Service Quality</strong>: Customers expect professional, timely, and courteous service. Quality is measured by:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Customer ratings (target: 4.5+ stars)</li>
                <li>Completion rate (target: 95%+ of bookings completed)</li>
                <li>Response time (target: respond within 4 hours)</li>
                <li>Professional conduct and hygiene standards</li>
              </ul>
              <p className="mt-4">
                <strong>Probation & Suspension</strong>: Providers with low ratings or high cancellation rates may be placed on probation or suspended.
              </p>
            </section>

            <section>
              <h2>12. Promotional Tools & Incentives</h2>
              <p>
                <strong>ShopTheBarber Promotions</strong>: We may offer promotional discounts, featured listings, or marketing tools. You may opt-in or opt-out.
              </p>
              <p>
                <strong>Your Own Promotions</strong>: You may offer discounts or promotions, but they must:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Not circumvent ShopTheBarber's commission structure</li>
                <li>Be advertised through our platform tools</li>
                <li>Comply with consumer protection laws</li>
              </ul>
            </section>

            <section>
              <h2>13. Intellectual Property</h2>
              <p>
                <strong>Your Content</strong>: You retain rights to your photos, descriptions, and service information. By posting, you grant ShopTheBarber a license to display and promote your profile.
              </p>
              <p>
                <strong>Platform IP</strong>: All ShopTheBarber branding, technology, and content is our property and may not be reproduced without permission.
              </p>
            </section>

            <section>
              <h2>14. Changes to Terms & Fees</h2>
              <p>
                We may update these Terms or commission rates at any time. Changes to fees will take effect 30 days after notice. Your continued use of the Platform constitutes acceptance.
              </p>
            </section>

            <section>
              <h2>15. Account Termination</h2>
              <p>
                We may terminate your account immediately for:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Violation of these Terms</li>
                <li>Repeated customer complaints or safety issues</li>
                <li>Fraudulent activity or misrepresentation</li>
                <li>Off-platform solicitation of customers</li>
                <li>Failure to maintain required insurance</li>
              </ul>
              <p className="mt-4">
                Upon termination, you lose access to the Platform and any pending earnings may be held pending investigation.
              </p>
            </section>

            <section>
              <h2>16. Support & Resources</h2>
              <p>
                ShopTheBarber provides:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Provider dashboard for booking management</li>
                <li>Scheduling & calendar tools</li>
                <li>Customer messaging platform</li>
                <li>Analytics & performance insights</li>
                <li>Promotional tools</li>
                <li>Provider support via email & chat</li>
              </ul>
            </section>

            <section>
              <h2>17. Contact & Support</h2>
              <p>
                For questions regarding these Terms, contact:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg mt-3">
                <p><strong>Provider Support</strong>: provider-support@shopthebarber.com</p>
                <p><strong>Legal Questions</strong>: legal@shopthebarber.com</p>
                <p><strong>Dispute Escalation</strong>: disputes@shopthebarber.com</p>
              </div>
            </section>

            <section className="border-t pt-6 mt-8">
              <p className="text-sm text-muted-foreground">
                Last Updated: January 28, 2026<br />
                Version: 1.0 (Provider Edition)
              </p>
            </section>

          </CardContent>
        </Card>

        <div className="mt-8 space-y-2">
          <p className="text-sm text-muted-foreground">
            Are you a customer? <Link to={createPageUrl('TermsOfService')} className="text-primary hover:underline">View Customer Terms of Service</Link>
          </p>
          <p className="text-sm text-muted-foreground">
            <Link to={createPageUrl('ProviderDashboard')} className="text-primary hover:underline">Return to Provider Dashboard</Link>
          </p>
        </div>
      </div>
    </div>
  );
}