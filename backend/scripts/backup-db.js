const fs = require('fs');
const path = require('path');
const db = require('../db');
const logger = require('../utils/logger');

const BACKUP_DIR = path.join(__dirname, '../../backups');

const tables = [
  'organizations',
  'users',
  'categories',
  'products',
  'stock_transactions'
];

async function runBackup() {
  try {
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupData = {};

    for (const table of tables) {
      console.log(`Backing up table: ${table}...`);
      // Since table names cannot be parameterized, we use a whitelist approach (which we already have)
      // but we'll use the literal string from the whitelist to be safe.
      const safeTable = tables.find(t => t === table);
      if (!safeTable) continue;
      
      const rows = await db.query('SELECT * FROM ' + safeTable, []);
      backupData[safeTable] = rows;
    }

    const backupFile = path.join(BACKUP_DIR, `backup-${timestamp}.json`);
    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));

    console.log(`Backup completed successfully: ${backupFile}`);
    logger.info(`Database backup completed: ${backupFile}`);
  } catch (error) {
    console.error('Backup failed:', error);
    logger.error(error, { action: 'database-backup' });
    process.exit(1);
  }
}

runBackup();
