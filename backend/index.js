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
 * PASSWORD RESET
 */

// In-memory store for reset tokens (dev mode — in production, store in DB or Redis)
const resetTokens = new Map();
const TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

// Clean expired tokens periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of resetTokens) {
    if (value.expiresAt < now) resetTokens.delete(key);
  }
}, 10 * 60 * 1000); // every 10 minutes

// Forgot Password — generate a reset token and log the URL
app.post('/api/auth/forgot-password', asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    const err = new Error('Email is required');
    err.status = 400;
    throw err;
  }

  // Always return success (don't reveal whether email exists)
  const users = await db.query('SELECT id, email FROM users WHERE email = ?', [email]);

  if (users.length > 0) {
    const user = users[0];
    const token = require('crypto').randomBytes(32).toString('hex');
    const expiresAt = Date.now() + TOKEN_EXPIRY_MS;

    resetTokens.set(`${user.id}:${token}`, {
      userId: user.id,
      email: user.email,
      expiresAt,
    });

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?email=${encodeURIComponent(email)}&token=${token}`;

    // Log to console (Demo Mode — no SMTP yet)
    console.log('');
    console.log('🔐 ===== PASSWORD RESET (DEMO MODE) =====');
    console.log(`📧 Email: ${email}`);
    console.log(`🔗 Reset URL: ${resetUrl}`);
    console.log(`⏰ Expires: ${new Date(expiresAt).toISOString()}`);
    console.log('=========================================');
    console.log('');
  }

  res.json({ message: 'If an account with that email exists, a reset link has been sent.' });
}));

// Reset Password — validate token and update password
app.post('/api/auth/reset-password', asyncHandler(async (req, res) => {
  const { email, token, password } = req.body;

  if (!email || !token || !password) {
    const err = new Error('Email, token, and password are required');
    err.status = 400;
    throw err;
  }

  if (password.length < 8) {
    const err = new Error('Password must be at least 8 characters');
    err.status = 400;
    throw err;
  }

  // Find the user
  const users = await db.query('SELECT id FROM users WHERE email = ?', [email]);
  if (users.length === 0) {
    const err = new Error('Invalid or expired reset link');
    err.status = 400;
    throw err;
  }

  const user = users[0];
  const storedToken = resetTokens.get(`${user.id}:${token}`);

  if (!storedToken || storedToken.expiresAt < Date.now()) {
    const err = new Error('Invalid or expired reset link');
    err.status = 400;
    throw err;
  }

  // Update password
  const bcrypt = require('bcryptjs');
  const passwordHash = await bcrypt.hash(password, 10);
  await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, user.id]);

  // Invalidate the token
  resetTokens.delete(`${user.id}:${token}`);

  res.json({ message: 'Password reset successfully' });
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

/**
 * SUPPLIERS
 */

// Get all suppliers
app.get('/api/suppliers', authenticateToken, asyncHandler(async (req, res) => {
  const orgId = req.user.organization_id;
  const suppliers = await db.query('SELECT * FROM suppliers WHERE organization_id = ? ORDER BY name', [orgId]);
  res.json(suppliers);
}));

// Create supplier
app.post('/api/suppliers', authenticateToken, asyncHandler(async (req, res) => {
  const { name, email, phone, lead_time_days, payment_terms, notes } = req.body;
  const orgId = req.user.organization_id;
  if (!name) {
    const err = new Error('Supplier name is required');
    err.status = 400;
    throw err;
  }
  await db.query(
    'INSERT INTO suppliers (organization_id, name, email, phone, lead_time_days, payment_terms, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [orgId, name, email || '', phone || '', lead_time_days || 7, payment_terms || 'Net 30', notes || '']
  );
  res.status(201).json({ message: 'Supplier created' });
}));

// Update supplier
app.put('/api/suppliers/:id', authenticateToken, asyncHandler(async (req, res) => {
  const { name, email, phone, lead_time_days, payment_terms, notes } = req.body;
  const orgId = req.user.organization_id;
  await db.query(
    'UPDATE suppliers SET name=?, email=?, phone=?, lead_time_days=?, payment_terms=?, notes=? WHERE id=? AND organization_id=?',
    [name, email || '', phone || '', lead_time_days || 7, payment_terms || 'Net 30', notes || '', req.params.id, orgId]
  );
  res.json({ message: 'Supplier updated' });
}));

// Delete supplier
app.delete('/api/suppliers/:id', authenticateToken, asyncHandler(async (req, res) => {
  const orgId = req.user.organization_id;
  await db.query('DELETE FROM suppliers WHERE id=? AND organization_id=?', [req.params.id, orgId]);
  res.json({ message: 'Supplier deleted' });
}));

/**
 * INVENTORY RUNWAY & RESTOCK PLANNER
 */

// Calculate runway for all products (days of stock remaining based on sales velocity)
app.get('/api/runway/calculate', authenticateToken, asyncHandler(async (req, res) => {
  const orgId = req.user.organization_id;

  // Get all products with supplier info
  const products = await db.query(
    `SELECT p.*, c.name as category_name, s.name as supplier_name, s.lead_time_days, s.email as supplier_email
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     LEFT JOIN suppliers s ON p.supplier_id = s.id
     WHERE p.organization_id = ?
     ORDER BY p.name`,
    [orgId]
  );

  // Calculate sales velocity from last 30 days of stock transactions (outgoing only)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const transactions = await db.query(
    `SELECT product_id, SUM(ABS(change_amount)) as total_out
     FROM stock_transactions
     WHERE organization_id = ?
       AND change_amount < 0
       AND created_at >= ?
     GROUP BY product_id`,
    [orgId, thirtyDaysAgo]
  );

  const velocityMap = {};
  for (const txn of transactions) {
    velocityMap[txn.product_id] = txn.total_out / 30; // daily avg
  }

  // Build runway data
  const runwayData = products.map(p => {
    const stock = Number(p.current_stock) || 0;
    const reorder = Number(p.reorder_point) || 0;
    const dailyVelocity = velocityMap[p.id] || 0;
    const runwayDays = dailyVelocity > 0 ? Math.floor(stock / dailyVelocity) : null;
    const leadTime = Number(p.lead_time_days) || null;
    const isAtRisk = runwayDays !== null && leadTime !== null && runwayDays <= leadTime;
    const needsRestock = stock <= reorder;
    const qtyToOrder = needsRestock ? (reorder * 2) - stock : 0; // order to 2x reorder point
    const estCost = qtyToOrder * (Number(p.unit_cost) || 0);

    return {
      id: p.id,
      name: p.name,
      sku: p.sku,
      category_name: p.category_name,
      current_stock: stock,
      reorder_point: reorder,
      unit_cost: p.unit_cost,
      unit_price: p.unit_price,
      supplier_id: p.supplier_id,
      supplier_name: p.supplier_name,
      supplier_email: p.supplier_email,
      supplier_lead_time: leadTime,
      daily_sales_velocity: Math.round(dailyVelocity * 100) / 100,
      runway_days: runwayDays,
      runway_label: runwayDays === null ? 'No sales data' : `${runwayDays} day${runwayDays !== 1 ? 's' : ''}`,
      is_at_risk: isAtRisk,
      needs_restock: needsRestock,
      recommended_order_qty: qtyToOrder,
      estimated_restock_cost: estCost
    };
  });

  res.json({
    generated_at: new Date().toISOString(),
    lookup_days: 30,
    items: runwayData,
    summary: {
      total_products: runwayData.length,
      at_risk_count: runwayData.filter(r => r.is_at_risk).length,
      needs_restock_count: runwayData.filter(r => r.needs_restock).length,
      total_restock_cost: runwayData.reduce((sum, r) => sum + r.estimated_restock_cost, 0)
    }
  });
}));

// Generate a purchase order preview/email draft for selected items
app.post('/api/runway/generate-po', authenticateToken, asyncHandler(async (req, res) => {
  const { product_ids } = req.body;
  const orgId = req.user.organization_id;

  if (!product_ids || !Array.isArray(product_ids) || product_ids.length === 0) {
    const err = new Error('product_ids must be a non-empty array');
    err.status = 400;
    throw err;
  }

  const placeholders = product_ids.map(() => '?').join(',');
  const products = await db.query(
    `SELECT p.*, s.name as supplier_name, s.email as supplier_email, s.lead_time_days
     FROM products p
     LEFT JOIN suppliers s ON p.supplier_id = s.id
     WHERE p.organization_id = ? AND p.id IN (${placeholders})`,
    [orgId, ...product_ids]
  );

  // Build PO items (restock to 2x reorder point)
  const poItems = products.map(p => {
    const stock = Number(p.current_stock) || 0;
    const reorder = Number(p.reorder_point) || 0;
    const qty = Math.max(0, (reorder * 2) - stock);
    return {
      product_id: p.id,
      product_name: p.name,
      sku: p.sku,
      current_stock: stock,
      reorder_point: reorder,
      order_qty: qty,
      unit_cost: p.unit_cost,
      line_total: qty * (Number(p.unit_cost) || 0),
      supplier_name: p.supplier_name,
      supplier_email: p.supplier_email,
      lead_time_days: p.lead_time_days
    };
  });

  const totalCost = poItems.reduce((sum, i) => sum + i.line_total, 0);

  // Group by supplier for email draft
  const bySupplier = {};
  for (const item of poItems) {
    const key = item.supplier_name || 'Unknown Supplier';
    if (!bySupplier[key]) {
      bySupplier[key] = { supplier_name: key, email: item.supplier_email || '', lead_time: item.lead_time_days || 7, items: [], total: 0 };
    }
    bySupplier[key].items.push(item);
    bySupplier[key].total += item.line_total;
  }

  res.json({
    generated_at: new Date().toISOString(),
    total_items: poItems.length,
    total_cost: totalCost,
    items: poItems,
    by_supplier: Object.values(bySupplier)
  });
}));

// Auto-generate email body for a supplier PO
app.post('/api/runway/po-email', authenticateToken, asyncHandler(async (req, res) => {
  const { supplier_name, items, org_name } = req.body;

  if (!supplier_name || !items || !Array.isArray(items)) {
    const err = new Error('supplier_name and items array are required');
    err.status = 400;
    throw err;
  }

  const orgDisplay = org_name || 'Our Organization';
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const total = items.reduce((s, i) => s + (i.line_total || 0), 0);

  let body = `Subject: Purchase Order — ${orgDisplay} (${today})\n\n`;
  body += `Dear ${supplier_name},\n\n`;
  body += `Please supply the following items for ${orgDisplay}:\n\n`;
  body += `PO #: PO-${Date.now().toString(36).toUpperCase()}\n`;
  body += `Date: ${today}\n\n`;
  body += `Items:\n`;
  body += `─${'─'.repeat(60)}\n`;

  for (const item of items) {
    body += `${item.order_qty}x ${item.product_name} (${item.sku}) — ${item.line_total.toFixed(2)}\n`;
  }

  body += `─${'─'.repeat(60)}\n`;
  body += `Total Estimated: ${total.toFixed(2)}\n\n`;
  body += `Please confirm availability and estimated shipping date.\n\n`;
  body += `Best regards,\n${orgDisplay}\n`;

  res.json({ email_body: body });
}));

// Error Handler Middleware
app.use(errorHandler);

app.listen(port, '0.0.0.0', () => {
  console.log(`Backend listening on http://0.0.0.0:${port}`);
});
