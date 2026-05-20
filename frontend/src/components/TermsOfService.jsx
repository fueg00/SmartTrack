import React from 'react';

const TermsOfService = ({ onBack }) => {
  return (
    <div className="legal-page container">
      <button className="btn-link" onClick={onBack}>&larr; Back</button>
      <h1>Terms of Service</h1>
      <p>Last Updated: May 19, 2026</p>

      <section>
        <h2>1. Agreement to Terms</h2>
        <p>By using SmartTrack, you agree to the following:</p>
        <ul>
          <li><strong>Account Security:</strong> You are responsible for maintaining the confidentiality of your login credentials.</li>
          <li><strong>Acceptable Use:</strong> You agree not to use the service for any illegal activities or to disrupt the service for others.</li>
          <li><strong>Service Availability:</strong> We strive for 99.9% uptime but do not guarantee uninterrupted service.</li>
          <li><strong>Subscription:</strong> Pro accounts are billed monthly or annually. You can cancel at any time.</li>
        </ul>
      </section>

      <section>
        <h2>2. Refund and Cancellation Policy</h2>
        <ul>
          <li><strong>Cancellation:</strong> You may cancel your Pro subscription at any time via the billing settings. Access will continue until the end of the current billing period.</li>
          <li><strong>Refunds:</strong> We offer a 30-day money-back guarantee for initial Pro subscriptions. If you are unsatisfied, contact support for a full refund within the first 30 days.</li>
        </ul>
      </section>

      <section>
        <h2>3. Shipping Policy</h2>
        <p>SmartTrack is a Software-as-a-Service (SaaS) platform. No physical goods are shipped. Access is granted immediately upon registration or payment.</p>
      </section>
    </div>
  );
};

export default TermsOfService;
