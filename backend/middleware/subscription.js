const db = require('../db');

const TIER_LIMITS = {
  Free: {
    maxProducts: 50,
    maxUsers: 1,
    maxTransactionsPerMonth: 100
  },
  Pro: {
    maxProducts: 1000,
    maxUsers: 5,
    maxTransactionsPerMonth: Infinity
  },
  Enterprise: {
    maxProducts: Infinity,
    maxUsers: Infinity,
    maxTransactionsPerMonth: Infinity
  }
};

const checkProductLimit = async (req, res, next) => {
  const orgId = req.user.organization_id;
  const orgs = await db.query('SELECT subscription_tier, is_beta, trial_end_date FROM organizations WHERE id = ?', [orgId]);
  let tier = orgs[0]?.subscription_tier || 'Free';
  const trialEndDate = orgs[0]?.trial_end_date;
  
  // Beta testers or those with an active trial get Pro tier limits (at minimum)
  if ((orgs[0]?.is_beta || (trialEndDate && new Date(trialEndDate) > new Date())) && tier === 'Free') {
    tier = 'Pro';
  }

  const limits = TIER_LIMITS[tier];

  if (limits.maxProducts !== Infinity) {
    const products = await db.query('SELECT COUNT(*) as count FROM products WHERE organization_id = ?', [orgId]);
    if (products[0].count >= limits.maxProducts) {
      return res.status(403).json({ 
        error: `Product limit reached for ${tier} tier (${limits.maxProducts} products). Please upgrade to add more.` 
      });
    }
  }
  next();
};

const checkTransactionLimit = async (req, res, next) => {
  const orgId = req.user.organization_id;
  const orgs = await db.query('SELECT subscription_tier, is_beta, trial_end_date FROM organizations WHERE id = ?', [orgId]);
  let tier = orgs[0]?.subscription_tier || 'Free';
  const trialEndDate = orgs[0]?.trial_end_date;

  // Beta testers or those with an active trial get Pro tier limits (at minimum)
  if ((orgs[0]?.is_beta || (trialEndDate && new Date(trialEndDate) > new Date())) && tier === 'Free') {
    tier = 'Pro';
  }

  const limits = TIER_LIMITS[tier];

  if (limits.maxTransactionsPerMonth !== Infinity) {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const transactions = await db.query(
      'SELECT COUNT(*) as count FROM stock_transactions WHERE organization_id = ? AND created_at LIKE ?',
      [orgId, `${currentMonth}%`]
    );
    
    if (transactions[0].count >= limits.maxTransactionsPerMonth) {
      return res.status(403).json({ 
        error: `Monthly transaction limit reached for ${tier} tier (${limits.maxTransactionsPerMonth} transactions). Please upgrade.` 
      });
    }
  }
  next();
};

module.exports = {
  TIER_LIMITS,
  checkProductLimit,
  checkTransactionLimit
};
