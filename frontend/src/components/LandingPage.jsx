import React, { useState } from 'react';
import './LandingPage.css';
import heroImage from '../assets/hero.png';

function LandingPage({ onLogin, onRegister, onNavigate }) {
  const [stockouts, setStockouts] = useState(5);
  const [profitLost, setProfitLost] = useState(100);

  const annualSavings = stockouts * profitLost * 12;

  return (
    <div className="landing-page">
      <header className="landing-header">
        <div className="container">
          <div className="nav-brand">SmartTrack</div>
          <div className="header-actions">
            <button className="btn-link" onClick={onLogin}>Login</button>
            <button className="btn-primary" onClick={onRegister}>Start for Free</button>
          </div>
        </div>
      </header>

      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-content">
            <h1>Stop Guessing, Start Tracking. Inventory Made Simple.</h1>
            <p className="sub-headline">The mobile-first inventory solution for small and medium businesses. Say goodbye to spreadsheet chaos and hello to real-time clarity.</p>
            <div className="hero-ctas">
              <button className="btn-primary btn-lg" onClick={onRegister}>Start for Free</button>
              <button className="btn-secondary btn-lg">Watch Demo</button>
            </div>
          </div>
          <div className="hero-image">
            <img src={heroImage} alt="SmartTrack Dashboard" />
          </div>
        </div>
      </section>

      <section className="problem">
        <div className="container text-center">
          <h2>Still using spreadsheets to track your stock?</h2>
          <p>Manual counting is slow, prone to error, and keeps you chained to your desk. SmartTrack gives you the freedom to manage your inventory from anywhere, right on your phone.</p>
        </div>
      </section>

      <section className="features">
        <div className="container">
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Adjust Stock in Two Taps</h3>
              <p>Recording a new shipment or a sale has never been easier. Focus on your business, not your paperwork.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔔</div>
              <h3>Real-Time Low-Stock Alerts</h3>
              <p>Get instant notifications on your dashboard when items are running low. Stay ahead of demand and prevent stock-outs.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Accurate Valuation & Movement</h3>
              <p>Generate professional reports for tax time or asset management. Know exactly what your inventory is worth at any moment.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h3>Installable on All Devices</h3>
              <p>No app store needed. Add SmartTrack to your home screen on iOS or Android and use it like a native app.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="roi-calculator">
        <div className="container">
          <div className="roi-card">
            <h2>How much are stock-outs costing you?</h2>
            <div className="roi-inputs">
              <div className="input-group">
                <label>Average stock-outs per month</label>
                <input 
                  type="number" 
                  value={stockouts} 
                  onChange={(e) => setStockouts(parseInt(e.target.value) || 0)} 
                />
              </div>
              <div className="input-group">
                <label>Average profit lost per stock-out ($)</label>
                <input 
                  type="number" 
                  value={profitLost} 
                  onChange={(e) => setProfitLost(parseInt(e.target.value) || 0)} 
                />
              </div>
            </div>
            <div className="roi-result">
              <p>You could save <strong>${annualSavings.toLocaleString()}</strong> per year with SmartTrack.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="pricing">
        <div className="container">
          <h2 className="text-center">Simple, Transparent Pricing</h2>
          <div className="pricing-grid">
            <div className="pricing-card">
              <h3>Free</h3>
              <div className="price">$0<span>/mo</span></div>
              <ul>
                <li>50 Products</li>
                <li>1 User</li>
                <li>Basic Tracking</li>
              </ul>
              <button className="btn-outline" onClick={onRegister}>Start for Free</button>
            </div>
            <div className="pricing-card featured">
              <h3>Pro</h3>
              <div className="price">$39<span>/mo</span></div>
              <ul>
                <li>1,000 Products</li>
                <li>5 Users</li>
                <li>Pro Reports</li>
                <li>Email Support</li>
              </ul>
              <button className="btn-primary" onClick={onRegister}>Get Started</button>
            </div>
            <div className="pricing-card">
              <h3>Enterprise</h3>
              <div className="price">$99<span>/mo</span></div>
              <ul>
                <li>Unlimited Everything</li>
                <li>API Access</li>
                <li>Custom Integration</li>
                <li>24/7 Priority Support</li>
              </ul>
              <button className="btn-outline" onClick={onRegister}>Contact Sales</button>
            </div>
          </div>
        </div>
      </section>

      <section className="faq">
        <div className="container">
          <h2 className="text-center">Frequently Asked Questions</h2>
          <div className="faq-list">
            <div className="faq-item">
              <h4>Is my data secure?</h4>
              <p>Yes! We use industry-standard encryption and isolation to ensure your business data is only accessible by you.</p>
            </div>
            <div className="faq-item">
              <h4>Can I use it on my iPhone?</h4>
              <p>Absolutely. SmartTrack is a Progressive Web App (PWA) optimized for all mobile devices.</p>
            </div>
            <div className="faq-item">
              <h4>Can I export my data?</h4>
              <p>Yes, Pro and Enterprise users can export their inventory to CSV at any time.</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="container text-center">
          <h2>Ready to simplify your inventory?</h2>
          <button className="btn-primary btn-lg" onClick={onRegister}>Start Your Free Trial</button>
          <div className="footer-links" style={{ marginTop: '20px', marginBottom: '20px' }}>
            <button className="btn-link" style={{ color: 'white' }} onClick={() => onNavigate('privacy')}>Privacy Policy</button>
            <button className="btn-link" style={{ color: 'white' }} onClick={() => onNavigate('terms')}>Terms of Service</button>
            <button className="btn-link" style={{ color: 'white' }} onClick={() => onNavigate('contact')}>Contact Us</button>
          </div>
          <p className="mt-2">&copy; 2026 SmartTrack. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
