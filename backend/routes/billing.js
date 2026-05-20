const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

const PRICE_MAP = {
  pro: process.env.PRO_PRICE_ID,
  enterprise: process.env.ENT_PRICE_ID
};

// Create a Checkout Session
router.post('/create-checkout-session', async (req, res) => {
  const { tier } = req.body;
  const orgId = req.user.organization_id;
  const priceId = PRICE_MAP[tier.toLowerCase()];

  if (!priceId) {
    return res.status(400).json({ error: 'Invalid tier' });
  }

  // Get or create Stripe customer
  const orgs = await db.query('SELECT stripe_customer_id, name FROM organizations WHERE id = ?', [orgId]);
  let customerId = orgs[0].stripe_customer_id;

  if (!customerId) {
    const customer = await stripe.customers.create({
      name: orgs[0].name,
      metadata: { organization_id: orgId }
    });
    customerId = customer.id;
    await db.query('UPDATE organizations SET stripe_customer_id = ? WHERE id = ?', [customerId, orgId]);
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: `${process.env.FRONTEND_URL}/billing?success=true`,
    cancel_url: `${process.env.FRONTEND_URL}/billing?canceled=true`,
    metadata: { organization_id: orgId, tier: tier }
  });

  res.json({ url: session.url });
});

// Webhook handler function (exported separately)
const webhookHandler = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const session = event.data.object;
  let orgId, tier, subscriptionId, status;

  switch (event.type) {
    case 'checkout.session.completed':
      orgId = session.metadata.organization_id;
      tier = session.metadata.tier;
      subscriptionId = session.subscription;
      status = 'active';
      
      await db.query(
        'UPDATE organizations SET stripe_subscription_id = ?, subscription_tier = ?, subscription_status = ? WHERE id = ?',
        [subscriptionId, tier, status, orgId]
      );
      break;

    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      subscriptionId = session.id;
      status = session.status;
      if (event.type === 'customer.subscription.deleted') {
        await db.query(
          'UPDATE organizations SET subscription_tier = \'Free\', subscription_status = \'canceled\' WHERE stripe_subscription_id = ?',
          [subscriptionId]
        );
      } else {
        await db.query(
          'UPDATE organizations SET subscription_status = ? WHERE stripe_subscription_id = ?',
          [status, subscriptionId]
        );
      }
      break;
  }

  res.json({ received: true });
};

// Get current billing status
router.get('/status', async (req, res) => {
  const orgId = req.user.organization_id;
  const orgs = await db.query('SELECT subscription_tier, subscription_status, is_beta FROM organizations WHERE id = ?', [orgId]);
  const status = { ...orgs[0] };
  
  // Beta testers get Pro tier benefits
  if (status.is_beta && status.subscription_tier === 'Free') {
    status.subscription_tier = 'Pro';
  }
  
  res.json(status);
});

module.exports = router;
module.exports.webhookHandler = webhookHandler;
