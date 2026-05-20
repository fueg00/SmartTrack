const express = require('express');
const db = require('../db');
const { authenticateToken, asyncHandler } = require('../middleware/auth');
const router = express.Router();

// Get current organization's referral code and stats
router.get('/stats', authenticateToken, asyncHandler(async (req, res) => {
  const orgId = req.user.organization_id;
  
  const orgs = await db.query('SELECT referral_code, trial_end_date, subscription_tier FROM organizations WHERE id = ?', [orgId]);
  const referrals = await db.query(`
    SELECT r.*, o.name as referred_org_name 
    FROM referrals r 
    JOIN organizations o ON r.referred_org_id = o.id 
    WHERE r.referrer_org_id = ?
    ORDER BY r.created_at DESC
  `, [orgId]);

  res.json({
    referralCode: orgs[0].referral_code,
    trialEndDate: orgs[0].trial_end_date,
    subscriptionTier: orgs[0].subscription_tier,
    referrals: referrals
  });
}));

// Invite a business via email (Simulated)
router.post('/invite', authenticateToken, asyncHandler(async (req, res) => {
  const { email } = req.body;
  const orgId = req.user.organization_id;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const orgs = await db.query('SELECT referral_code, name FROM organizations WHERE id = ?', [orgId]);
  const referralCode = orgs[0].referral_code;

  // In a real app, we would send an email here
  console.log(`Simulating invitation email to ${email} with code ${referralCode} from ${orgs[0].name}`);

  res.json({ message: `Invitation sent to ${email}` });
}));

module.exports = router;
