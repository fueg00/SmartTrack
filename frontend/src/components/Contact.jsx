import React from 'react';

const Contact = ({ onBack }) => {
  return (
    <div className="legal-page container">
      <button className="btn-link" onClick={onBack}>&larr; Back</button>
      <h1>Contact Us</h1>
      
      <section>
        <p><strong>Business Name:</strong> SmartTrack Solutions</p>
        <p><strong>Support Email:</strong> <a href="mailto:support@getsmarttrack.io">support@getsmarttrack.io</a></p>
        <p><strong>Support Phone:</strong> +1 (555) 012-3456</p>
        <p><strong>Mailing Address:</strong> 123 Tech Lane, Suite 100, San Francisco, CA 94107, USA</p>
      </section>

      <section>
        <h2>Need Help?</h2>
        <p>Our support team typically responds within 24 hours during business days (Monday to Friday).</p>
      </section>
    </div>
  );
};

export default Contact;
