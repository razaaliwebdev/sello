import React from "react";

const OurPrivacyPolicy = () => {
  return (
    <div className="bg-gradient-to-b from-gray-50 to-white min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-4xl text-gray-800">
        <h2 className="text-4xl font-extrabold mb-8 text-center text-gray-900">
          Privacy Policy – Sello.pk
        </h2>
        <section className="mb-8">
          <p className="mb-4 text-sm text-gray-500 text-center">
            Last updated: July 21, 2025
          </p>
        </section>
        <section className="mb-8">
          <p className="mb-4">
            At Sello.pk, we are committed to your privacy and it is our goal to
            protect your personal information. This Privacy Policy explains how
            we collect, use, store and secure your data which we obtain from our
            website or mobile application.
          </p>
        </section>
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            1. Information We Collect
          </h2>
          <p className="mb-2">We when you use Sello.pk do collect:</p>
          <ul className="list-disc list-inside mb-2">
            <li>Name</li>
            <li>Phone number</li>
            <li>Email address</li>
            <li>Location</li>
            <li>Device and browser information</li>
            <li>Vehicle listings and related content</li>
            <li>Messages exchanged on the platform</li>
          </ul>
        </section>
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            2. Why We Collect Your Information
          </h2>
          <p className="mb-2">Your info is used for the following:</p>
          <ul className="list-disc list-inside mb-2">
            <li>To deliver, run and enhance our services.</li>
            <li>To confirm user identity and prevent fraud.</li>
            <li>To pass along updates and service notifications.</li>
            <li>To only send promotional messages if you choose.</li>
          </ul>
        </section>
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            3. Data Protection & Security
          </h2>
          <ul className="list-disc list-inside mb-2">
            <li>SSL encryption secures all data transmissions.</li>
            <li>
              Data is stored in secure servers which have restricted access.
            </li>
            <li>We don't share your personal data with third parties.</li>
          </ul>
        </section>
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Your Rights</h2>
          <ul className="list-disc list-inside mb-2">
            <li>Request access to your personal data.</li>
            <li>Request removal of your account and data.</li>
            <li>Cancel marketing or promotional communications at any time.</li>
            <li>Our support team may be contacted for your request.</li>
          </ul>
        </section>
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Third-Party Tools</h2>
          <p className="mb-2">
            We may use third‑party analytics tools (for example Google
            Analytics) to:
          </p>
          <ul className="list-disc list-inside mb-2">
            <li>Monitor platform performance.</li>
            <li>Identify patterns in how users behave anonymously.</li>
            <li>Improve user experience and service efficiency.</li>
          </ul>
          <p className="mb-2">
            These tools collect data only when it is clearly put forth by the
            user.
          </p>
        </section>
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            6. Refund & Dispute Policy for Paid Features
          </h2>
          <ul className="list-disc list-inside mb-2">
            <li>
              Refunds are given when a Sello.pk technical issue prevents
              delivery of a paid service (e.g., premium or featured listing).
            </li>
            <li>
              No refunds are provided for user errors, fake or misleading
              listings, or voluntary removal of ads.
            </li>
            <li>Within 7 days of payment all disputes must be raised.</li>
            <li>
              Buyers and sellers are responsible for transaction verification.
            </li>
            <li>
              Sello.pk does not get involved in post‑sale issues between users.
            </li>
          </ul>
        </section>
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Cookie Policy</h2>
          <p className="mb-2">
            <strong>What Are Cookies?</strong> Cookies are small files saved on
            your device that help store preferences and improve functionality.
          </p>
          <p className="mb-2">
            <strong>How We Use Cookies</strong>
          </p>
          <ul className="list-disc list-inside mb-2">
            <li>Save login information (optional).</li>
            <li>Improve user experience and site functionality.</li>
            <li>Track user behavior on site for analysis.</li>
          </ul>
          <p className="mb-2">
            You can disable cookies in your browser settings; however, some
            platform features may not work correctly.
          </p>
        </section>
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            8. Changes to This Privacy Policy
          </h2>
          <p className="mb-2">
            We will modify this Privacy Policy at times as we see fit. When we
            do, we will post the change on this page along with a new effective
            date. By continuing to use the site, you accept the revised policy.
          </p>
        </section>
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">9. Contact Us</h2>
          <p className="mb-2">
            For privacy concerns, data requests, or disputes, please contact:
          </p>
          <p className="mb-2">Sello Team</p>
          <p className="mb-2">📧 Email: support@sello.pk</p>
        </section>
        <p className="mt-10 text-sm text-gray-500 text-center">
          © {new Date().getFullYear()} Sello. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default OurPrivacyPolicy;
