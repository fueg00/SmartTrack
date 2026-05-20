require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('./db');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const port = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'smarttrack-secret-key';

const { authenticateToken, asyncHandler } = require('./middleware/auth');

const ENABLE_REFERRALS = process.env.ENABLE_REFERRALS === 'true';

/**
 * UTILS
 */
function generateReferralCode(name, id) {
  const cleanName = name.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 4);
  const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${cleanName}-${randomStr}-${id}`;
}

// Stripe Webhook needs raw body, must come BEFORE express.json()
const billingRouter = require('./routes/billing');
// Webhook route - directly use the handler exported from billing.js
app.post('/api/billing/webhook', express.raw({ type: 'application/json' }), billingRouter.webhookHandler);

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Subscription Middleware
const { checkProductLimit, checkTransactionLimit } = require('./middleware/subscription');

// Referrals
if (ENABLE_REFERRALS) {
  const referralsRouter = require('./routes/referrals');
  app.use('/api/referrals', authenticateToken, referralsRouter);
}

// Mount billing routes for other endpoints
app.use('/api/billing', authenticateToken, billingRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

/**
 * AUTH ROUTES
 */

// Register
app.post('/api/auth/register', asyncHandler(async (req, res) => {
  const { orgName, email, password, inviteCode, referralCode } = req.body;
  
  if (!orgName || !email || !password) {
    const err = new Error('Organization name, email, and password are required');
    err.status = 400;
    throw err;
  }

  const isBeta = inviteCode === 'BETA2026' ? 1 : 0;

  // 1. Create Organization
  let tier = 'Pro';
  let trialDays = 60;
  let referrerOrgId = null;

  if (isBeta) {
    tier = 'Pro';
    trialDays = 60;
  }

  if (ENABLE_REFERRALS && referralCode) {
    const referrers = await db.query('SELECT id FROM organizations WHERE referral_code = ?', [referralCode]);
    if (referrers.length > 0) {
      referrerOrgId = referrers[0].id;
      tier = 'Pro';
      trialDays = 60;
    }
  }

  const trialEndDate = trialDays > 0 ? new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000).toISOString() : null;

  await db.query(
    'INSERT INTO organizations (name, is_beta, subscription_tier, trial_end_date) VALUES (?, ?, ?, ?)', 
    [orgName, isBeta, tier, trialEndDate]
  );
  
  const orgs = await db.query('SELECT id FROM organizations WHERE name = ? ORDER BY id DESC LIMIT 1', [orgName]);
  const organizationId = orgs[0].id;

  // Generate referral code for the new organization
  if (ENABLE_REFERRALS) {
    const myReferralCode = generateReferralCode(orgName, organizationId);
    await db.query('UPDATE organizations SET referral_code = ? WHERE id = ?', [myReferralCode, organizationId]);

    // Handle Referral Reward for Referrer
    if (referrerOrgId) {
      await db.query(
        'INSERT INTO referrals (referrer_org_id, referred_org_id, referral_code, reward_applied) VALUES (?, ?, ?, 1)',
        [referrerOrgId, organizationId, referralCode]
      );

      const referrer = await db.query('SELECT subscription_tier, trial_end_date FROM organizations WHERE id = ?', [referrerOrgId]);
      let newTier = referrer[0].subscription_tier;
      if (newTier === 'Free') newTier = 'Pro';
      
      let baseDate = Date.now();
      if (referrer[0].trial_end_date && new Date(referrer[0].trial_end_date) > new Date()) {
        baseDate = new Date(referrer[0].trial_end_date).getTime();
      }
      const newTrialEnd = new Date(baseDate + 30 * 24 * 60 * 60 * 1000);
      
      await db.query(
        'UPDATE organizations SET subscription_tier = ?, trial_end_date = ? WHERE id = ?',
        [newTier, newTrialEnd.toISOString(), referrerOrgId]
      );
    }
  }

  // 2. Create Default Categories
  const defaultCategories = ['Electronics', 'Office Supplies', 'Furniture', 'Raw Materials'];
  for (const cat of defaultCategories) {
    await db.query('INSERT INTO categories (organization_id, name, description) VALUES (?, ?, ?)', [organizationId, cat, 'Default category']);
  }

  // 3. Create User
  const passwordHash = await bcrypt.hash(password, 10);
  await db.query('INSERT INTO users (organization_id, email, password_hash, role) VALUES (?, ?, ?, ?)', 
                  [organizationId, email, passwordHash, 'Owner']);

  res.status(201).json({ message: 'Organization and user created successfully' });
}));

// Login
app.post('/api/auth/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const users = await db.query('SELECT * FROM users WHERE email = ?', [email]);
  
  if (users.length === 0) {
    const err = new Error('Invalid email or password');
    err.status = 401;
    throw err;
  }
  
  const user = users[0];
  const validPassword = await bcrypt.compare(password, user.password_hash);
  if (!validPassword) {
    const err = new Error('Invalid email or password');
    err.status = 401;
    throw err;
  }
  
  const token = jwt.sign({ id: user.id, organization_id: user.organization_id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token, user: { id: user.id, email: user.email, role: user.role, organization_id: user.organization_id } });
}));

/**
 * PRODUCTS
 */

// Get all products (with search and category filter)
app.get('/api/products', authenticateToken, asyncHandler(async (req, res) => {
  const { search, category_id } = req.query;
  const orgId = req.user.organization_id;

  let sql = 'SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.organization_id = ?';
  const params = [orgId];

  if (search) {
    sql += ' AND (p.name LIKE ? OR p.sku LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  if (category_id) {
    sql += ' AND p.category_id = ?';
    params.push(category_id);
  }

  const products = await db.query(sql, params);
  res.json(products);
}));

// Get single product
app.get('/api/products/:id', authenticateToken, asyncHandler(async (req, res) => {
  const orgId = req.user.organization_id;
  const product = await db.query('SELECT * FROM products WHERE id = ? AND organization_id = ?', [req.params.id, orgId]);
  if (product.length === 0) {
    const err = new Error('Product not found');
    err.status = 404;
    throw err;
  }
  res.json(product[0]);
}));

// Create product
app.post('/api/products', authenticateToken, checkProductLimit, asyncHandler(async (req, res) => {
  const { name, sku, category_id, description, unit_price, unit_cost, reorder_point } = req.body;
  const orgId = req.user.organization_id;

  const sql = 'INSERT INTO products (organization_id, name, sku, category_id, description, unit_price, unit_cost, reorder_point, current_stock) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)';
  await db.query(sql, [orgId, name, sku, category_id || null, description || '', unit_price, unit_cost, reorder_point || 0]);

  res.status(201).json({ message: 'Product created' });
}));

// Update product
app.put('/api/products/:id', authenticateToken, asyncHandler(async (req, res) => {
  const { name, sku, category_id, description, unit_price, unit_cost, reorder_point } = req.body;
  const orgId = req.user.organization_id;

  const sql = `UPDATE products SET 
               name = ?, 
               sku = ?, 
               category_id = ?, 
               description = ?, 
               unit_price = ?, 
               unit_cost = ?, 
               reorder_point = ? 
               WHERE id = ? AND organization_id = ?`;
  await db.query(sql, [name, sku, category_id || null, description || '', unit_price, unit_cost, reorder_point || 0, req.params.id, orgId]);

  res.json({ message: 'Product updated' });
}));

// Delete product
app.delete('/api/products/:id', authenticateToken, asyncHandler(async (req, res) => {
  const orgId = req.user.organization_id;
  await db.query('DELETE FROM products WHERE id = ? AND organization_id = ?', [req.params.id, orgId]);
  res.json({ message: 'Product deleted' });
}));

/**
 * CATEGORIES
 */

app.get('/api/categories', authenticateToken, asyncHandler(async (req, res) => {
  const orgId = req.user.organization_id;
  const categories = await db.query('SELECT * FROM categories WHERE organization_id = ? OR organization_id IS NULL', [orgId]);
  res.json(categories);
}));

/**
 * STOCK ADJUSTMENTS
 */

app.post('/api/stock-adjustments', authenticateToken, checkTransactionLimit, asyncHandler(async (req, res) => {
  const { product_id, change_amount, reason } = req.body;
  const orgId = req.user.organization_id;
  
  // 1. Verify product belongs to organization
  const products = await db.query('SELECT id FROM products WHERE id = ? AND organization_id = ?', [product_id, orgId]);
  if (products.length === 0) {
    const err = new Error('Unauthorized product adjustment');
    err.status = 403;
    throw err;
  }

  // 2. Log transaction
  const logSql = 'INSERT INTO stock_transactions (organization_id, product_id, change_amount, reason) VALUES (?, ?, ?, ?)';
  await db.query(logSql, [orgId, product_id, change_amount, reason]);
  
  // 3. Update product stock
  const updateSql = 'UPDATE products SET current_stock = current_stock + ? WHERE id = ? AND organization_id = ?';
  await db.query(updateSql, [change_amount, product_id, orgId]);
  
  res.json({ message: 'Stock adjusted successfully' });
}));

/**
 * DASHBOARD
 */

app.get('/api/dashboard/stats', authenticateToken, asyncHandler(async (req, res) => {
  const orgId = req.user.organization_id;
  const totalProducts = await db.query('SELECT COUNT(*) as count FROM products WHERE organization_id = ?', [orgId]);
  const inventoryValue = await db.query('SELECT SUM(current_stock * unit_cost) as value FROM products WHERE organization_id = ?', [orgId]);
  const lowStockCount = await db.query('SELECT COUNT(*) as count FROM products WHERE current_stock <= reorder_point AND organization_id = ?', [orgId]);
  
  res.json({
    totalProducts: totalProducts[0].count,
    inventoryValue: inventoryValue[0].value || 0,
    lowStockCount: lowStockCount[0].count
  });
}));

app.get('/api/dashboard/low-stock', authenticateToken, asyncHandler(async (req, res) => {
  const orgId = req.user.organization_id;
  const lowStockItems = await db.query('SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.current_stock <= p.reorder_point AND p.organization_id = ?', [orgId]);
  res.json(lowStockItems);
}));

/**
 * FEEDBACK
 */
app.post('/api/feedback', authenticateToken, asyncHandler(async (req, res) => {
  const { category, subject, message, current_url, browser_info } = req.body;
  const orgId = req.user.organization_id;
  const userId = req.user.id;

  if (!category || !subject || !message) {
    const err = new Error('Category, subject, and message are required');
    err.status = 400;
    throw err;
  }

  await db.query(
    'INSERT INTO beta_feedback (organization_id, user_id, category, subject, message, current_url, browser_info) ' +
    'VALUES (?, ?, ?, ?, ?, ?, ?)',
    [orgId, userId, category, subject, message, current_url || '', browser_info || '']
  );

  res.status(201).json({ message: 'Feedback submitted successfully' });
}));

// Error Handler Middleware
app.use(errorHandler);

app.listen(port, '0.0.0.0', () => {
  console.log(`Backend listening on http://0.0.0.0:${port}`);
});
