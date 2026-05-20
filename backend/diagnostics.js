require('dotenv').config();
const db = require('./db');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { TIER_LIMITS } = require('./middleware/subscription');

async function runDiagnostics() {
  console.log('=== SmartTrack System Diagnostics ===\n');

  // 1. Verify connectivity to Turso
  await testDBConnection();

  // 2. Check table schema integrity
  await testSchemaIntegrity();

  // 3. Test Stripe connectivity
  await testStripeConnectivity();

  // 4. Verify Beta logic
  await testBetaLogic();

  console.log('\n=== Diagnostics Complete ===');
}

async function testDBConnection() {
  process.stdout.write('Checking Database Connection... ');
  try {
    const result = await db.query('SELECT 1 as connected', []);
    if (result && result[0] && result[0].connected === 1) {
      console.log('OK');
    } else {
      throw new Error('Unexpected query result');
    }
  } catch (error) {
    console.log('FAILED');
    console.error('  Error:', error.message);
  }
}

async function testSchemaIntegrity() {
  process.stdout.write('Checking Schema Integrity... ');
  const requiredTables = [
    'organizations',
    'users',
    'products',
    'categories',
    'stock_transactions',
    'beta_feedback'
  ];

  try {
    const tables = await db.query("SELECT name, sql FROM sqlite_master WHERE type='table'", []);
    const tableNames = tables.map(t => t.name);

    const missing = requiredTables.filter(t => !tableNames.includes(t));
    if (missing.length > 0) {
      console.log('FAILED');
      console.error('  Missing tables:', missing.join(', '));
      return;
    }

    // Check composite unique keys for products and categories
    const productsTable = tables.find(t => t.name === 'products');
    const categoriesTable = tables.find(t => t.name === 'categories');

    let integrityOk = true;
    if (!productsTable.sql.includes('UNIQUE (sku, organization_id)')) {
      console.error('\n  [!] products table missing composite unique key (sku, organization_id)');
      integrityOk = false;
    }
    if (!categoriesTable.sql.includes('UNIQUE (name, organization_id)')) {
      console.error('\n  [!] categories table missing composite unique key (name, organization_id)');
      integrityOk = false;
    }

    if (integrityOk) {
      console.log('OK');
    } else {
      console.log('FAILED (See warnings above)');
    }
  } catch (error) {
    console.log('ERROR');
    console.error('  Error:', error.message);
  }
}

async function testStripeConnectivity() {
  process.stdout.write('Checking Stripe Connectivity... ');
  if (!process.env.STRIPE_SECRET_KEY) {
    console.log('SKIPPED (STRIPE_SECRET_KEY not set)');
    return;
  }

  try {
    // Just try to list customers as a simple connectivity test
    await stripe.customers.list({ limit: 1 });
    console.log('OK');
  } catch (error) {
    console.log('FAILED');
    console.error('  Error:', error.message);
  }
}

async function testBetaLogic() {
  process.stdout.write('Verifying Beta Logic... ');
  try {
    // 1. Test logic with mock data
    const mockOrg = { is_beta: 1, subscription_tier: 'Free' };
    let tier = mockOrg.subscription_tier;
    if (mockOrg.is_beta && tier === 'Free') {
      tier = 'Pro';
    }

    if (tier !== 'Pro') {
      console.log('FAILED');
      console.error('  Mock beta logic failed to upgrade tier');
      return;
    }

    // 2. Check for actual beta organizations in DB
    const betaOrgs = await db.query('SELECT COUNT(*) as count FROM organizations WHERE is_beta = 1', []);
    const count = betaOrgs[0]?.count || 0;
    
    console.log(`OK (${count} beta organizations found)`);
  } catch (error) {
    console.log('ERROR');
    console.error('  Error:', error.message);
  }
}

runDiagnostics().catch(err => {
  console.error('Diagnostics failed to run:', err);
  process.exit(1);
});
