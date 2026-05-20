const db = require('../db');

const upgradeToBeta = async (email) => {
  try {
    const users = await db.query('SELECT organization_id FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      console.error(`User with email ${email} not found.`);
      return;
    }
    
    const orgId = users[0].organization_id;
    await db.query('UPDATE organizations SET is_beta = 1 WHERE id = ?', [orgId]);
    console.log(`Organization ${orgId} (for user ${email}) has been upgraded to Beta Tester status.`);
  } catch (err) {
    console.error('Error upgrading to beta:', err.message);
  }
};

const email = process.argv[2];
if (!email) {
  console.log('Usage: node upgrade-to-beta.js <user-email>');
  process.exit(1);
}

upgradeToBeta(email);
