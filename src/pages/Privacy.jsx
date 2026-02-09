import { MetaTags } from '@/components/seo/MetaTags';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      <MetaTags
        title="Privacy Policy"
        description="Privacy Policy for ShopTheBarber - how we collect, use, and protect your data"
      />

      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link to={createPageUrl('Home')} className="inline-flex items-center gap-2 text-primary hover:text-primary/80 mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2">Privacy Policy</h1>
          <p className="text-muted-foreground">Effective January 28, 2026 • Last Updated January 28, 2026</p>
        </div>

        <Card className="prose prose-sm max-w-none">
          <CardContent className="prose prose-sm prose-headings:font-bold prose-headings:mt-6 prose-headings:mb-3 pt-6 space-y-4">

            <section>
              <h2>1. Overview</h2>
              <p>
                ShopTheBarber ("we," "us," "our," or "Company") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services (collectively, the "Service").
              </p>
              <p>
                Please read this Privacy Policy carefully. If you do not agree with our policies and practices, please do not use our Service.
              </p>
            </section>

            <section>
              <h2>2. Information We Collect</h2>

              <h3 className="text-lg font-semibold mt-4 mb-2">2.1 Information You Provide</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Account Information</strong>: Name, email, phone number, date of birth, profile photo</li>
                <li><strong>Address Information</strong>: Street address, city, state, postal code (for location-based services)</li>
                <li><strong>Payment Information</strong>: Credit card, debit card, or digital wallet details (processed by payment processors, not stored by us)</li>
                <li><strong>Communications</strong>: Messages, reviews, feedback, and customer support inquiries</li>
                <li><strong>Booking Data</strong>: Appointment details, preferences, service history</li>
              </ul>

              <h3 className="text-lg font-semibold mt-4 mb-2">2.2 Information Collected Automatically</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Device Information</strong>: Device type, operating system, unique device ID, mobile network information</li>
                <li><strong>Usage Information</strong>: Browsing history, pages visited, time spent, features used, searches performed</li>
                <li><strong>Location Information</strong>: GPS coordinates, city/region (with your permission)</li>
                <li><strong>Cookies & Similar Technologies</strong>: Session cookies, persistent cookies, pixel tags, web beacons</li>
                <li><strong>IP Address & Log Data</strong>: IP address, browser type, referring page, pages accessed</li>
              </ul>

              <h3 className="text-lg font-semibold mt-4 mb-2">2.3 Information from Third Parties</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>Payment processors (for payment verification)</li>
                <li>Social media providers (if you connect your account)</li>
                <li>Marketing partners (for analytics)</li>
                <li>Service providers (for booking confirmations)</li>
              </ul>
            </section>

            <section>
              <h2>3. How We Use Your Information</h2>
              <p>We use the information we collect for:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Service Delivery</strong>: Processing bookings, managing appointments, delivering services</li>
                <li><strong>Communication</strong>: Sending confirmation emails, appointment reminders, notifications</li>
                <li><strong>Payments</strong>: Processing payments, managing refunds, preventing fraud</li>
                <li><strong>Personalization</strong>: Recommending barbers/services based on preferences and history</li>
                <li><strong>Analytics</strong>: Understanding user behavior, improving our Service</li>
                <li><strong>Marketing</strong>: Sending promotional emails, announcements (with your consent)</li>
                <li><strong>Legal Compliance</strong>: Complying with laws, preventing fraud, resolving disputes</li>
                <li><strong>Customer Support</strong>: Responding to inquiries, troubleshooting issues</li>
              </ul>
            </section>

            <section>
              <h2>4. How We Share Your Information</h2>

              <h3 className="text-lg font-semibold mt-4 mb-2">4.1 Service Providers</h3>
              <p>
                We share information with trusted third parties who assist us in operating our Service, including:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Payment processors (Stripe, Square)</li>
                <li>Email service providers</li>
                <li>Analytics platforms (Google Analytics)</li>
                <li>Cloud infrastructure providers</li>
              </ul>

              <h3 className="text-lg font-semibold mt-4 mb-2">4.2 With Other Users</h3>
              <p>
                When you book a service, we share your booking information (name, phone, email) with the barber/shop to facilitate the appointment. Reviews and ratings you post are visible to all users.
              </p>

              <h3 className="text-lg font-semibold mt-4 mb-2">4.3 Legal Requirements</h3>
              <p>
                We may disclose information when required by law, court order, or government request, or to protect our rights and safety.
              </p>

              <h3 className="text-lg font-semibold mt-4 mb-2">4.4 Business Transfers</h3>
              <p>
                If we are acquired or merge with another company, your information may be transferred as part of that transaction.
              </p>

              <h3 className="text-lg font-semibold mt-4 mb-2">4.5 We Do NOT Sell Data</h3>
              <p>
                ShopTheBarber does not sell, rent, or trade your personal information to third parties for their marketing purposes.
              </p>
            </section>

            <section>
              <h2>5. Data Security</h2>
              <p>
                We implement industry-standard security measures to protect your information, including:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>SSL/TLS encryption for data in transit</li>
                <li>AES-256 encryption for data at rest</li>
                <li>Regular security audits and penetration testing</li>
                <li>Access controls and multi-factor authentication</li>
                <li>Employee confidentiality agreements</li>
              </ul>
              <p className="mt-4">
                <strong>No Security Guarantee</strong>: While we implement strong security, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2>6. Your Privacy Rights</h2>

              <h3 className="text-lg font-semibold mt-4 mb-2">6.1 Access & Portability</h3>
              <p>
                You have the right to request and obtain a copy of the personal information we hold about you in a portable format.
              </p>

              <h3 className="text-lg font-semibold mt-4 mb-2">6.2 Correction & Deletion</h3>
              <p>
                You may request that we correct inaccurate information or delete your account. We will comply within 30 days, except where legally required to retain data.
              </p>

              <h3 className="text-lg font-semibold mt-4 mb-2">6.3 Opt-Out</h3>
              <p>
                You may opt out of marketing emails by clicking "unsubscribe" in our emails. You cannot opt out of transactional emails (confirmations, reminders).
              </p>

              <h3 className="text-lg font-semibold mt-4 mb-2">6.4 Location Data</h3>
              <p>
                You can disable location services in your device settings. This may limit certain features (e.g., finding nearby barbers).
              </p>

              <h3 className="text-lg font-semibold mt-4 mb-2">6.5 Cookies</h3>
              <p>
                You can control cookies through your browser settings. Disabling cookies may affect Service functionality.
              </p>

              <h3 className="text-lg font-semibold mt-4 mb-2">6.6 GDPR & CCPA Rights</h3>
              <p>
                If you are in the EU or California, you have additional rights including:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>GDPR</strong>: Right to object, right to restrict processing, right to data portability</li>
                <li><strong>CCPA</strong>: Right to know, right to delete, right to opt-out of sale, non-discrimination</li>
              </ul>
            </section>

            <section>
              <h2>7. Children's Privacy</h2>
              <p>
                ShopTheBarber is not intended for children under 13. We do not knowingly collect information from children. If we become aware that a child has provided information, we will delete it immediately.
              </p>
              <p>
                Parents concerned about their child's information can contact us at privacy@shopthebarber.com.
              </p>
            </section>

            <section>
              <h2>8. International Data Transfers</h2>
              <p>
                Your information may be transferred to, stored in, and processed in countries other than your country of residence. These countries may have different data protection laws.
              </p>
              <p>
                By using ShopTheBarber, you consent to the transfer of your information to countries outside your country of residence, including the United States.
              </p>
            </section>

            <section>
              <h2>9. Third-Party Links</h2>
              <p>
                Our Service may contain links to third-party websites. We are not responsible for their privacy practices. Please review their privacy policies before providing information.
              </p>
            </section>

            <section>
              <h2>10. Retention of Information</h2>
              <p>
                We retain your information for as long as necessary to provide services and comply with legal obligations. Specific retention periods:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Account Information</strong>: Retained while account is active + 3 years after deletion</li>
                <li><strong>Transaction Data</strong>: Retained for 7 years (tax/legal requirements)</li>
                <li><strong>Communications</strong>: Retained for 2 years</li>
                <li><strong>Analytics</strong>: Aggregated data retained indefinitely</li>
              </ul>
            </section>

            <section>
              <h2>11. Do Not Track</h2>
              <p>
                Our Service does not respond to "Do Not Track" browser signals. Third parties may collect information about your online activities over time across websites.
              </p>
            </section>

            <section>
              <h2>12. California Resident Rights</h2>
              <p>
                If you are a California resident, you have specific rights under CCPA:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Right to Know</strong>: What personal information is collected and how it's used</li>
                <li><strong>Right to Delete</strong>: Request deletion of personal information (with exceptions)</li>
                <li><strong>Right to Opt-Out</strong>: Opt out of the sale or sharing of personal information</li>
                <li><strong>Right to Non-Discrimination</strong>: No discrimination for exercising CCPA rights</li>
                <li><strong>Right to Correct</strong>: Request correction of inaccurate information</li>
              </ul>
              <p className="mt-4">
                To exercise these rights, contact privacy@shopthebarber.com with "CCPA Request" in the subject line.
              </p>
            </section>

            <section>
              <h2>13. EU Resident Rights (GDPR)</h2>
              <p>
                If you are in the EU, you have rights under GDPR:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Right to Access</strong>: Request a copy of your personal data</li>
                <li><strong>Right to Rectification</strong>: Correct inaccurate data</li>
                <li><strong>Right to Erasure</strong>: Request deletion ("right to be forgotten")</li>
                <li><strong>Right to Restrict Processing</strong>: Limit how we use your data</li>
                <li><strong>Right to Data Portability</strong>: Receive data in portable format</li>
                <li><strong>Right to Object</strong>: Object to processing of your data</li>
              </ul>
              <p className="mt-4">
                To exercise these rights, contact privacy@shopthebarber.com with "GDPR Request" in the subject line.
              </p>
            </section>

            <section>
              <h2>14. Changes to This Privacy Policy</h2>
              <p>
                We may update this Privacy Policy at any time. Material changes will be posted on this page with an updated effective date. Your continued use of the Service constitutes acceptance of the updated Privacy Policy.
              </p>
            </section>

            <section>
              <h2>15. Contact Us</h2>
              <p>
                For questions or concerns about this Privacy Policy, contact:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg mt-3 space-y-2">
                <p><strong>Email</strong>: privacy@shopthebarber.com</p>
                <p><strong>Data Protection Officer</strong>: dpo@shopthebarber.com</p>
                <p><strong>Mailing Address</strong>: ShopTheBarber, Privacy Team, 123 Grooming Blvd, San Francisco, CA 94103</p>
              </div>
            </section>

            <section>
              <h2>16. Your California Privacy Rights (CCPA)</h2>
              <p>
                <strong>Personal Information We Collect</strong>:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Identifiers (name, email, phone)</li>
                <li>Commercial information (bookings, payments)</li>
                <li>Internet activity (browsing history, IP address)</li>
                <li>Location data</li>
                <li>Inferences (preferences, interests)</li>
              </ul>
              <p className="mt-4">
                <strong>To Submit a CCPA Request</strong>:
              </p>
              <ol className="list-decimal pl-5 space-y-2">
                <li>Email privacy@shopthebarber.com with "CCPA Request" in the subject</li>
                <li>Provide identifying information for verification</li>
                <li>Specify your request (access, delete, opt-out)</li>
                <li>We will respond within 45 days</li>
              </ol>
            </section>

            <section className="border-t pt-6 mt-8">
              <p className="text-sm text-muted-foreground">
                Last Updated: January 28, 2026<br />
                Version: 1.0
              </p>
            </section>

          </CardContent>
        </Card>

        <div className="mt-8 space-y-2">
          <p className="text-sm text-muted-foreground">
            <Link to={createPageUrl('TermsOfService')} className="text-primary hover:underline">View Terms of Service</Link>
          </p>
          <p className="text-sm text-muted-foreground">
            <Link to={createPageUrl('Home')} className="text-primary hover:underline">Return to Home</Link>
          </p>
        </div>
      </div>
    </div>
  );
}