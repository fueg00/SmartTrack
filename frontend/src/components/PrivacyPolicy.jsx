import React from 'react';

const PrivacyPolicy = ({ onBack }) => {
  return (
    <div className="legal-page container">
      <button className="btn-link" onClick={onBack}>&larr; Back</button>
      <h1>Privacy Policy</h1>
      <p>Last Updated: May 19, 2026</p>
      
      <section>
        <p>At SmartTrack, we take your privacy seriously. This policy outlines how we handle your data:</p>
        <ul>
          <li><strong>Data Collection:</strong> We collect organization name, user emails, and inventory data to provide the service.</li>
          <li><strong>Usage:</strong> Your data is used strictly for managing your inventory and providing account-related notifications.</li>
          <li><strong>Sharing:</strong> We do not sell your data. We share data only with essential service providers like Turso (database) and Stripe (payment processing).</li>
          <li><strong>Security:</strong> We use industry-standard encryption and security practices to protect your information.</li>
        </ul>
      </section>

      <section>
        <h2>Contact Us</h2>
        <p>If you have any questions about this Privacy Policy, please contact us at support@getsmarttrack.io.</p>
      </section>
    </div>
  );
};

export default PrivacyPolicy;
